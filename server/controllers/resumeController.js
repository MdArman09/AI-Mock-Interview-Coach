import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import AdmZip from 'adm-zip';
import Resume from '../models/Resume.js';
import Question from '../models/Question.js';
import {
  analyzeResumeText,
  computeCandidateLevel,
  computeQuestionBudget,
  generateQuestionsForResume,
} from '../services/groqService.js';

// Multer memory storage: in-memory buffer only, 5MB limit, 1 file, only field 'resume'
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.fieldname !== 'resume') {
    return cb(new Error('Unexpected field: file must be uploaded under field "resume"'), false);
  }

  const isPdfExt = file.originalname.toLowerCase().endsWith('.pdf');
  const isDocxExt =
    file.originalname.toLowerCase().endsWith('.docx') ||
    file.originalname.toLowerCase().endsWith('.doc');

  if (isPdfExt || isDocxExt) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF (.pdf) and Word (.docx) documents are supported'), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1,
  },
  fileFilter,
});

/**
 * Validates file signature (magic bytes) to ensure file is genuinely PDF or DOCX.
 * PDF: starts with %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
 * DOCX: valid ZIP archive starting with PK containing word/document.xml
 */
const detectAndValidateFileSignature = (buffer) => {
  if (!buffer || buffer.length < 5) {
    return { valid: false, message: 'File is empty or corrupted.' };
  }

  // PDF signature: must start with %PDF-
  const isPdf =
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d;

  if (isPdf) {
    return { valid: true, type: 'pdf' };
  }

  // DOCX signature: ZIP header PK (0x50, 0x4B) with word/document.xml
  const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;
  if (isZip) {
    try {
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();
      const hasWordDoc = entries.some(
        (entry) =>
          entry.entryName === 'word/document.xml' ||
          entry.entryName === 'word/document.bin'
      );
      if (hasWordDoc) {
        return { valid: true, type: 'docx' };
      }
    } catch {
      return {
        valid: false,
        message: 'Corrupted DOCX archive. Please ensure your Word document is not corrupted.',
      };
    }
  }

  return {
    valid: false,
    message: 'Invalid file format. Only genuine PDF (.pdf) and Word (.docx) documents are supported.',
  };
};

/**
 * Wraps an async parsing promise in a strict timeout to prevent denial of service.
 */
