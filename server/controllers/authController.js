import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import AuthToken from '../models/AuthToken.js';
import Session from '../models/Session.js';
import Resume from '../models/Resume.js';
import Question from '../models/Question.js';
import { validatePasswordPolicy } from '../utils/passwordPolicy.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedNotification,
  getEmailConfig,
} from '../services/emailService.js';

// Pre-computed dummy bcrypt hash for constant-time comparisons when a user doesn't exist
const DUMMY_BCRYPT_HASH = bcrypt.hashSync('dummy_timing_salt_padding_key_123', 10);

// Helper to generate JWT with token version and configurable expiry (default 1d)
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      tv: user.tokenVersion !== undefined ? user.tokenVersion : 0,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    }
  );
};

const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Helper to hash raw token with SHA-256
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        code: 'DB_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please try again shortly.',
      });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'Please provide name, email, and password',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Validate password policy
    const pwCheck = validatePasswordPolicy(password, cleanEmail);
    if (!pwCheck.isValid) {
      return res.status(400).json({
        success: false,
        code: 'WEAK_PASSWORD',
        field: 'password',
        message: pwCheck.message,
      });
    }

    let existingUser;
    try {
      existingUser = await User.findOne({ email: cleanEmail });
    } catch (dbErr) {
      console.error('[Auth Register DB Lookup Error]:', dbErr);
      return res.status(503).json({
        success: false,
        code: 'DB_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please try again shortly.',
      });
    }

    if (existingUser) {
      if (existingUser.emailVerified) {
        return res.status(409).json({
          success: false,
          code: 'EMAIL_TAKEN',
          message: 'An account with this email address already exists. Please log in.',
        });
      }

      // Existing unverified user: check cooldown & hourly limit, then re-send verification
      const now = Date.now();
      const lastHour = new Date(now - 3600000);

      try {
        const hourlyCount = await AuthToken.countDocuments({
          userId: existingUser._id,
          type: 'verify',
          createdAt: { $gte: lastHour },
        });

        const latestToken = await AuthToken.findOne({
          userId: existingUser._id,
          type: 'verify',
        }).sort({ createdAt: -1 });

        const inCooldown = latestToken && now - latestToken.createdAt.getTime() < 60000;
        const reachedHourlyCap = hourlyCount >= 5;

        let reVerifySendResult = { success: true };
        if (!inCooldown && !reachedHourlyCap) {
          // Invalidate previous verify tokens
          await AuthToken.updateMany(
            { userId: existingUser._id, type: 'verify', usedAt: null },
            { usedAt: new Date() }
          );

          const rawToken = crypto.randomBytes(32).toString('hex');
          const tokenHash = hashToken(rawToken);
          const expiresAt = new Date(now + 24 * 60 * 60 * 1000); // 24 hours

          await AuthToken.create({
            userId: existingUser._id,
            type: 'verify',
            tokenHash,
            expiresAt,
          });

          sendVerificationEmail({
            email: existingUser.email,
            name: existingUser.name,
            token: rawToken,
            frontendUrl: req.headers.origin,
          }).catch((sendErr) => {
            console.error('[Register Re-verify Email Background Error]:', sendErr.message);
          });
        }

        const reVerifyPayload = {
          success: true,
          code: 'VERIFICATION_SENT',
          message: 'Verification link sent to your email. Please check your inbox.',
        };

        if (process.env.NODE_ENV !== 'production') {
          reVerifyPayload.emailMode = getEmailConfig().mode;
        }

        return res.status(201).json(reVerifyPayload);
      } catch (err) {
        console.error('[Register Re-verify Error]:', err);
      }

      const fallbackPayload = {
        success: true,
        code: 'VERIFICATION_SENT',
        message: 'Verification link sent to your email. Please check your inbox.',
      };
      if (process.env.NODE_ENV !== 'production') {
        fallbackPayload.emailMode = getEmailConfig().mode;
      }
      return res.status(201).json(fallbackPayload);
    }

    // Create new unverified user
    let user;
    try {
      user = await User.create({
        name: cleanName,
        email: cleanEmail,
        password,
        emailVerified: false,
        emailVerifiedAt: null,
        tokenVersion: 0,
        profile: {
          name: cleanName,
          targetJob: '',
          experienceLevel: 'Mid Level',
          coachPreference: 'Balanced',
        },
      });
    } catch (dbErr) {
      console.error('[Auth Register DB Create Error]:', dbErr);
      return res.status(503).json({
        success: false,
        code: 'DB_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please try again shortly.',
      });
    }

    // Generate single-use 24h verification token
    try {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await AuthToken.create({
        userId: user._id,
        type: 'verify',
        tokenHash,
        expiresAt,
      });

      sendVerificationEmail({
        email: user.email,
        name: user.name,
        token: rawToken,
        frontendUrl: req.headers.origin,
      }).catch((sendErr) => {
        console.error('[Verification Email Background Error]:', sendErr.message);
      });
    } catch (tokenErr) {
      console.error('[Verification Token Create Error]:', tokenErr);
    }

    const newRegisterPayload = {
      success: true,
      code: 'VERIFICATION_SENT',
      message: 'Registration successful! Verification link sent to your email. Please check your inbox.',
    };

    if (process.env.NODE_ENV !== 'production') {
      newRegisterPayload.emailMode = getEmailConfig().mode;
    }

    return res.status(201).json(newRegisterPayload);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

