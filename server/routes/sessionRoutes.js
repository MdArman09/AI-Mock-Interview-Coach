import express from 'express';
import {
  analyzeAnswer,
  getUserHistory,
  getSessionById,
  deleteSession,
} from '../controllers/sessionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { analyzeLimiter } from '../middleware/perUserLimiter.js';
import { validate } from '../middleware/validate.js';
import { analyzeAnswerSchema, sessionParamSchema } from '../validators/schemas.js';

const router = express.Router();

// Analyze answer (strictly protected, per-user rate limited, validated input)
router.post('/analyze', protect, analyzeLimiter, validate(analyzeAnswerSchema), analyzeAnswer);

// User interview history (strictly protected)
router.get('/history', protect, getUserHistory);
router.get('/history/:id', protect, validate(sessionParamSchema, 'params'), getSessionById);
router.delete('/history/:id', protect, validate(sessionParamSchema, 'params'), deleteSession);

export default router;
