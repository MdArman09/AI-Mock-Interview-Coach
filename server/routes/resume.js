import express from 'express';
import {
  upload,
  uploadResume,
  generateQuestionsFromResume,
  getUserResumes,
  getLatestResume,
  deleteResume,
  clearResumeAndQuestions,
} from '../controllers/resumeController.js';
import protect from '../middleware/authMiddleware.js';
import {
  resumeUploadLimiter,
  generateQuestionsLimiter,
} from '../middleware/perUserLimiter.js';
import { validate } from '../middleware/validate.js';
import {
  generateQuestionsSchema,
  resumeIdParamSchema,
} from '../validators/schemas.js';

const router = express.Router();

// List user's resumes
router.get('/', protect, getUserResumes);

// Upload resume file and extract text (per-user rate limit, memoryStorage, 5MB cap)
router.post('/upload', protect, resumeUploadLimiter, upload.single('resume'), uploadResume);

// Generate questions from extracted resume text using Groq (per-user rate limit, idempotent)
router.post(
  '/generate-questions',
  protect,
  generateQuestionsLimiter,
  validate(generateQuestionsSchema),
  generateQuestionsFromResume
);

// Get latest uploaded resume
router.get('/latest', protect, getLatestResume);

// Clear user's resume and all resume-generated questions
router.delete('/my-questions', protect, clearResumeAndQuestions);

// Delete specific resume and its associated questions (keeps history sessions intact)
router.delete('/:id', protect, validate(resumeIdParamSchema, 'params'), deleteResume);

export default router;
