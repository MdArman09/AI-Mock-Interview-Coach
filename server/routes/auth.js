import express from 'express';
import {
  register,
  login,
  googleAuth,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
  deleteAccount,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  loginIpLimiter,
  loginFailedLimiter,
  registerLimiter,
  forgotLimiter,
  resendLimiter,
  verifyLimiter,
  resetLimiter,
  deleteAccountLimiter,
} from '../middleware/rateLimiters.js';
import { validate } from '../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  deleteAccountSchema,
} from '../validators/schemas.js';

const router = express.Router();

router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/verify-email', verifyLimiter, validate(verifyEmailSchema), verifyEmail);
router.post('/resend-verification', resendLimiter, validate(resendVerificationSchema), resendVerification);
router.post('/login', loginIpLimiter, validate(loginSchema), loginFailedLimiter, login);
router.post('/google', loginIpLimiter, validate(googleAuthSchema), googleAuth);
router.post('/forgot-password', forgotLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', resetLimiter, validate(resetPasswordSchema), resetPassword);
router.get('/me', protect, getMe);
router.delete('/account', protect, deleteAccountLimiter, validate(deleteAccountSchema), deleteAccount);

export default router;
