import jwt from 'jsonwebtoken';
import Question from '../models/Question.js';
import { seedQuestions } from '../data/seedQuestions.js';
import { generateBankStarQuestions } from '../services/groqService.js';

/**
 * @desc    Get all interview questions (optional filter by category or source)
 * @route   GET /api/questions
 * @access  Public (or protected)
 */
export const getQuestions = async (req, res) => {
  try {
    const { category, source } = req.query;

    // Check for bearer token to identify user for personalized questions
    let userId = null;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Silently continue if token is invalid or expired
      }
    }

    // If querying resume-generated questions
    if (source === 'resume-generated') {
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to access resume questions',
        });
      }

      const filter = {
        source: 'resume-generated',
        userId,
      };

      const { resumeId } = req.query;
      if (resumeId) {
        if (resumeId === 'legacy') {
          filter.$or = [{ resumeId: null }, { resumeId: { $exists: false } }];
        } else {
          filter.resumeId = resumeId;
        }
      }

      const questions = await Question.find(filter).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: questions.length,
        data: questions,
      });
    }

    // Default question bank (bank questions or legacy questions without source field)
    const filter = {
      $or: [{ source: 'bank' }, { source: { $exists: false } }],
    };
    if (category && category !== 'All') {
      filter.category = category;
    }

    let questions = await Question.find(filter).sort({ createdAt: 1 });

    // Auto-seed if database is currently empty for bank questions
    if (questions.length === 0 && (!category || category === 'All')) {
      console.log('[QuestionController] Database has no questions. Auto-seeding default questions...');
      await Question.insertMany(seedQuestions);
      questions = await Question.find(filter).sort({ createdAt: 1 });
    }

    return res.status(200).json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve questions',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single question by ID
 * @route   GET /api/questions/:id
 * @access  Public (or protected)
 */
export const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Question not found',
      });
    }

    // If this is a personalized resume question, enforce ownership
    const isResumeQuestion =
      Boolean(question.resumeId) ||
      Boolean(question.userId) ||
      question.source === 'resume-generated';

    if (isResumeQuestion) {
      let authUserId = null;
      if (req.user?._id) {
        authUserId = req.user._id.toString();
      } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          authUserId = decoded.id;
        } catch {
          // Invalid or expired token
        }
      }

      if (!authUserId || !question.userId || question.userId.toString() !== authUserId) {
        return res.status(404).json({
          success: false,
          code: 'NOT_FOUND',
          message: 'Question not found',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve question',
      error: error.message,
    });
  }
};

/**
 * @desc    Manual re-seed of default questions
 * @route   POST /api/questions/seed
 * @access  Public
 */
export const seedQuestionsHandler = async (req, res) => {
  try {
    // Only delete bank questions, never touch resume questions
    await Question.deleteMany({
      $or: [{ source: 'bank' }, { source: { $exists: false } }],
    });
    const inserted = await Question.insertMany(seedQuestions);

    return res.status(201).json({
      success: true,
      message: `Successfully seeded ${inserted.length} interview questions`,
      data: inserted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to seed questions',
      error: error.message,
    });
  }
};

/**
 * @desc    Refresh question bank with new dynamic STAR interview questions
 * @route   POST /api/questions/refresh
 * @access  Public (or protected)
 */
export const refreshQuestionBankHandler = async (req, res) => {
  try {
    let freshQuestions = [];

    // 1. Try generating dynamic STAR questions with Groq AI (Hybrid Option 3)
    try {
      freshQuestions = await generateBankStarQuestions();
    } catch (aiError) {
      console.warn('[QuestionController] AI question generation fallback triggered:', aiError.message);
      // Fallback: shuffle and select from seed questions
      const shuffled = [...seedQuestions].sort(() => 0.5 - Math.random());
      freshQuestions = shuffled.slice(0, 12);
    }

    if (!freshQuestions || freshQuestions.length === 0) {
      freshQuestions = seedQuestions;
    }

    // 2. CRITICAL CONSTRAINT: ONLY delete generic bank questions!
    // NEVER delete or touch resume-generated questions (source === 'resume-generated')
    await Question.deleteMany({
      $or: [{ source: 'bank' }, { source: { $exists: false } }],
    });

    // 3. Format and save new bank questions
    const docs = freshQuestions.map((q) => ({
      text: q.text,
      category: q.category || 'Behavioral',
      difficulty: q.difficulty || 'Medium',
      source: 'bank',
      userId: null,
      sampleAnswer: q.sampleAnswer || '',
    }));

    const inserted = await Question.insertMany(docs);

    return res.status(200).json({
      success: true,
      message: `Successfully refreshed question bank with ${inserted.length} new STAR questions`,
      count: inserted.length,
      data: inserted,
    });
  } catch (error) {
    console.error('Error refreshing question bank:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to refresh question bank',
      error: error.message,
    });
  }
};
