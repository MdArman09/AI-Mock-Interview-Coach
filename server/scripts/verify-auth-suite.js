import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import User from '../models/User.js';
import AuthToken from '../models/AuthToken.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = 'http://localhost:5000/api';
const MONGO_URI = process.env.MONGO_URI;

const runTests = async () => {
  console.log('===============================================================');
  console.log('   AI MOCK INTERVIEW COACH — AUTH HARDENING VERIFICATION SUITE   ');
  console.log('===============================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB for database state assertions.');

  const results = [];
  const record = (name, passed, detail = '') => {
    results.push({ name, passed, detail });
    console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: ${name} ${detail ? `(${detail})` : ''}`);
  };

  const testEmail = `test_user_${Date.now()}@example.com`;
  const initialPassword = 'CorrectHorseBatteryStaple123!';
  const newPassword = 'SecureNewPassword456!';
  let rawVerifyToken = null;
  let rawResetToken = null;

  try {
    // -------------------------------------------------------------
    // 1. Password Policy on Registration
    // -------------------------------------------------------------
    console.log('\n--- 1. Password Policy Tests ---');
    // Short password (< 8 chars)
    const shortPwRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Short Pw', email: testEmail, password: 'short' }),
    });
    const shortPwData = await shortPwRes.json();
    record(
      'Rejects password < 8 chars',
      shortPwRes.status === 400 && shortPwData.code === 'WEAK_PASSWORD',
      shortPwData.message
    );

    // Password equals email
    const emailPwRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Email Pw', email: testEmail, password: testEmail }),
    });
    const emailPwData = await emailPwRes.json();
    record(
      'Rejects password equal to email',
      emailPwRes.status === 400 && emailPwData.code === 'WEAK_PASSWORD',
      emailPwData.message
    );

    // Common password
    const commonPwRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Common Pw', email: testEmail, password: 'password123' }),
    });
    const commonPwData = await commonPwRes.json();
    record(
      'Rejects common password ("password123")',
      commonPwRes.status === 400 && commonPwData.code === 'WEAK_PASSWORD',
      commonPwData.message
    );

    // -------------------------------------------------------------
    // 2. Registration (Unverified + No JWT)
    // -------------------------------------------------------------
    console.log('\n--- 2. Registration Flow ---');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice Test', email: testEmail, password: initialPassword }),
    });
    const regData = await regRes.json();
    record(
      'Register returns 201 with VERIFICATION_SENT',
      regRes.status === 201 && regData.code === 'VERIFICATION_SENT'
    );
    record(
      'Register does NOT return a JWT token',
      !regData.token,
      'token is undefined'
    );

    // Find the created user in Mongo
    const createdUser = await User.findOne({ email: testEmail });
    record(
      'User created with emailVerified: false and tokenVersion: 0',
      createdUser && createdUser.emailVerified === false && createdUser.tokenVersion === 0
    );

    // -------------------------------------------------------------
    // 3. Database Token Storage Assertion (Hashes Only!)
    // -------------------------------------------------------------
    console.log('\n--- 3. Database Security & Token Hashing ---');
    const verifyTokenDoc = await AuthToken.findOne({ userId: createdUser._id, type: 'verify' });
    record(
      'AuthToken record exists for verify token',
      Boolean(verifyTokenDoc)
    );
    record(
      'AuthToken stores SHA-256 hash (64 hex characters) and NOT raw token',
      verifyTokenDoc && /^[0-9a-f]{64}$/i.test(verifyTokenDoc.tokenHash) && !verifyTokenDoc.rawToken,
      `tokenHash: ${verifyTokenDoc?.tokenHash?.slice(0, 16)}...`
    );

    // -------------------------------------------------------------
    // 4. Login Attempt on Unverified Account
    // -------------------------------------------------------------
    console.log('\n--- 4. Login Attempt on Unverified Account ---');
    const unverifiedLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: initialPassword }),
    });
    const unverifiedLoginData = await unverifiedLoginRes.json();
    record(
      'Login on unverified account returns 403 EMAIL_NOT_VERIFIED',
      unverifiedLoginRes.status === 403 && unverifiedLoginData.code === 'EMAIL_NOT_VERIFIED',
      unverifiedLoginData.message
    );

    // -------------------------------------------------------------
    // 5. Verification Endpoint Token Validation
    // -------------------------------------------------------------
    console.log('\n--- 5. Verify Email Endpoint Validation ---');
    // Tampered / nonexistent token
    const tamperedRes = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'completely_invalid_and_tampered_token' }),
    });
    const tamperedData = await tamperedRes.json();
    record(
      'Tampered token returns 400 TOKEN_INVALID',
      tamperedRes.status === 400 && tamperedData.code === 'TOKEN_INVALID'
    );

    // Expired token test
    const expiredRaw = crypto.randomBytes(32).toString('hex');
    const expiredHash = crypto.createHash('sha256').update(expiredRaw).digest('hex');
    await AuthToken.create({
      userId: createdUser._id,
      type: 'verify',
      tokenHash: expiredHash,
      expiresAt: new Date(Date.now() - 3600000), // 1 hour in past
    });

    const expiredRes = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: expiredRaw }),
    });
    const expiredData = await expiredRes.json();
    record(
      'Expired token returns 400 TOKEN_EXPIRED',
      expiredRes.status === 400 && expiredData.code === 'TOKEN_EXPIRED'
    );

    // Valid verification test
    // Generate fresh known raw token for testing
    rawVerifyToken = crypto.randomBytes(32).toString('hex');
    const validVerifyHash = crypto.createHash('sha256').update(rawVerifyToken).digest('hex');
    await AuthToken.create({
      userId: createdUser._id,
      type: 'verify',
      tokenHash: validVerifyHash,
      expiresAt: new Date(Date.now() + 86400000), // 24 hours
    });

    const validVerifyRes = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawVerifyToken }),
    });
    const validVerifyData = await validVerifyRes.json();
    record(
      'Valid token returns 200 EMAIL_VERIFIED',
      validVerifyRes.status === 200 && validVerifyData.code === 'EMAIL_VERIFIED'
    );

    // Reused token test
    const reusedRes = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawVerifyToken }),
    });
    const reusedData = await reusedRes.json();
    record(
      'Reused token returns 400 TOKEN_INVALID',
      reusedRes.status === 400 && reusedData.code === 'TOKEN_INVALID'
    );

    // User in DB is now verified
    const updatedUser = await User.findById(createdUser._id);
    record(
      'User emailVerified is now true in DB',
      updatedUser.emailVerified === true && Boolean(updatedUser.emailVerifiedAt)
    );

    // -------------------------------------------------------------
    // 6. Login After Verification
    // -------------------------------------------------------------
    console.log('\n--- 6. Login After Verification ---');
    const loginRes1 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: initialPassword }),
    });
    const loginData1 = await loginRes1.json();
    const tokenSession1 = loginData1.token;

    // Simulate login from second browser/device
    const loginRes2 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: initialPassword }),
    });
    const loginData2 = await loginRes2.json();
    const tokenSession2 = loginData2.token;

    record(
      'Login succeeds after verification (returns JWT)',
      loginRes1.status === 200 && Boolean(tokenSession1) && Boolean(tokenSession2)
    );

    // Check protected route with Session 1 and Session 2
    const meRes1 = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenSession1}` },
    });
    const meRes2 = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenSession2}` },
    });
    record(
      'Both active browser sessions can access protected /api/auth/me',
      meRes1.status === 200 && meRes2.status === 200
    );

    // -------------------------------------------------------------
    // 7. Forgot Password Timing & Identical Response
    // -------------------------------------------------------------
    console.log('\n--- 7. Forgot Password Privacy & Timing ---');
    const existingForgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    const existingForgotData = await existingForgotRes.json();

    const nonExistentForgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'does_not_exist_987654321@example.com' }),
    });
    const nonExistentForgotData = await nonExistentForgotRes.json();

    record(
      'Forgot password returns identical 200 and code for existent vs nonexistent emails',
      existingForgotRes.status === 200 &&
        nonExistentForgotRes.status === 200 &&
        existingForgotData.code === nonExistentForgotData.code &&
        existingForgotData.message === nonExistentForgotData.message,
      `code: ${existingForgotData.code}`
    );

    // -------------------------------------------------------------
    // 8. Password Reset & Session Revocation (tokenVersion)
    // -------------------------------------------------------------
    console.log('\n--- 8. Password Reset & Session Revocation ---');
    // Generate valid reset token
    rawResetToken = crypto.randomBytes(32).toString('hex');
    const validResetHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    await AuthToken.create({
      userId: createdUser._id,
      type: 'reset',
      tokenHash: validResetHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    });

    // Reset password
    const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawResetToken, password: newPassword }),
    });
    const resetData = await resetRes.json();
    record(
      'Reset password succeeds with 200 PASSWORD_RESET_SUCCESS',
      resetRes.status === 200 && resetData.code === 'PASSWORD_RESET_SUCCESS'
    );

    // Reset token is single-use: cannot be reused
    const reusedResetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawResetToken, password: newPassword }),
    });
    const reusedResetData = await reusedResetRes.json();
    record(
      'Reset token is single-use (reused token returns 400 TOKEN_INVALID)',
      reusedResetRes.status === 400 && reusedResetData.code === 'TOKEN_INVALID'
    );

    // Old sessions must now be rejected with 401 TOKEN_REVOKED
    const session1AfterReset = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenSession1}` },
    });
    const session1Data = await session1AfterReset.json();

    const session2AfterReset = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenSession2}` },
    });
    const session2Data = await session2AfterReset.json();

    record(
      'Session 1 receives 401 TOKEN_REVOKED after password reset',
      session1AfterReset.status === 401 && session1Data.code === 'TOKEN_REVOKED',
      session1Data.message
    );
    record(
      'Session 2 receives 401 TOKEN_REVOKED after password reset',
      session2AfterReset.status === 401 && session2Data.code === 'TOKEN_REVOKED',
      session2Data.message
    );

    // Old password no longer works
    const oldLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: initialPassword }),
    });
    record(
      'Login with old password fails with 401 INVALID_CREDENTIALS',
      oldLoginRes.status === 401
    );

    // New password works
    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: newPassword }),
    });
    const newLoginData = await newLoginRes.json();
    record(
      'Login with new password succeeds and issues valid token with incremented tv',
      newLoginRes.status === 200 && Boolean(newLoginData.token) && newLoginData.user?.tokenVersion === 1
    );

    // Clean up test user & tokens
    await User.deleteOne({ _id: createdUser._id });
    await AuthToken.deleteMany({ userId: createdUser._id });
    console.log('\n✓ Cleaned up test user & associated test tokens from database.');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB.\n');
  }

  const allPassed = results.every((r) => r.passed);
  console.log('===============================================================');
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log('STATUS:', allPassed ? 'ALL VERIFICATION CRITERIA PASSED' : 'SOME CHECKS FAILED');
  console.log('===============================================================');
};

runTests();