/**
 * @desc    Verify email address using token
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
export const verifyEmail = async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        code: 'DB_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please try again shortly.',
      });
    }

    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        code: 'TOKEN_INVALID',
        message: 'Verification token is required.',
      });
    }

    const tokenHash = hashToken(token);
    const authToken = await AuthToken.findOne({ tokenHash, type: 'verify' });

    if (!authToken || authToken.usedAt) {
      return res.status(400).json({
        success: false,
        code: 'TOKEN_INVALID',
        message: 'This verification link is invalid or has already been used.',
      });
    }

    if (authToken.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'This verification link has expired. Please request a new one.',
      });
    }

    // Mark user as verified
    await User.findByIdAndUpdate(authToken.userId, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    // Mark token as used
    authToken.usedAt = new Date();
    await authToken.save();

    return res.status(200).json({
      success: true,
      code: 'EMAIL_VERIFIED',
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Server error during email verification',
      error: error.message,
    });
  }
};

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
export const resendVerification = async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        code: 'DB_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please try again shortly.',
      });
    }

    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const isDev = process.env.NODE_ENV !== 'production';
    const emailConfig = getEmailConfig();

    let emailSendFailed = false;

    const processResend = async () => {
      if (!cleanEmail) return;
      try {
        const user = await User.findOne({ email: cleanEmail });
        if (!user || user.emailVerified) return;

        const now = Date.now();
        const lastHour = new Date(now - 3600000);

        // Check hourly limit (max 5 per hour)
        const hourlyCount = await AuthToken.countDocuments({
          userId: user._id,
          type: 'verify',
          createdAt: { $gte: lastHour },
        });
        if (hourlyCount >= 5) return;

        // Check 60-second cooldown
        const latestToken = await AuthToken.findOne({
          userId: user._id,
          type: 'verify',
        }).sort({ createdAt: -1 });

        if (latestToken && now - latestToken.createdAt.getTime() < 60000) {
          return;
        }

        // Invalidate older unused verify tokens
        await AuthToken.updateMany(
          { userId: user._id, type: 'verify', usedAt: null },
          { usedAt: new Date() }
        );

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(now + 24 * 60 * 60 * 1000); // 24 hours

        await AuthToken.create({
          userId: user._id,
          type: 'verify',
          tokenHash,
          expiresAt,
        });

        const sendResult = await sendVerificationEmail({
          email: user.email,
          name: user.name,
          token: rawToken,
          frontendUrl: req.headers.origin,
        });

        if (sendResult?.success === false) {
          emailSendFailed = true;
        }
      } catch (err) {
        console.error('[Resend Verification Error]:', err.message);
        emailSendFailed = true;
      }
    };

    if (isDev) {
      await processResend();
      return res.status(200).json({
        success: true,
        code: 'VERIFICATION_SENT',
        message: 'If an unverified account exists, we’ve sent a verification link to your email.',
        emailMode: emailConfig.mode,
        ...(emailSendFailed && { emailSendFailed: true }),
      });
    } else {
      processResend().catch((err) =>
        console.error('[Resend Verification Background Error]:', err.message)
      );
      return res.status(200).json({
        success: true,
        code: 'VERIFICATION_SENT',
        message: 'If an unverified account exists, we’ve sent a verification link to your email.',
      });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Server error while processing verification resend',
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        code: 'DB_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please try again shortly.',
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'Please provide both email and password',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    let user;
    try {
      user = await User.findOne({ email: cleanEmail }).select('+password');
    } catch (dbErr) {
      console.error('[Auth Login DB Error]:', dbErr);
      return res.status(503).json({
        success: false,
        code: 'DB_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please try again shortly.',
      });
    }

    // Constant-time protection: run dummy bcrypt compare if user is not found
    if (!user) {
      await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password credentials',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password credentials',
      });
    }

    // Check email verification status
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before logging in.',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        tokenVersion: user.tokenVersion || 0,
        profile: user.profile || {
          name: user.name,
          targetJob: '',
          experienceLevel: 'Mid Level',
          coachPreference: 'Balanced',
        },
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Server error during login',
      error: error.message,
    });
  }
};

/**
 * @desc    Forgot password request
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        code: 'DB_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please try again shortly.',
      });
    }

    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const isDev = process.env.NODE_ENV !== 'production';
    const emailConfig = getEmailConfig();

    let emailSendFailed = false;

    const processForgot = async () => {
      if (!cleanEmail) return;
      try {
        const user = await User.findOne({ email: cleanEmail });
        if (!user) return;

        const now = Date.now();
        const lastHour = new Date(now - 3600000);

        // Hourly cap: 5 per hour
        const hourlyCount = await AuthToken.countDocuments({
          userId: user._id,
          type: 'reset',
          createdAt: { $gte: lastHour },
        });
        if (hourlyCount >= 5) return;

        // 60-second cooldown
        const latestToken = await AuthToken.findOne({
          userId: user._id,
          type: 'reset',
        }).sort({ createdAt: -1 });

        if (latestToken && now - latestToken.createdAt.getTime() < 60000) {
          return;
        }

        // Invalidate older unused reset tokens
        await AuthToken.updateMany(
          { userId: user._id, type: 'reset', usedAt: null },
          { usedAt: new Date() }
        );

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(now + 30 * 60 * 1000); // 30 minutes

        await AuthToken.create({
          userId: user._id,
          type: 'reset',
          tokenHash,
          expiresAt,
        });

        const sendResult = await sendPasswordResetEmail({
          email: user.email,
          name: user.name,
          token: rawToken,
          frontendUrl: req.headers.origin,
        });

        if (sendResult?.success === false) {
          emailSendFailed = true;
        }
      } catch (bgErr) {
        console.error('[Forgot Password Error]:', bgErr.message);
        emailSendFailed = true;
      }
    };

    if (isDev) {
      await processForgot();
      return res.status(200).json({
        success: true,
        code: 'RESET_SENT',
        message: 'If an account exists with this email, we’ve sent a reset link.',
        emailMode: emailConfig.mode,
        ...(emailSendFailed && { emailSendFailed: true }),
      });
    } else {
      processForgot().catch((err) =>
        console.error('[Forgot Password Background Error]:', err.message)
      );
      return res.status(200).json({
        success: true,
        code: 'RESET_SENT',
        message: 'If an account exists with this email, we’ve sent a reset link.',
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Server error processing password reset request',
    });
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        code: 'DB_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please try again shortly.',
      });
    }

    const { token, password } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        code: 'TOKEN_INVALID',
        message: 'Reset token is required.',
      });
    }

    const tokenHash = hashToken(token);
    const authToken = await AuthToken.findOne({ tokenHash, type: 'reset' });

    if (!authToken || authToken.usedAt) {
      return res.status(400).json({
        success: false,
        code: 'TOKEN_INVALID',
        message: 'Reset link is invalid or has already been used.',
      });
    }

    if (authToken.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Reset link has expired. Please request a new one.',
      });
    }

    const user = await User.findById(authToken.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        code: 'TOKEN_INVALID',
        message: 'The account associated with this token no longer exists.',
      });
    }

    // Validate password policy against user's email
    const pwCheck = validatePasswordPolicy(password, user.email);
    if (!pwCheck.isValid) {
      return res.status(400).json({
        success: false,
        code: 'WEAK_PASSWORD',
        field: 'password',
        message: pwCheck.message,
      });
    }

    // Update password, timestamps, increment tokenVersion, and ensure email is verified
    user.password = password;
    user.passwordChangedAt = new Date();
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.emailVerified = true;
    if (!user.emailVerifiedAt) {
      user.emailVerifiedAt = new Date();
    }
    await user.save();

    // Mark token used and invalidate other unused reset tokens for this user
    authToken.usedAt = new Date();
    await authToken.save();

    await AuthToken.updateMany(
      { userId: user._id, type: 'reset', usedAt: null },
      { usedAt: new Date() }
    );

    // Send confirmation email asynchronously
    sendPasswordChangedNotification({
      email: user.email,
      name: user.name,
    }).catch((err) => console.error('[Password Changed Email Error]:', err.message));

    return res.status(200).json({
      success: true,
      code: 'PASSWORD_RESET_SUCCESS',
      message: 'Your password has been reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Server error resetting password',
      error: error.message,
    });
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Error fetching profile',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete user account and cascade delete all associated data
 * @route   DELETE /api/auth/account
 * @access  Private (JWT protected)
 */
