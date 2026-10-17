import { z } from 'zod';
import { objectIdSchema } from '../middleware/validate.js';

// ==========================================
// Auth Schemas
// ==========================================

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Please provide a valid email address')
      .max(100, 'Email cannot exceed 100 characters'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password cannot exceed 72 characters'),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Please provide a valid email address')
      .max(100, 'Email cannot exceed 100 characters'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required')
      .max(72, 'Password cannot exceed 72 characters'),
  })
  .strict();

export const verifyEmailSchema = z
  .object({
    token: z.string().trim().min(6).max(128).optional(),
    email: z.string().trim().email('Please provide a valid email address').optional(),
    code: z.string().trim().regex(/^\d{6}$/, 'Verification code must be 6 digits').optional(),
  })
  .refine((data) => Boolean(data.token || (data.email && data.code)), {
    message: 'Either verification token or email and 6-digit code must be provided',
  });

export const resendVerificationSchema = z
  .object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Please provide a valid email address')
      .max(100, 'Email cannot exceed 100 characters'),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Please provide a valid email address')
      .max(100, 'Email cannot exceed 100 characters'),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z
      .string({ required_error: 'Reset token is required' })
      .trim()
      .min(32, 'Invalid reset token format')
      .max(128, 'Invalid reset token format'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password cannot exceed 72 characters'),
  })
  .strict();

export const googleAuthSchema = z
  .object({
    credential: z.string().trim().optional(),
    accessToken: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.credential || data.accessToken), {
    message: 'Either Google credential or accessToken must be provided',
  });

export const deleteAccountSchema = z
  .object({
    password: z
      .string({ required_error: 'Current password is required to delete your account' })
      .min(1, 'Password is required')
      .max(72),
  })
  .strict();

// ==========================================
// Session / Analyze Schemas
// ==========================================

export const analyzeAnswerSchema = z
  .object({
    transcript: z
      .string({ required_error: 'Spoken transcript is required' })
      .trim()
      .min(1, 'A spoken answer transcript is required')
      .max(6000, 'Transcript exceeds maximum allowed length of 6,000 characters'),
    questionText: z
      .string({ required_error: 'Question text is required' })
      .trim()
      .min(1, 'Question text cannot be empty')
      .max(1000, 'Question text cannot exceed 1,000 characters'),
    category: z.string().trim().max(100).optional(),
    audioDuration: z.number().min(0).max(7200).optional(),
    questionId: objectIdSchema.optional().nullable(),
    resumeId: objectIdSchema.optional().nullable(),
  })
  .strict();

export const sessionParamSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict();

// ==========================================
// Resume Schemas
// ==========================================

export const generateQuestionsSchema = z
  .object({
    resumeId: objectIdSchema,
    role: z.string().trim().max(100).optional(),
    sectionIds: z.array(z.string()).optional(),
    mockRateLimitOnSection: z.string().optional(),
  })
  .strict();

export const resumeIdParamSchema = z
  .object({
    id: z.union([objectIdSchema, z.literal('legacy')]),
  })
  .strict();

// ==========================================
// User Profile Schemas
// ==========================================

export const updateProfileSchema = z
  .object({
    name: z.string().trim().max(50).optional(),
    targetJob: z.string().trim().max(100).optional(),
    experienceLevel: z.string().trim().max(50).optional(),
    coachPreference: z.string().trim().max(50).optional(),
    profile: z
      .object({
        name: z.string().trim().max(50).optional(),
        targetJob: z.string().trim().max(100).optional(),
        experienceLevel: z.string().trim().max(50).optional(),
        coachPreference: z.string().trim().max(50).optional(),
      })
      .optional(),
  })
  .strict();

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').max(72),
    confirmPassword: z.string().optional(),
  })
  .strict();

// ==========================================
// Question Schemas
// ==========================================

export const questionIdParamSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict();

// ==========================================
// Contact & Feedback Schemas
// ==========================================

export const contactSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(60, 'Name cannot exceed 60 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Please provide a valid email address')
      .max(100, 'Email cannot exceed 100 characters'),
    category: z
      .enum(['audio_mic', 'feature_request', 'bug_report', 'general'], {
        errorMap: () => ({ message: 'Please select a valid inquiry category' }),
      })
      .default('general'),
    subject: z
      .string()
      .trim()
      .max(120, 'Subject cannot exceed 120 characters')
      .optional()
      .default(''),
    message: z
      .string({ required_error: 'Message is required' })
      .trim()
      .min(10, 'Message must be at least 10 characters')
      .max(3000, 'Message cannot exceed 3000 characters'),
    metadata: z
      .object({
        userAgent: z.string().max(300).optional(),
        speechRecognitionSupported: z.boolean().optional(),
        screenResolution: z.string().max(50).optional(),
      })
      .optional(),
  })
  .strict();

