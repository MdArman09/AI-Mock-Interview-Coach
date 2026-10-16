import express from 'express';
import { submitContact } from '../controllers/contactController.js';
import { contactLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../middleware/validate.js';
import { contactSchema } from '../validators/schemas.js';

const router = express.Router();

// POST /api/contact - Submit contact inquiry, feature suggestion, or audio bug report
router.post('/', contactLimiter, validate(contactSchema), submitContact);

export default router;