const withTimeout = (promise, ms = 10000, operation = 'Document parsing') => {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${operation} timed out after ${ms / 1000} seconds`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};

/**
 * Extracts raw text from a PDF buffer using pdf-parse
 */
const extractTextFromPdf = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text || '';
};

/**
 * Extracts raw text from a DOCX buffer using mammoth
 */
const extractTextFromDocx = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
};

/**
 * In-memory set to prevent concurrent duplicate question generation requests for the same resume.
 */
const activeResumeGenerations = new Set();

/**
 * @desc    Upload, extract text, and run Stage 1 Resume Analysis (.pdf or .docx)
 * @route   POST /api/resume/upload
 * @access  Private
 */
export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FILE',
        message: 'No resume file uploaded. Please provide a .pdf or .docx file.',
      });
    }

    // Check user resume count cap (maximum 5 resumes per user)
    const existingCount = await Resume.countDocuments({ userId: req.user._id });
    if (existingCount >= 5) {
      return res.status(400).json({
        success: false,
        code: 'RESUME_LIMIT_REACHED',
        message: 'You can keep up to 5 resumes. Delete one to add another.',
      });
    }

    const { originalname, buffer } = req.file;

    // Validate true file signature, not just extension or mimetype
    const signatureCheck = detectAndValidateFileSignature(buffer);
    if (!signatureCheck.valid) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_FILE_SIGNATURE',
        message: signatureCheck.message,
      });
    }

    let extractedText = '';
    if (signatureCheck.type === 'pdf') {
      extractedText = await withTimeout(
        extractTextFromPdf(buffer),
        10000,
        'PDF extraction'
      );
    } else if (signatureCheck.type === 'docx') {
      extractedText = await withTimeout(
        extractTextFromDocx(buffer),
        10000,
        'DOCX extraction'
      );
    }

    const cleanText = extractedText.trim();

    // Cap resume text to prevent quota exhaustion and prompt ballooning
    if (cleanText.length > 30000) {
      return res.status(400).json({
        success: false,
        code: 'RESUME_TOO_LONG',
        message:
          'Extracted resume text exceeds the maximum allowed limit of 30,000 characters. Please upload a more concise resume.',
      });
    }
    const words = cleanText.split(/\s+/).filter(Boolean);

    // Edge case check: if text is empty or too short / scanned image
    if (words.length < 100) {
      return res.status(400).json({
        success: false,
        message:
          'The extracted resume text is too short or appears to be a scanned image. Please upload a text-based resume (PDF or DOCX) instead of a scanned one.',
        data: {
          wordCount: words.length,
          preview: cleanText.slice(0, 300),
        },
      });
    }

    // Stage 1: Resume analysis via Groq
    const analysis = await analyzeResumeText(cleanText);
    const level = computeCandidateLevel(analysis);
    const plannedBudget = computeQuestionBudget(analysis);

    const label = req.body?.label?.trim() || originalname;

    const resume = await Resume.create({
      userId: req.user._id,
      extractedText: cleanText,
      fileName: originalname,
      label,
      level,
      analysis,
      plannedQuestionCount: plannedBudget,
      questionsGenerated: false,
    });

    return res.status(201).json({
      success: true,
      message: 'Resume processed and analyzed successfully',
      data: {
        resumeId: resume._id,
        fileName: resume.fileName,
        label: resume.label,
        textLength: cleanText.length,
        wordCount: words.length,
        level: resume.level,
        plannedQuestionCount: resume.plannedQuestionCount,
        analysis: {
          roleTitle: analysis.roleTitle,
          totalYearsExperience: analysis.totalYearsExperience,
          experienceCount: analysis.experience?.length || 0,
          projectsCount: analysis.projects?.length || 0,
          evidencedSkillsCount: analysis.skills?.evidenced?.length || 0,
          listedSkillsCount: analysis.skills?.listedOnly?.length || 0,
          weakSpots: analysis.weakSpots || [],
          educationCount: analysis.education?.length || 0,
          certificationsCount: analysis.certifications?.length || 0,
          raw: analysis,
        },
      },
    });
  } catch (error) {
    console.error('[ResumeUpload] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process resume file',
    });
  }
};

/**
 * @desc    Stage 2: Question planning and generation in parallel batches (idempotent per resume)
 * @route   POST /api/resume/generate-questions
 * @access  Private
 */
export const generateQuestionsFromResume = async (req, res) => {
  const { resumeId, sectionIds, mockRateLimitOnSection } = req.body;

  if (!resumeId) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_REQUEST',
      message: 'resumeId is required',
    });
  }

  const lockKey = `${req.user._id.toString()}_${resumeId.toString()}`;
  if (activeResumeGenerations.has(lockKey)) {
    return res.status(429).json({
      success: false,
      code: 'AI_RATE_LIMITED',
      message: 'A question generation request is already in progress for this resume.',
      retryAfterSeconds: 5,
    });
  }

  activeResumeGenerations.add(lockKey);

  try {
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });

    if (!resume) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Resume not found',
      });
    }

    // Edge case check
    const words = resume.extractedText.trim().split(/\s+/).filter(Boolean);
    if (words.length < 100) {
      return res.status(400).json({
        success: false,
        message:
          'The extracted resume text is too short or appears to be a scanned image. Please try a text-based resume instead of a scanned one.',
      });
    }

    // Ensure resume has structured analysis (Stage 1 fallback if needed)
    let analysis = resume.analysis;
    let level = resume.level;
    let budget = resume.plannedQuestionCount;

    if (!analysis || typeof analysis !== 'object') {
      analysis = await analyzeResumeText(resume.extractedText);
      level = computeCandidateLevel(analysis);
      budget = computeQuestionBudget(analysis);

      resume.analysis = analysis;
      resume.level = level;
      resume.plannedQuestionCount = budget;
      await resume.save();
    }

    if (!budget) {
      budget = computeQuestionBudget(analysis);
    }

    const isRetry = Array.isArray(sectionIds) && sectionIds.length > 0;
    const generationOptions = {
      sectionIds: isRetry ? sectionIds : undefined,
      mockRateLimitOnSection: mockRateLimitOnSection || req.query?.mockRateLimitOnSection,
    };

    // Execute Stage 2: Question generation with queue concurrency 2 and retries
    const result = await generateQuestionsForResume(
      analysis,
      level,
      budget,
      generationOptions
    );

    const generatedQuestions = result?.questions || [];

    // Helper to map error to required codes
    const mapErrorResponse = (lastErr, defaultMsg) => {
      if (lastErr?.isRateLimit || lastErr?.upstreamStatus === 429 || result.stats?.rateLimitsCount > 0) {
        return {
          status: 429,
          body: {
            success: false,
            code: 'AI_RATE_LIMITED',
            message: 'The AI service is busy right now. Please try again soon.',
            retryAfterSeconds: lastErr?.retryAfterSeconds || 10,
          },
        };
      }
      if (lastErr?.isTimeout || lastErr?.upstreamStatus === 504) {
        return {
          status: 504,
          body: {
            success: false,
            code: 'AI_TIMEOUT',
            message: 'The AI service timed out while generating questions. Please try again.',
          },
        };
      }
      if (lastErr?.isParseError || lastErr?.upstreamStatus === 502) {
        return {
          status: 502,
          body: {
            success: false,
            code: 'AI_BAD_RESPONSE',
            message: 'The AI service returned an unusable response after retries. Please try again.',
          },
        };
      }
      return {
        status: 500,
        body: {
          success: false,
          code: 'SERVER_ERROR',
          message: lastErr?.message || defaultMsg,
        },
      };
    };

    if (isRetry) {
      // If this was a retry of specific sections:
      if (generatedQuestions.length === 0) {
        const errMapping = mapErrorResponse(
          result.lastError,
          'Failed to generate questions for the missing sections'
        );
        return res.status(errMapping.status).json(errMapping.body);
      }

      // Append newly generated questions to MongoDB
      const docsToAppend = generatedQuestions.map((q) => ({
        text: q.text,
        difficulty: ['Basic', 'Intermediate', 'Advanced'].includes(q.difficulty)
          ? q.difficulty
          : 'Intermediate',
        type: q.type || 'Behavioral',
        anchor: q.anchor || '',
        source: 'resume-generated',
        userId: req.user._id,
        resumeId: resume._id,
        category: 'Resume',
      }));

      await Question.insertMany(docsToAppend);

      const allQuestions = await Question.find({
        userId: req.user._id,
        resumeId: resume._id,
      }).sort({ createdAt: 1 });

      return res.status(200).json({
        success: true,
        message: `Appended ${docsToAppend.length} additional questions from missing sections`,
        count: allQuestions.length,
        data: allQuestions,
        failedSections: result.failedSections || [],
        isRetry: true,
        stats: result.stats,
        resume: {
          _id: resume._id,
          label: resume.label || resume.fileName,
          fileName: resume.fileName,
          createdAt: resume.createdAt,
          questionCount: allQuestions.length,
          level: resume.level,
          plannedQuestionCount: resume.plannedQuestionCount,
        },
      });
    }

    // Full Generation:
    // Partial success rule: At least 60% of planned questions AND at least 10 questions
    const minRequired = Math.max(10, Math.ceil(budget * 0.6));
    const isSufficient = generatedQuestions.length >= minRequired;

    if (!isSufficient) {
      // KEEP OLD QUESTION SET UNTOUCHED! Do NOT delete or modify existing questions in DB.
      console.warn(
        `[GenerateResumeQuestions] Insufficient questions generated (${generatedQuestions.length}/${budget}, minimum required: ${minRequired}). Preserving previous set.`
      );
      const errMapping = mapErrorResponse(
        result.lastError,
        `Generated ${generatedQuestions.length} questions, which is below the minimum threshold (${minRequired}). Previous questions preserved.`
      );
      return res.status(errMapping.status).json(errMapping.body);
    }

    // Success or Partial Success: Atomically replace existing questions for this resumeId
    await Question.deleteMany({
      userId: req.user._id,
      resumeId: resume._id,
    });

    const docs = generatedQuestions.map((q) => ({
      text: q.text,
      difficulty: ['Basic', 'Intermediate', 'Advanced'].includes(q.difficulty)
        ? q.difficulty
        : 'Intermediate',
      type: q.type || 'Behavioral',
      anchor: q.anchor || '',
      source: 'resume-generated',
      userId: req.user._id,
      resumeId: resume._id,
      category: 'Resume',
    }));

    const createdQuestions = await Question.insertMany(docs);

    resume.questionsGenerated = true;
    await resume.save();

    return res.status(200).json({
      success: true,
      message: `Generated ${createdQuestions.length} personalized questions from your resume`,
      count: createdQuestions.length,
      data: createdQuestions,
      failedSections: result.failedSections || [],
      stats: result.stats,
      resume: {
        _id: resume._id,
        label: resume.label || resume.fileName,
        fileName: resume.fileName,
        createdAt: resume.createdAt,
        questionCount: createdQuestions.length,
        level: resume.level,
        plannedQuestionCount: resume.plannedQuestionCount,
      },
    });
  } catch (error) {
    console.error('[GenerateResumeQuestions] Unexpected Error:', error);
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Failed to generate interview questions from resume',
    });
  } finally {
    activeResumeGenerations.delete(lockKey);
  }
};

/**
 * @desc    List all resumes for the authenticated user (newest first, with question counts)
 * @route   GET /api/resume
 * @access  Private
 */
export const getUserResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({ createdAt: -1 });

    const resumeList = await Promise.all(
      resumes.map(async (r) => {
        const questionCount = await Question.countDocuments({
          userId: req.user._id,
          resumeId: r._id,
        });
        return {
          _id: r._id,
          label: r.label || r.fileName,
          fileName: r.fileName,
          createdAt: r.createdAt,
          questionCount,
          level: r.level || 'fresher',
          plannedQuestionCount: r.plannedQuestionCount || 0,
          analysis: r.analysis || null,
        };
      })
    );

    // Check for legacy questions without resumeId
    const legacyCount = await Question.countDocuments({
      userId: req.user._id,
      source: 'resume-generated',
      $or: [{ resumeId: null }, { resumeId: { $exists: false } }],
    });

    if (legacyCount > 0) {
      const oldestLegacy = await Question.findOne({
        userId: req.user._id,
        source: 'resume-generated',
        $or: [{ resumeId: null }, { resumeId: { $exists: false } }],
      }).sort({ createdAt: -1 });

      resumeList.push({
        _id: 'legacy',
        label: 'Earlier questions',
        fileName: 'Earlier questions',
        createdAt: oldestLegacy?.createdAt || new Date(),
        questionCount: legacyCount,
        isLegacy: true,
      });
    }

    return res.status(200).json({
      success: true,
      count: resumeList.length,
      data: resumeList,
    });
  } catch (error) {
    console.error('[GetUserResumes] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch resumes',
    });
  }
};

/**
 * @desc    Get user's latest uploaded resume
 * @route   GET /api/resume/latest
 * @access  Private
 */
export const getLatestResume = async (req, res) => {
  try {
    const latest = await Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: latest,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch latest resume',
    });
  }
};

/**
 * @desc    Delete a resume and its associated questions (practice history in Session remains intact)
 * @route   DELETE /api/resume/:id
 * @access  Private
 */
export const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === 'legacy') {
      const deletedQuestions = await Question.deleteMany({
        userId: req.user._id,
        source: 'resume-generated',
        $or: [{ resumeId: null }, { resumeId: { $exists: false } }],
      });

      return res.status(200).json({
        success: true,
        message: 'Earlier questions deleted successfully',
        data: { deletedCount: deletedQuestions.deletedCount },
      });
    }

    const resume = await Resume.findOne({ _id: id, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Resume not found',
      });
    }

    // Delete the resume record
    await Resume.deleteOne({ _id: resume._id });

    // Delete all questions associated with this resume
    const deletedQuestions = await Question.deleteMany({
      userId: req.user._id,
      resumeId: resume._id,
    });

    // NOTE: Past practice sessions in Session model are NEVER deleted!
    return res.status(200).json({
      success: true,
      message: 'Resume and associated questions deleted successfully',
      data: {
        resumeId: resume._id,
        deletedQuestionsCount: deletedQuestions.deletedCount,
      },
    });
  } catch (error) {
    console.error('[DeleteResume] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete resume',
    });
  }
};

/**
 * @desc    Clear all resume-generated questions and uploaded resumes for the authenticated user
 * @route   DELETE /api/resume/my-questions
 * @access  Private
 */
export const clearResumeAndQuestions = async (req, res) => {
  try {
    const userId = req.user._id;

    const deletedQuestions = await Question.deleteMany({
      source: 'resume-generated',
      userId,
    });

    const deletedResumes = await Resume.deleteMany({
      userId,
    });

    return res.status(200).json({
      success: true,
      message: 'All resume questions and uploaded documents have been cleared successfully',
      data: {
        deletedQuestionsCount: deletedQuestions.deletedCount,
        deletedResumesCount: deletedResumes.deletedCount,
      },
    });
  } catch (error) {
    console.error('[ClearResumeAndQuestions] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear resume questions',
    });
  }
};
