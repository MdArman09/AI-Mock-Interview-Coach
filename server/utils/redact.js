/**
 * Utility helper for redacting sensitive fields from logging
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'token',
  'rawtoken',
  'tokenhash',
  'jwt_secret',
  'groq_api_key',
  'smtp_pass',
  'authorization',
  'secret',
  'transcript',
  'extractedtext',
  'buffer',
]);

export const redact = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(redact);
  }

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      clean[key] = redact(value);
    } else {
      clean[key] = value;
    }
  }

  return clean;
};

export default redact;
