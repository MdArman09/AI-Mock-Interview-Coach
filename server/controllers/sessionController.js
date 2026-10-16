import Session from '../models/Session.js';
import Question from '../models/Question.js';
import Resume from '../models/Resume.js';
import { evaluateAnswer, computeObjectiveMetrics } from '../services/groqService.js';

/**
 * @desc    Analyze interview transcript with Groq AI & save session
 * @route   POST /api/analyze
 * @access  Private (JWT protected)
 */
export const analyzeAnswer = async (req, res) => {
  try {
    const { questionId, questionText, transcript, audioDuration = 0, category = 'Behavioral' } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_TRANSCRIPT',
        message: 'A spoken answer transcript is required for evaluation',
      });
    }

    if (transcript.length > 6000) {
      return res.status(400).json({
        success: false,
        code: 'TRANSCRIPT_TOO_LONG',
        message: 'Transcript exceeds maximum allowed length of 6,000 characters.',
      });
    }

    // 1. Compute objective metrics in code, not in the LLM
    const metrics = computeObjectiveMetrics(transcript, audioDuration);

    if (metrics.wordCount < 5) {
      return res.status(400).json({
        success: false,
        code: 'TRANSCRIPT_TOO_SHORT',
        message: 'Answer is too short to evaluate. Please provide a more detailed response.',
      });
    }

    // 2. Look up the question document to snapshot question source, resume info, and metadata
    let questionSource = 'bank';
    let resumeId = null;
    let resumeLabel = null;
    let difficulty = null;
    let questionType = null;
    let anchor = null;
    let resumeContext = null;

    if (questionId) {
      const questionDoc = await Question.findById(questionId);
      if (!questionDoc) {
        return res.status(404).json({
          success: false,
          code: 'NOT_FOUND',
          message: 'Question not found',
        });
      }

      // Authorization guard: If this is a user-owned resume question, enforce ownership
      if (questionDoc.userId && questionDoc.userId.toString() !== req.user._id.toString()) {
        return res.status(404).json({
          success: false,
          code: 'NOT_FOUND',
          message: 'Question not found',
        });
      }

      difficulty = questionDoc.difficulty || null;
      questionType = questionDoc.type || questionDoc.category || null;
      anchor = questionDoc.anchor || null;

      const isResumeQuestion =
        Boolean(questionDoc.resumeId) ||
        questionDoc.source === 'resume-generated' ||
        questionDoc.category === 'Resume';

      if (isResumeQuestion) {
        questionSource = 'resume';
        if (questionDoc.resumeId) {
          resumeId = questionDoc.resumeId;
          // Strictly scope resume lookup to req.user._id
          const resumeDoc = await Resume.findOne({ _id: questionDoc.resumeId, userId: req.user._id });
          if (resumeDoc) {
            resumeLabel = resumeDoc.label || resumeDoc.fileName || 'Resume';
            if (resumeDoc.extractedText) {
              resumeContext = resumeDoc.extractedText.slice(0, 3000);
            }
          }
        }

        if (!resumeLabel) {
          resumeLabel = questionDoc.resumeLabel || 'Resume';
        }

        // Fallback for context if resumeDoc not found
        if (!resumeContext && req.user?._id) {
          const latestResume = await Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
          if (latestResume?.extractedText) {
            resumeContext = latestResume.extractedText.slice(0, 3000);
          }
        }
      }
    }

    // 3. Call Groq AI service with precomputed metrics and resume context
    const evaluation = await evaluateAnswer({
      questionText: questionText || 'Interview Question',
      transcript,
      category,
      resumeContext,
      precomputedMetrics: metrics,
    });

    // 4. Coerce all scores strictly with Number() and ensure valid numeric boundaries
    const starStructure = Number(evaluation.starStructure);
    const clarity = Number(evaluation.clarity);
    const fillerWordCount = Number(metrics.fillerWordCount);
    const fillerScore = Number(evaluation.fillerScore);
    const overall = Number(evaluation.overall);
    const durationSeconds = Number(metrics.durationSeconds);
    const wpm = Number(metrics.wpm);

    // 5. Save session strictly linked to the authenticated user with snapshot fields
    const session = await Session.create({
      userId: req.user._id,
      questionId: questionId || undefined,
      questionText: questionText || 'Custom Question',
      questionSource,
      resumeId: resumeId || undefined,
      resumeLabel: resumeLabel || undefined,
      difficulty: difficulty || undefined,
      questionType: questionType || undefined,
      anchor: anchor || undefined,
      transcript,
      audioDuration: durationSeconds,
      wpm,
      scores: {
        starStructure: !isNaN(starStructure) ? starStructure : 0,
        clarity: !isNaN(clarity) ? clarity : 0,
        fillerWordCount: !isNaN(fillerWordCount) ? fillerWordCount : 0,
        fillerScore: !isNaN(fillerScore) ? fillerScore : 10,
        overall: !isNaN(overall) ? overall : 0,
      },
      starBreakdown: evaluation.starBreakdown,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      improvedOpening: evaluation.improvedOpening,
      isGibberishOrOffTopic: Boolean(evaluation.isGibberishOrOffTopic),
      modelAnswerType: evaluation.modelAnswerType || (evaluation.isGibberishOrOffTopic ? 'exemplary_benchmark' : 'restructure'),
      suggestions: evaluation.improvements, // Keep suggestions populated, mapped from improvements
    });

    return res.status(201).json({
      success: true,
      message: 'Interview evaluated and session recorded successfully',
      data: session,
    });
  } catch (error) {
    console.error('[SessionController] Error analyzing answer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to evaluate interview answer',
      error: error.message,
    });
  }
};

