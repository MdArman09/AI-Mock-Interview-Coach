import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import Session from '../models/Session.js';
import Resume from '../models/Resume.js';
import Question from '../models/Question.js';
import AuthToken from '../models/AuthToken.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = 'http://localhost:5000';

const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, options);
    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data, headers: res.headers };
  } catch (err) {
    return { status: 0, error: err.message };
  }
};

async function runAudit() {
  console.log('================================================================');
  console.log('       PRODUCTION HARDENING AUDIT & VERIFICATION SUITE          ');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Connected to MongoDB for direct state verification.\n');

  // -------------------------------------------------------------
  // Test A: Authorization Audit (IDOR Scoping)
  // -------------------------------------------------------------
  console.log('--- TEST A: TWO-ACCOUNT AUTHORIZATION AUDIT (IDOR) ---');

  // Setup User A
  const emailA = 'account_a_audit@example.com';
  let userA = await User.findOne({ email: emailA });
  if (!userA) {
    userA = await User.create({
      name: 'Account A',
      email: emailA,
      password: 'Password123!',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  }

  // Setup User B
  const emailB = 'account_b_audit@example.com';
  let userB = await User.findOne({ email: emailB });
  if (!userB) {
    userB = await User.create({
      name: 'Account B',
      email: emailB,
      password: 'Password123!',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  }

  // Generate tokens
  const tokenA = jwt.sign({ id: userA._id, tv: userA.tokenVersion || 0 }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const tokenB = jwt.sign({ id: userB._id, tv: userB.tokenVersion || 0 }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Create User A records
  const resumeA = await Resume.create({
    userId: userA._id,
    fileName: 'user_a_resume.pdf',
    extractedText: 'Software Engineer with experience in React and Node.js.',
    label: 'Account A Resume',
  });

  const questionA = await Question.create({
    userId: userA._id,
    resumeId: resumeA._id,
    source: 'resume-generated',
    text: 'Can you describe your React and Node.js architecture for User A?',
    category: 'Resume',
  });

  const sessionA = await Session.create({
    userId: userA._id,
    questionText: questionA.text,
    transcript: 'I designed a distributed system using Node.js and React.',
    questionSource: 'resume',
    resumeId: resumeA._id,
    resumeLabel: 'Account A Resume',
    scores: { overall: 85 },
  });

  console.log(`Created test records for Account A:`);
  console.log(`  Resume ID   : ${resumeA._id}`);
  console.log(`  Question ID : ${questionA._id}`);
  console.log(`  Session ID  : ${sessionA._id}\n`);

  console.log('Executing attacks from Account B against Account A records:');

  // Attack 1: Account B tries to read Account A history session
  const resGetHistory = await request(`/api/history/${sessionA._id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  console.log(`1. GET /api/history/:id         -> Status: ${resGetHistory.status} (Expected: 404), Code: ${resGetHistory.data?.code}`);

  // Attack 2: Account B tries to delete Account A history session
  const resDelHistory = await request(`/api/history/${sessionA._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  console.log(`2. DELETE /api/history/:id      -> Status: ${resDelHistory.status} (Expected: 404), Code: ${resDelHistory.data?.code}`);

  // Attack 3: Account B tries to delete Account A resume
  const resDelResume = await request(`/api/resume/${resumeA._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  console.log(`3. DELETE /api/resume/:id       -> Status: ${resDelResume.status} (Expected: 404), Code: ${resDelResume.data?.code}`);

  // Attack 4: Account B tries to generate questions for Account A resume
  const resGenQuestions = await request('/api/resume/generate-questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ resumeId: resumeA._id.toString() }),
  });
  console.log(`4. POST /api/resume/generate... -> Status: ${resGenQuestions.status} (Expected: 404), Code: ${resGenQuestions.data?.code}`);

  // Attack 5: Account B tries to read Account A resume question
  const resGetQuestion = await request(`/api/questions/${questionA._id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  console.log(`5. GET /api/questions/:id       -> Status: ${resGetQuestion.status} (Expected: 404), Code: ${resGetQuestion.data?.code}`);

  // Attack 6: Account B tries to analyze Account A question
  const resAnalyze = await request('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      questionId: questionA._id.toString(),
      questionText: 'Test question',
      transcript: 'This is my test answer to attempt reading resume context.',
    }),
  });
  console.log(`6. POST /api/analyze (IDOR)     -> Status: ${resAnalyze.status} (Expected: 404), Code: ${resAnalyze.data?.code}`);

  const testAPassed =
    resGetHistory.status === 404 &&
    resDelHistory.status === 404 &&
    resDelResume.status === 404 &&
    resGenQuestions.status === 404 &&
    resGetQuestion.status === 404 &&
    resAnalyze.status === 404;

  console.log(`\n✓ TEST A RESULT: ${testAPassed ? 'PASSED (All 6 IDOR attempts rejected with 404)' : 'FAILED'}\n`);

  // -------------------------------------------------------------
  // Test B: Resume Upload Hardening (Fake PDF & Oversized)
  // -------------------------------------------------------------
  console.log('--- TEST B: RESUME UPLOAD SIGNATURE & SIZE HARDENING ---');

  // Subtest B1: Fake PDF (renamed .txt file)
  const formFake = new FormData();
  formFake.append('resume', new Blob(['This is a plain text file pretending to be a PDF resume.'], { type: 'application/pdf' }), 'fake_resume.pdf');

  const resFakePdf = await request('/api/resume/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: formFake,
  });
  console.log(`1. Fake .pdf upload             -> Status: ${resFakePdf.status} (Expected: 400), Code: ${resFakePdf.data?.code}`);
  console.log(`   Message: "${resFakePdf.data?.message}"`);

  // Subtest B2: Oversized file (> 5MB)
  const largeBuffer = new Uint8Array(5.5 * 1024 * 1024);
  const formOversized = new FormData();
  formOversized.append('resume', new Blob([largeBuffer], { type: 'application/pdf' }), 'oversized.pdf');

  const resOversized = await request('/api/resume/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: formOversized,
  });
  console.log(`2. Oversized file (5.5MB) upload -> Status: ${resOversized.status} (Expected: 400), Code: ${resOversized.data?.code}`);
  console.log(`   Message: "${resOversized.data?.message}"`);

  const testBPassed = resFakePdf.status === 400 && resOversized.status === 400;
  console.log(`\n✓ TEST B RESULT: ${testBPassed ? 'PASSED (Signature check & size cap enforced)' : 'FAILED'}\n`);

  // -------------------------------------------------------------
  // Test C: Per-User Abuse & Quota Protection (429 Rate Limiting)
  // -------------------------------------------------------------
  console.log('--- TEST C: PER-USER RATE LIMIT & QUOTA PROTECTION ---');

  // Create User C with dedicated resume for rate limit test
  const emailC = 'account_c_ratelimit@example.com';
  let userC = await User.findOne({ email: emailC });
  if (!userC) {
    userC = await User.create({
      name: 'Account C',
      email: emailC,
      password: 'Password123!',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  }
  const tokenC = jwt.sign({ id: userC._id, tv: userC.tokenVersion || 0 }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Test analyze character limit (6,000 chars)
  const longTranscript = 'word '.repeat(1500); // ~7500 chars
  const resLongTranscript = await request('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenC}`,
    },
    body: JSON.stringify({
      transcript: longTranscript,
      questionText: 'Tell me about yourself.',
    }),
  });
  console.log(`1. Transcript > 6,000 chars     -> Status: ${resLongTranscript.status} (Expected: 400), Code: ${resLongTranscript.data?.code}`);

  // Test per-user rate limit by calling generate-questions repeatedly until 429
  const resumeC = await Resume.create({
    userId: userC._id,
    fileName: 'user_c_resume.pdf',
    extractedText: 'Experienced developer in React and Python.',
    label: 'User C Resume',
    level: 'mid',
    analysis: { roleTitle: 'Developer' },
  });

  let hit429 = false;
  for (let i = 1; i <= 7; i++) {
    const resRate = await request('/api/resume/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenC}`,
      },
      body: JSON.stringify({ resumeId: resumeC._id.toString() }),
    });
    if (resRate.status === 429) {
      hit429 = true;
      console.log(`2. Generate-questions attempt ${i} -> Status: 429 RATE_LIMITED (Expected: 429)`);
      console.log(`   Response Code: ${resRate.data?.code}`);
      console.log(`   Message: "${resRate.data?.message}"`);
      console.log(`   Retry-After: ${resRate.data?.retryAfterSeconds}s`);
      break;
    }
  }

  const testCPassed = resLongTranscript.status === 400 && hit429;
  console.log(`\n✓ TEST C RESULT: ${testCPassed ? 'PASSED (Length cap and 429 limit confirmed)' : 'FAILED'}\n`);

  // -------------------------------------------------------------
  // Test D: NoSQL Injection Protection & Zod Validation
  // -------------------------------------------------------------
  console.log('--- TEST D: NOSQL INJECTION & STRICT ZOD VALIDATION ---');

  // Subtest D1: Malformed $-style operator in body
  const resNoSqlLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: { $gt: '' },
      password: 'Password123!',
    }),
  });
  console.log(`1. NoSQL operator body ({"$gt": ""}) -> Status: ${resNoSqlLogin.status} (Expected: 400), Code: ${resNoSqlLogin.data?.code}`);
  console.log(`   Errors: ${JSON.stringify(resNoSqlLogin.data?.errors || resNoSqlLogin.data?.message)}`);

  // Subtest D2: Unknown field rejected by .strict()
  const resStrict = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'valid@example.com',
      password: 'Password123!',
      maliciousExtraField: 'injected_value',
    }),
  });
  console.log(`2. Unknown field in body             -> Status: ${resStrict.status} (Expected: 400), Code: ${resStrict.data?.code}`);

  // Subtest D3: Invalid ObjectId in URL param
  const resBadId = await request('/api/history/invalid-non-hex-id', {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  console.log(`3. Malformed ObjectId URL param       -> Status: ${resBadId.status} (Expected: 400), Code: ${resBadId.data?.code}`);

  const testDPassed =
    resNoSqlLogin.status === 400 &&
    resStrict.status === 400 &&
    resBadId.status === 400;

  console.log(`\n✓ TEST D RESULT: ${testDPassed ? 'PASSED (NoSQL sanitized and rejected by strict schemas)' : 'FAILED'}\n`);

  // -------------------------------------------------------------
  // Test E: Production-Mode Error Conceals Stack Traces
  // -------------------------------------------------------------
  console.log('--- TEST E: PRODUCTION ERROR STACK CONCEALMENT ---');

  // Send malformed JSON payload to trigger an error
  const resMalformedJson = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ malformed json ',
  });
  console.log(`1. Malformed JSON parser error -> Status: ${resMalformedJson.status}`);
  console.log(`   Response body: ${JSON.stringify(resMalformedJson.data)}`);
  console.log(`   Has stack trace: ${Boolean(resMalformedJson.data?.stack)}`);

  // Test 404 handler
  const res404 = await request('/api/non-existent-route-endpoint', { method: 'GET' });
  console.log(`2. 404 Route handler          -> Status: ${res404.status}, Code: ${res404.data?.code}`);
  console.log(`   Response body: ${JSON.stringify(res404.data)}`);

  const testEPassed = !resMalformedJson.data?.stack && res404.status === 404;
  console.log(`\n✓ TEST E RESULT: ${testEPassed ? 'PASSED (Clean error envelopes, no stack traces leaked)' : 'FAILED'}\n`);

  // -------------------------------------------------------------
  // Test F: Account Deletion (Cascade Cleanup)
  // -------------------------------------------------------------
  console.log('--- TEST F: ACCOUNT DELETION CASCADE CLEANUP ---');

  // Create disposable User to delete
  const emailDelete = 'delete_me_cascade_test@example.com';
  await User.deleteOne({ email: emailDelete });

  const userDelete = await User.create({
    name: 'Disposable User',
    email: emailDelete,
    password: 'Password123!',
    emailVerified: true,
  });

  const tokenDelete = jwt.sign(
    { id: userDelete._id, tv: userDelete.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Create dependent records
  const resumeDel = await Resume.create({
    userId: userDelete._id,
    fileName: 'delete_resume.pdf',
    extractedText: 'Text for delete user',
  });

  const questionDel = await Question.create({
    userId: userDelete._id,
    resumeId: resumeDel._id,
    source: 'resume-generated',
    text: 'Disposable question',
  });

  const sessionDel = await Session.create({
    userId: userDelete._id,
    questionText: questionDel.text,
    transcript: 'Disposable transcript',
  });

  const tokenDocDel = await AuthToken.create({
    userId: userDelete._id,
    type: 'verify',
    tokenHash: 'dummy_hash_123',
    expiresAt: new Date(Date.now() + 3600000),
  });

  console.log('Created disposable user and dependent records:');
  console.log(`  User ID     : ${userDelete._id}`);
  console.log(`  Resume ID   : ${resumeDel._id}`);
  console.log(`  Question ID : ${questionDel._id}`);
  console.log(`  Session ID  : ${sessionDel._id}`);
  console.log(`  AuthToken ID: ${tokenDocDel._id}\n`);

  // Test wrong password
  const resWrongPass = await request('/api/auth/account', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenDelete}`,
    },
    body: JSON.stringify({ password: 'WrongPassword999!' }),
  });
  console.log(`1. DELETE /api/auth/account (wrong password) -> Status: ${resWrongPass.status} (Expected: 401), Code: ${resWrongPass.data?.code}`);

  // Test correct password
  const resCorrectPass = await request('/api/auth/account', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenDelete}`,
    },
    body: JSON.stringify({ password: 'Password123!' }),
  });
  console.log(`2. DELETE /api/auth/account (correct password) -> Status: ${resCorrectPass.status} (Expected: 200), Code: ${resCorrectPass.data?.code}`);
  console.log(`   Message: "${resCorrectPass.data?.message}"`);

  // Direct MongoDB verification
  const countUser = await User.countDocuments({ _id: userDelete._id });
  const countSessions = await Session.countDocuments({ userId: userDelete._id });
  const countResumes = await Resume.countDocuments({ userId: userDelete._id });
  const countQuestions = await Question.countDocuments({ userId: userDelete._id });
  const countTokens = await AuthToken.countDocuments({ userId: userDelete._id });

  console.log('\nDirect MongoDB verification counts for deleted user ID:');
  console.log(`  Users remaining     : ${countUser} (Expected: 0)`);
  console.log(`  Sessions remaining  : ${countSessions} (Expected: 0)`);
  console.log(`  Resumes remaining   : ${countResumes} (Expected: 0)`);
  console.log(`  Questions remaining : ${countQuestions} (Expected: 0)`);
  console.log(`  Tokens remaining    : ${countTokens} (Expected: 0)`);

  const testFPassed =
    resWrongPass.status === 401 &&
    resCorrectPass.status === 200 &&
    countUser === 0 &&
    countSessions === 0 &&
    countResumes === 0 &&
    countQuestions === 0 &&
    countTokens === 0;

  console.log(`\n✓ TEST F RESULT: ${testFPassed ? 'PASSED (User and all 4 dependent collections wiped clean)' : 'FAILED'}\n`);

  // Clean up User A and B test records
  await Session.deleteMany({ userId: { $in: [userA._id, userB._id] } });
  await Resume.deleteMany({ userId: { $in: [userA._id, userB._id] } });
  await Question.deleteMany({ userId: { $in: [userA._id, userB._id] } });
  await Resume.deleteMany({ userId: userC._id });

  await mongoose.disconnect();
  console.log('================================================================');
  console.log('                  ALL AUDIT SUITES COMPLETE                     ');
  console.log('================================================================');
}

runAudit().catch((err) => {
  console.error('[Audit Error]:', err);
  process.exit(1);
});