export const deleteAccount = async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        code: 'DB_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please try again shortly.',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'User account not found',
      });
    }

    // If local account or user has a password set, require password verification
    const requiresPassword = user.authProvider === 'local' || Boolean(user.password);
    if (requiresPassword) {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({
          success: false,
          code: 'MISSING_PASSWORD',
          message: 'Current password is required to delete your account',
        });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect password. Account deletion aborted.',
        });
      }
    }

    const userId = user._id;

    // Cascade delete all sessions, resume-generated questions, resumes, auth tokens, and the user document
    await Promise.all([
      Session.deleteMany({ userId }),
      Question.deleteMany({ userId, source: 'resume-generated' }),
      Resume.deleteMany({ userId }),
      AuthToken.deleteMany({ userId }),
    ]);

    await User.deleteOne({ _id: userId });

    return res.status(200).json({
      success: true,
      code: 'ACCOUNT_DELETED',
      message: 'Your account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Failed to delete account. Please try again.',
    });
  }
};

/**
 * @desc    Authenticate with Google OAuth (ID token or access token)
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleAuth = async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        code: 'DB_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please try again shortly.',
      });
    }

    const { credential, accessToken } = req.body;

    if (!credential && !accessToken) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_GOOGLE_TOKEN',
        message: 'Please provide a valid Google credential or access token.',
      });
    }

    let googleUser = null;

    if (credential) {
      // Verify Google ID Token via Google's tokeninfo endpoint
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential.trim())}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        return res.status(401).json({
          success: false,
          code: 'INVALID_GOOGLE_TOKEN',
          message: 'The provided Google credential token could not be verified.',
        });
      }

      const payload = await response.json();

      // Verify audience if GOOGLE_CLIENT_ID is configured in environment
      if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
        return res.status(401).json({
          success: false,
          code: 'GOOGLE_AUD_MISMATCH',
          message: 'Google token does not match the configured client ID.',
        });
      }

      googleUser = {
        googleId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture || '',
      };
    } else if (accessToken) {
      // Verify Google Access Token via Google's userinfo endpoint
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken.trim()}`,
        },
      });

      if (!response.ok) {
        return res.status(401).json({
          success: false,
          code: 'INVALID_GOOGLE_TOKEN',
          message: 'The provided Google access token is invalid or expired.',
        });
      }

      const payload = await response.json();

      googleUser = {
        googleId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified === true || payload.email_verified === 'true',
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture || '',
      };
    }

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({
        success: false,
        code: 'GOOGLE_PROFILE_INCOMPLETE',
        message: 'Unable to retrieve email from Google profile.',
      });
    }

    if (!googleUser.emailVerified) {
      return res.status(403).json({
        success: false,
        code: 'GOOGLE_EMAIL_UNVERIFIED',
        message: 'Your Google email is not verified. Please verify your Google account first.',
      });
    }

    const cleanEmail = googleUser.email.trim().toLowerCase();

    // Find existing user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId: googleUser.googleId }, { email: cleanEmail }],
    });

    if (user) {
      let isModified = false;
      // Link Google ID if user previously registered with email/password
      if (!user.googleId) {
        user.googleId = googleUser.googleId;
        user.authProvider = 'google';
        isModified = true;
      }
      // Since Google verified this email, ensure verified in our system
      if (!user.emailVerified) {
        user.emailVerified = true;
        user.emailVerifiedAt = user.emailVerifiedAt || new Date();
        isModified = true;
      }
      // Populate avatar if missing
      if (!user.avatar && googleUser.picture) {
        user.avatar = googleUser.picture;
        isModified = true;
      }
      if (isModified) {
        await user.save();
      }
    } else {
      // Create new user authenticated via Google
      user = await User.create({
        name: (googleUser.name || 'Candidate').slice(0, 50),
        email: cleanEmail,
        googleId: googleUser.googleId,
        authProvider: 'google',
        avatar: googleUser.picture,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        profile: {
          name: (googleUser.name || 'Candidate').slice(0, 50),
          targetJob: '',
          experienceLevel: 'Mid Level',
          coachPreference: 'Balanced',
        },
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      code: 'GOOGLE_AUTH_SUCCESS',
      message: 'Successfully authenticated with Google.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        avatar: user.avatar || '',
        authProvider: user.authProvider || 'google',
        tokenVersion: user.tokenVersion || 0,
        profile: user.profile || {
          name: user.name,
          targetJob: '',
          experienceLevel: 'Mid Level',
          coachPreference: 'Balanced',
        },
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Google OAuth Error]:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Server error while authenticating with Google.',
      error: error.message,
    });
  }
};
