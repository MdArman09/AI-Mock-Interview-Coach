/**
 * Per-User Rate Limiting Middleware
 * Protects AI inference quotas (Groq API) by enforcing hourly and daily caps per authenticated user.
 * Configurable via environment variables. Returns standard 429 { code: "RATE_LIMITED", retryAfterSeconds }.
 */

export const createPerUserLimiter = ({
  hourlyDefault,
  dailyDefault,
  actionName = 'this request',
  envHourlyKey,
  envDailyKey,
}) => {
  // Map of userId -> array of epoch millisecond timestamps
  const userHistory = new Map();

  // Periodic cleanup of stale users every 15 minutes to prevent memory leaks
  setInterval(() => {
    const oneDayAgo = Date.now() - 86400000;
    for (const [uid, timestamps] of userHistory.entries()) {
      const active = timestamps.filter((t) => t > oneDayAgo);
      if (active.length === 0) {
        userHistory.delete(uid);
      } else {
        userHistory.set(uid, active);
      }
    }
  }, 15 * 60 * 1000).unref();

  return (req, res, next) => {
    // Only applies to authenticated requests
    const userId = req.user?._id?.toString();
    if (!userId) {
      return next();
    }

    // Bypass in development only if explicitly requested
    if (process.env.NODE_ENV !== 'production' && process.env.RATE_LIMIT_DISABLED === 'true') {
      return next();
    }

    const hourlyLimit = parseInt(
      (envHourlyKey && process.env[envHourlyKey]) || String(hourlyDefault),
      10
    );
    const dailyLimit = parseInt(
      (envDailyKey && process.env[envDailyKey]) || String(dailyDefault),
      10
    );

    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;

    let timestamps = userHistory.get(userId) || [];
    timestamps = timestamps.filter((t) => t > oneDayAgo);

    const pastHour = timestamps.filter((t) => t > oneHourAgo);
    const pastDay = timestamps;

    if (pastHour.length >= hourlyLimit) {
      const oldestInHour = pastHour[0];
      const retryAfterSeconds = Math.max(1, Math.ceil((oldestInHour + 3600000 - now) / 1000));
      const minutesRemaining = Math.ceil(retryAfterSeconds / 60);

      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: `You have reached the hourly limit for ${actionName}. Please try again in about ${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'}.`,
        retryAfterSeconds,
      });
    }

    if (pastDay.length >= dailyLimit) {
      const oldestInDay = pastDay[0];
      const retryAfterSeconds = Math.max(1, Math.ceil((oldestInDay + 86400000 - now) / 1000));
      const hoursRemaining = Math.ceil(retryAfterSeconds / 3600);

      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: `You have reached the daily quota for ${actionName}. Please try again in about ${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'}.`,
        retryAfterSeconds,
      });
    }

    timestamps.push(now);
    userHistory.set(userId, timestamps);
    next();
  };
};

export const analyzeLimiter = createPerUserLimiter({
  hourlyDefault: 30,
  dailyDefault: 100,
  actionName: 'interview evaluations',
  envHourlyKey: 'RATE_LIMIT_ANALYZE_HOURLY',
  envDailyKey: 'RATE_LIMIT_ANALYZE_DAILY',
});

export const resumeUploadLimiter = createPerUserLimiter({
  hourlyDefault: 10,
  dailyDefault: 25,
  actionName: 'resume uploads',
  envHourlyKey: 'RATE_LIMIT_RESUME_UPLOAD_HOURLY',
  envDailyKey: 'RATE_LIMIT_RESUME_UPLOAD_DAILY',
});

export const generateQuestionsLimiter = createPerUserLimiter({
  hourlyDefault: 5,
  dailyDefault: 20,
  actionName: 'resume question generations',
  envHourlyKey: 'RATE_LIMIT_GENERATE_QUESTIONS_HOURLY',
  envDailyKey: 'RATE_LIMIT_GENERATE_QUESTIONS_DAILY',
});