/**
 * @desc    Get authenticated user's session history with deleted-resume indicator
 * @route   GET /api/history
 * @access  Private (JWT protected)
 */
export const getUserHistory = async (req, res) => {
  try {
    const history = await Session.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Check which resumes currently exist for this user
    const userResumes = await Resume.find({ userId: req.user._id }).select('_id');
    const existingResumeIdSet = new Set(userResumes.map((r) => r._id.toString()));

    const formattedHistory = history.map((session) => {
      let displayResumeLabel = session.resumeLabel;
      let resumeDeleted = false;

      if (session.questionSource === 'resume') {
        const hasResumeId = Boolean(session.resumeId);
        const exists = hasResumeId && existingResumeIdSet.has(session.resumeId.toString());
        if (hasResumeId && !exists) {
          resumeDeleted = true;
          const baseLabel = session.resumeLabel || 'Resume';
          displayResumeLabel = baseLabel.toLowerCase().includes('(deleted)')
            ? baseLabel
            : `${baseLabel} (deleted)`;
        }
      }

      return {
        ...session,
        resumeLabel: displayResumeLabel || session.resumeLabel,
        resumeDeleted,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedHistory.length,
      data: formattedHistory,
    });
  } catch (error) {
    console.error('[SessionController] Error fetching history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve session history',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single session details
 * @route   GET /api/history/:id
 * @access  Private (JWT protected)
 */
export const getSessionById = async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Session not found',
      });
    }

    const sessionObj = session.toObject();
    if (sessionObj.questionSource === 'resume' && sessionObj.resumeId) {
      const resumeExists = await Resume.exists({ _id: sessionObj.resumeId, userId: req.user._id });
      if (!resumeExists) {
        sessionObj.resumeDeleted = true;
        const baseLabel = sessionObj.resumeLabel || 'Resume';
        sessionObj.resumeLabel = baseLabel.toLowerCase().includes('(deleted)')
          ? baseLabel
          : `${baseLabel} (deleted)`;
      }
    }

    return res.status(200).json({
      success: true,
      data: sessionObj,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Error fetching session',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a past session
 * @route   DELETE /api/history/:id
 * @access  Private (JWT protected)
 */
export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Session not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete session',
      error: error.message,
    });
  }
};
