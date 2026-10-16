import rateLimit from 'express-rate-limit';

const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Check whether rate limiting is disabled.
 * RATE_LIMIT_DISABLED=true is strictly honored ONLY when NODE_ENV !== 'production'.
 * In production, rate limiting is always enforced regardless of this flag.
 */
const isRateLimitDisabled = () => {
  return (
    !isProduction() &&
    (process.env.RATE_LIMIT_DISABLED === 'true' || process.env.RATE_LIMIT_DISABLED === '1')
  );
};

/**
 * Helper to format wait time nicely:
 * Shows minutes when over 90 seconds (e.g. "about 51 minutes"), seconds below that.
 */
export const formatWaitTime = (seconds) => {
  if (seconds > 90) {
    const minutes = Math.ceil(seconds / 60);
    return `about ${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  return `about ${seconds} second${seconds === 1 ? '' : 's'}`;
};

/**
 * Standardized 429 response handler conforming to the API error contract
 */
const rateLimitHandler = (req, res, next, options) => {
  const resetTime = req.rateLimit?.resetTime;
  const retryAfterSeconds = resetTime
    ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
    : Math.ceil(options.windowMs / 1000);

  res.set('Retry-After', String(retryAfterSeconds));

  const waitFormatted = formatWaitTime(retryAfterSeconds);

  return res.status(429).json({
    success: false,
    code: 'RATE_LIMITED',
    message: `Too many attempts. Please try again in ${waitFormatted}.`,
    retryAfterSeconds,
  });
};

/**
 * Factory to create configurable rate limiters supporting:
 * - Environment variable overrides (e.g. RATE_LIMIT_REGISTER_MAX)
 * - Development vs Production defaults
 * - Dynamic bypass via RATE_LIMIT_DISABLED in non-production
 *
 * NOTE ON PROXY SETTINGS:
 * Express must have app.set("trust proxy", 1) enabled when deployed behind reverse
 * proxies (Render, Vercel, Cloudflare, etc.). Without trust proxy, req.ip resolves to the
 * reverse proxy's internal IP address, which would cause all shared users to share a single
 * IP bucket and be throttled together.
 */
const createConfigurableLimiter = ({
  envMaxKey,
  envWindowKey,
  devMax,
  prodMax,
  defaultWindowMs,
  skipSuccessfulRequests = false,
  keyGenerator,
  validate = true,
}) => {
  const getMax = () => {
    if (envMaxKey && process.env[envMaxKey]) {
      const parsed = parseInt(process.env[envMaxKey], 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return isProduction() ? prodMax : devMax;
  };

  const getWindowMs = () => {
    if (envWindowKey && process.env[envWindowKey]) {
      const parsed = parseInt(process.env[envWindowKey], 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return defaultWindowMs;
  };

  const limiterInstance = rateLimit({
    windowMs: getWindowMs(),
    max: () => getMax(),
    skip: () => isRateLimitDisabled(),
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    validate,
    ...(keyGenerator ? { keyGenerator } : {}),
    handler: rateLimitHandler,
  });

  return (req, res, next) => {
    if (isRateLimitDisabled()) {
      return next();
    }
    return limiterInstance(req, res, next);
  };
};

/**
 * 1. Register Limiter:
 *    - Production default: 15 per hour per IP
 *    - Development default: 100 per hour per IP
 *    - Configurable via RATE_LIMIT_REGISTER_MAX & RATE_LIMIT_REGISTER_WINDOW_MS
 */
export const registerLimiter = createConfigurableLimiter({
  envMaxKey: 'RATE_LIMIT_REGISTER_MAX',
  envWindowKey: 'RATE_LIMIT_REGISTER_WINDOW_MS',
  devMax: 100,
  prodMax: 15,
  defaultWindowMs: 60 * 60 * 1000, // 1 hour
});

/**
 * 2. Login IP Limiter:
 *    - Production default: 20 per 15 min per IP
 *    - Development default: 100 per 15 min per IP
 *    - Configurable via RATE_LIMIT_LOGIN_MAX & RATE_LIMIT_LOGIN_WINDOW_MS
 */
export const loginIpLimiter = createConfigurableLimiter({
  envMaxKey: 'RATE_LIMIT_LOGIN_MAX',
  envWindowKey: 'RATE_LIMIT_LOGIN_WINDOW_MS',
  devMax: 100,
  prodMax: 20,
  defaultWindowMs: 15 * 60 * 1000, // 15 min
});

/**
 * 3. Login Failed Attempts Limiter:
 *    - Strictly 5 failed attempts per 15 min per email+IP (skips 2xx successful logins)
 *    - Enforced consistently across environments to safeguard against brute-force attacks
 */
export const loginFailedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: () => isRateLimitDisabled(),
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false, xForwardedForHeader: false },
  keyGenerator: (req) => {
    const ip = req.ip || req.socket?.remoteAddress || 'ip';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return `${ip}_${email}`;
  },
  handler: rateLimitHandler,
});

/**
 * 4. Forgot Password Limiter:
 *    - Production default: 15 per 15 min per IP
 *    - Development default: 100 per 15 min per IP
 *    - Configurable via RATE_LIMIT_FORGOT_MAX & RATE_LIMIT_FORGOT_WINDOW_MS
 */
export const forgotLimiter = createConfigurableLimiter({
  envMaxKey: 'RATE_LIMIT_FORGOT_MAX',
  envWindowKey: 'RATE_LIMIT_FORGOT_WINDOW_MS',
  devMax: 100,
  prodMax: 15,
  defaultWindowMs: 15 * 60 * 1000, // 15 min
});

/**
 * 5. Resend Verification Limiter:
 *    - Production default: 15 per 15 min per IP
 *    - Development default: 100 per 15 min per IP
 *    - Configurable via RATE_LIMIT_RESEND_MAX & RATE_LIMIT_RESEND_WINDOW_MS
 */
export const resendLimiter = createConfigurableLimiter({
  envMaxKey: 'RATE_LIMIT_RESEND_MAX',
  envWindowKey: 'RATE_LIMIT_RESEND_WINDOW_MS',
  devMax: 100,
  prodMax: 15,
  defaultWindowMs: 15 * 60 * 1000, // 15 min
});

/**
 * 6. Verify Email Limiter:
 *    - Production default: 30 per 15 min per IP
 *    - Development default: 100 per 15 min per IP
 *    - Configurable via RATE_LIMIT_VERIFY_MAX & RATE_LIMIT_VERIFY_WINDOW_MS
 */
export const verifyLimiter = createConfigurableLimiter({
  envMaxKey: 'RATE_LIMIT_VERIFY_MAX',
  envWindowKey: 'RATE_LIMIT_VERIFY_WINDOW_MS',
  devMax: 100,
  prodMax: 30,
  defaultWindowMs: 15 * 60 * 1000, // 15 min
});

/**
 * 7. Reset Password Limiter:
 *    - Production default: 15 per 15 min per IP
 *    - Development default: 100 per 15 min per IP
 *    - Configurable via RATE_LIMIT_RESET_MAX & RATE_LIMIT_RESET_WINDOW_MS
 */
export const resetLimiter = createConfigurableLimiter({
  envMaxKey: 'RATE_LIMIT_RESET_MAX',
  envWindowKey: 'RATE_LIMIT_RESET_WINDOW_MS',
  devMax: 100,
  prodMax: 15,
  defaultWindowMs: 15 * 60 * 1000, // 15 min
});

/**
 * 8. Delete Account Limiter:
 *    - Production default: 5 per 15 min per IP/user
 *    - Development default: 10 per 15 min
 */
export const deleteAccountLimiter = createConfigurableLimiter({
  envMaxKey: 'RATE_LIMIT_DELETE_ACCOUNT_MAX',
  envWindowKey: 'RATE_LIMIT_DELETE_ACCOUNT_WINDOW_MS',
  devMax: 10,
  prodMax: 5,
  defaultWindowMs: 15 * 60 * 1000,
});

/**
 * 9. Contact / Feedback Form Limiter:
 *    - Production default: 5 submissions per 15 min per IP
 *    - Development default: 20 submissions per 15 min per IP
 *    - Configurable via RATE_LIMIT_CONTACT_MAX & RATE_LIMIT_CONTACT_WINDOW_MS
 */
export const contactLimiter = createConfigurableLimiter({
  envMaxKey: 'RATE_LIMIT_CONTACT_MAX',
  envWindowKey: 'RATE_LIMIT_CONTACT_WINDOW_MS',
  devMax: 20,
  prodMax: 5,
  defaultWindowMs: 15 * 60 * 1000,
});

