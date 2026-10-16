import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to protect routes and verify JWT bearer tokens.
 * Verifies token signature, checks token version against user.tokenVersion,
 * and ensures user email is verified.
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'TOKEN_MISSING',
      message: 'Not authorized to access this route, no token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'The user belonging to this token no longer exists',
      });
    }

    // Check tokenVersion revocation
    const tokenVersionInJwt = decoded.tv;
    const currentTokenVersion = user.tokenVersion || 0;

    if (tokenVersionInJwt === undefined || tokenVersionInJwt !== currentTokenVersion) {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_REVOKED',
        message: 'Session expired or revoked. Please log in again.',
      });
    }

    // Check email verification status
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before accessing this feature.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      code: 'TOKEN_INVALID',
      message: 'Token is invalid or has expired',
      error: error.message,
    });
  }
};

export default protect;
