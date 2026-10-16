/**
 * Startup environment variable validation
 * Refuses to start if critical configuration is missing or insecure in production.
 * NEVER prints secret values.
 */

const KNOWN_DEV_SECRETS = new Set([
  'your_jwt_secret_key_here',
  'secret',
  'jwt_secret',
  'development_secret',
  'dev_secret',
  'default_secret',
  'changeme',
  '12345678901234567890123456789012',
]);

export const validateEnv = () => {
  const missing = [];
  const required = ['MONGO_URI', 'JWT_SECRET', 'GROQ_API_KEY', 'FRONTEND_URL'];

  const emailMode = (process.env.EMAIL_MODE || 'console').toLowerCase();
  if (emailMode === 'smtp') {
    required.push('SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS');
  }

  for (const key of required) {
    const val = process.env[key];
    if (!val || val.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(`[Config ERROR] Missing required environment variable(s): ${missing.join(', ')}`);
    console.error('[Config ERROR] Refusing to start until all required variables are configured.');
    process.exit(1);
  }

  // Production security checks
  if (process.env.NODE_ENV === 'production') {
    const secret = process.env.JWT_SECRET || '';
    if (secret.length < 32 || KNOWN_DEV_SECRETS.has(secret)) {
      console.error(
        '[Config ERROR] In production, JWT_SECRET must be at least 32 characters long and cannot match known development placeholders.'
      );
      process.exit(1);
    }
  }
};

export default validateEnv;
