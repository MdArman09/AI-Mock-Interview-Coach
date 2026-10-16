import express from 'express';
import {
  getQuestions,
  getQuestionById,
  seedQuestionsHandler,
  refreshQuestionBankHandler,
} from '../controllers/questionController.js';
import { validate } from '../middleware/validate.js';
import { questionIdParamSchema } from '../validators/schemas.js';

const router = express.Router();

router.get('/', getQuestions);
router.post('/refresh', refreshQuestionBankHandler);
router.get('/:id', validate(questionIdParamSchema, 'params'), getQuestionById);
router.post('/seed', seedQuestionsHandler);

export default router;
