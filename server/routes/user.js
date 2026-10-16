import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, updatePasswordSchema } from '../validators/schemas.js';

const router = express.Router();

/**
 * @desc    Get current user profile
 * @route   GET /api/user/profile
 * @access  Private
 */
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
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
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch user profile',
      error: error.message,
    });
  }
});

/**
 * @desc    Update user profile metadata
 * @route   PUT /api/user/profile
 * @access  Private
 */
router.put('/profile', protect, validate(updateProfileSchema), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    const { name, targetJob, experienceLevel, coachPreference, profile } = req.body;

    // Handle either flat fields or nested profile object
    const updatedName = (profile?.name ?? name ?? user.profile?.name ?? user.name)?.trim();
    const updatedTargetJob = (profile?.targetJob ?? targetJob ?? user.profile?.targetJob ?? '')?.trim();
    const updatedExperienceLevel = (profile?.experienceLevel ?? experienceLevel ?? user.profile?.experienceLevel ?? 'Mid Level')?.trim();
    const updatedCoachPreference = (profile?.coachPreference ?? coachPreference ?? user.profile?.coachPreference ?? 'Balanced')?.trim();

    if (updatedName) {
      user.name = updatedName;
    }

    user.profile = {
      name: updatedName || user.name,
      targetJob: updatedTargetJob,
      experienceLevel: updatedExperienceLevel,
      coachPreference: updatedCoachPreference,
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Failed to update user profile',
      error: error.message,
    });
  }
});

/**
 * @desc    Change user password safely with bcrypt verification
 * @route   PUT /api/user/password
 * @access  Private
 */
router.put('/password', protect, validate(updatePasswordSchema), async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current password and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match',
      });
    }

    // Retrieve user including hashed password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password with bcrypt
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password. Please try again.',
      });
    }

    // Update password (pre-save hook will hash with bcrypt)
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error updating user password:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message,
    });
  }
});

export default router;
