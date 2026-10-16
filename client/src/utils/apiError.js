/**
 * Shared API error mapping utility.
 * Sanitizes and formats errors into clear, friendly user-facing messages.
 * Guarantees that raw technical/axios messages like "Request failed with status code ..."
 * or "Network Error" never reach the user interface.
 */
export const mapApiError = (error, context = '') => {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  const status = error.status || error.response?.status;
  const code = error.code || error.response?.data?.code;
  const rawMsg = (error.response?.data?.message || error.message || '').trim();

  // 1. Email verification & account status
  if (code === 'EMAIL_NOT_VERIFIED') {
    return 'Please verify your email address before logging in.';
  }

  if (code === 'EMAIL_TAKEN') {
    return 'An account with this email address already exists. Please sign in.';
  }

  if (code === 'TOKEN_INVALID') {
    return 'This link is invalid or has already been used.';
  }

  if (code === 'TOKEN_EXPIRED') {
    return 'This link has expired. Please request a new one.';
  }

  if (code === 'TOKEN_REVOKED') {
    return 'Your session has expired or was revoked. Please log in again.';
  }

  if (code === 'WEAK_PASSWORD' || code === 'PASSWORD_TOO_SHORT') {
    return rawMsg || 'Password must be 8–72 characters and not easily guessed.';
  }

  // 2. Auth credentials
  if (
    code === 'INVALID_CREDENTIALS' ||
    (status === 401 && (context === 'auth' || context === 'login' || context === 'register'))
  ) {
    return 'Incorrect email or password.';
  }

  // 3. Database unavailable / service offline (503)
  if (code === 'DB_UNAVAILABLE' || status === 503) {
    return 'We couldn’t reach the server. Please try again in a moment.';
  }

  // 4. Rate limiting (429 / RATE_LIMITED / AI_RATE_LIMITED)
  if (status === 429 || code === 'RATE_LIMITED' || code === 'AI_RATE_LIMITED') {
    const retrySec = error.retryAfterSeconds || error.response?.data?.retryAfterSeconds;
    if (retrySec && retrySec > 0) {
      if (retrySec > 90) {
        const minutes = Math.ceil(retrySec / 60);
        return `Too many attempts. Please try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`;
      }
      return `Too many attempts. Please try again in about ${retrySec} second${retrySec === 1 ? '' : 's'}.`;
    }
    if (rawMsg && !rawMsg.toLowerCase().includes('status code')) {
      return rawMsg;
    }
    return 'Too many attempts. Please try again in a few moments.';
  }

  // 5. Transient network / gateway errors / timeouts (502, 504, ECONNABORTED, Network Error)
  const isNetworkOrGateway =
    !status ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT' ||
    code === 'ERR_NETWORK' ||
    /network error|econnrefused|timeout|bad gateway|gateway timeout/i.test(rawMsg);

  if (isNetworkOrGateway) {
    return 'We couldn’t reach the server. Please try again in a moment.';
  }

  // 6. Explicit user-facing server error message (e.g. validation messages)
  if (
    rawMsg &&
    !rawMsg.toLowerCase().includes('status code') &&
    !rawMsg.toLowerCase().includes('network error') &&
    !rawMsg.toLowerCase().includes('econnrefused')
  ) {
    return rawMsg;
  }

  // 7. Generic safe fallback
  return 'We couldn’t reach the server. Please try again in a moment.';
};

export default mapApiError;
