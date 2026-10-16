/**
 * Built-in list of ~100 of the most common passwords
 * (case-insensitive check)
 */
export const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password1',
  'password123',
  'pass1234',
  '12344321',
  '11111111',
  '00000000',
  '123123123',
  'qwerty123',
  'qwertyuiop',
  'asdfghjk',
  'asdf1234',
  'zxcvbnm1',
  'iloveyou',
  'iloveyou1',
  'admin123',
  'admin1234',
  'administrator',
  'welcome1',
  'welcome123',
  'sunshine',
  'sunshine1',
  'monkey123',
  'dragon123',
  'football',
  'football1',
  'baseball',
  'basketball',
  'princess',
  'princess1',
  'master123',
  'shadow123',
  'superman',
  'superman1',
  'batman123',
  'starwars',
  'starwars1',
  'trustno1',
  'hunter22',
  'charlie1',
  'jordan123',
  'michael1',
  'daniel123',
  'anthony1',
  'jessica1',
  'thomas123',
  'jennifer',
  'computer',
  'internet',
  'secret12',
  'secret123',
  'letmein1',
  'letmein123',
  'whatever',
  'login123',
  'access123',
  'test1234',
  'test12345',
  'passcode1',
  'myspace1',
  'facebook',
  'google12',
  'android1',
  'apple123',
  'windows1',
  'cookie12',
  'killer12',
  'killer123',
  'pepper12',
  'peanut12',
  'guitar12',
  'hockey12',
  'soccer12',
  'matrix12',
  'galaxy12',
  'silver12',
  'golden12',
  'diamond1',
  'summer12',
  'winter12',
  'spring12',
  'autumn12',
  'coffee12',
  'freedom1',
  'forever1',
  'butterfly',
  'mustang1',
  'corvette',
  'harley12',
  'chevy123',
  'toyota12',
  'yamaha12',
  'suzuki12',
  'kawasaki',
  'scooter1',
  'phoenix1',
  'thunder1',
  'warrior1',
  'merlin12',
  'wizard12',
  'chelsea1',
  'arsenal1',
  'liverpool',
]);

/**
 * Validates a password according to policy:
 * - 8 to 72 characters
 * - Must differ from the email
 * - Must not be in the common passwords list
 * - No arbitrary complexity rules
 *
 * @param {string} password - Proposed password
 * @param {string} email - User email
 * @returns {{ isValid: boolean, message?: string }}
 */
export const validatePasswordPolicy = (password, email = '') => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Please provide a password.',
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long.',
    };
  }

  if (password.length > 72) {
    return {
      isValid: false,
      message: 'Password cannot exceed 72 characters.',
    };
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = password.trim().toLowerCase();

  if (cleanEmail && cleanPassword === cleanEmail) {
    return {
      isValid: false,
      message: 'Password cannot be the same as your email address.',
    };
  }

  // Also check if email username portion equals password
  const emailUsername = cleanEmail.split('@')[0];
  if (emailUsername && emailUsername.length >= 3 && cleanPassword === emailUsername) {
    return {
      isValid: false,
      message: 'Password cannot be the same as your email username.',
    };
  }

  if (COMMON_PASSWORDS.has(cleanPassword)) {
    return {
      isValid: false,
      message: 'This password is too common and easily guessed. Please choose a more unique password.',
    };
  }

  return { isValid: true };
};

export default validatePasswordPolicy;
