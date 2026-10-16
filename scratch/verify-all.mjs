import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const API_BASE = 'http://localhost:5000/api';

async function postJson(url, data, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function getJson(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function deleteJson(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'DELETE', headers });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function main() {
  console.log('=== STARTING COMPLETE VERIFICATION ===\n');

  // Test credentials
  const email1 = `test_user_a_${Date.now()}@example.com`;
  const email2 = `test_user_b_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log('1. Registering Account 1:', email1);
  const reg1Res = await postJson(`${API_BASE}/auth/register`, {
    name: 'Alice Developer',
    email: email1,
    password,
  });
  const token1 = reg1Res.token;
  console.log('Account 1 registered successfully. User ID:', reg1Res.user._id);

  console.log('\n2. Fetching bank questions for Account 1...');
  const bankQRes = await getJson(`${API_BASE}/questions`, token1);
  const bankQuestions = bankQRes.data;
  console.log(`Fetched ${bankQuestions.length} bank questions.`);
  const sampleBankQ = bankQuestions[0];
  console.log(`Sample Bank Question: "${sampleBankQ.text}" (ID: ${sampleBankQ._id})`);

  console.log('\n3. Creating a test resume with questions for Account 1 directly in DB...');
  await mongoose.connect(process.env.MONGODB_URI);
  const Resume = mongoose.model('Resume', new mongoose.Schema({}, { strict: false }));
  const Question = mongoose.model('Question', new mongoose.Schema({}, { strict: false }));
  const Session = mongoose.model('Session', new mongoose.Schema({}, { strict: false }));

  const testResume = await Resume.create({
    userId: reg1Res.user._id,
    label: 'Senior Fullstack Engineer',
    fileName: 'Alice_Resume.pdf',
    level: 'senior',
    rawText: 'Experienced full stack developer with Node.js and React.',
    analysis: {
      roleTitle: 'Senior Fullstack Engineer',
      level: 'senior',
      keySkills: ['Node.js', 'React', 'MongoDB'],
    },
    questionCount: 3,
  });
  console.log(`Created Resume: "${testResume.label}" (ID: ${testResume._id})`);

  const resumeQuestionsDocs = await Question.insertMany([
    {
      userId: reg1Res.user._id,
      resumeId: testResume._id,
      text: 'Tell me about a time you designed a distributed microservice in Node.js and React under high load.',
      category: 'System Design',
      difficulty: 'Advanced',
      type: 'Technical Scenario',
      anchor: 'Distributed microservice in Node.js',
      source: 'resume-generated',
    },
    {
      userId: reg1Res.user._id,
      resumeId: testResume._id,
      text: 'How did you handle state management across complex React component hierarchies in your previous project?',
      category: 'Frontend',
      difficulty: 'Intermediate',
      type: 'Project Deep-Dive',
      anchor: 'React state management',
      source: 'resume-generated',
    },
  ]);
  const sampleResumeQ = resumeQuestionsDocs[0];
  console.log(`Created Resume Question: "${sampleResumeQ.text}" (ID: ${sampleResumeQ._id})`);

  console.log('\n4. Answering Bank Question as Account 1 via POST /api/analyze...');
  const bankAnswerRes = await postJson(
    `${API_BASE}/analyze`,
    {
      questionId: sampleBankQ._id,
      questionText: sampleBankQ.text,
      category: sampleBankQ.category,
      transcript: 'In my previous position, the situation was that our production database encountered high latencies. My task was to optimize queries. I added compound indexes and cleaned up unused tables. As a result, query latency dropped by 45%.',
      audioDuration: 35,
    },
    token1
  );
  console.log('Bank session analysis result status:', bankAnswerRes.success);
  const bankSession = bankAnswerRes.data;
  console.log('Bank session questionSource snapshot:', bankSession.questionSource);
  console.log('Bank session resumeId:', bankSession.resumeId || 'null');
  if (bankSession.questionSource !== 'bank') {
    throw new Error(`Expected questionSource 'bank', got '${bankSession.questionSource}'`);
  }

  console.log('\n5. Answering Resume Question as Account 1 via POST /api/analyze...');
  const resumeAnswerRes = await postJson(
    `${API_BASE}/analyze`,
    {
      questionId: sampleResumeQ._id,
      questionText: sampleResumeQ.text,
      category: sampleResumeQ.category,
      transcript: 'At my company, we had a microservice architecture handling millions of requests daily. My task was to reduce bottleneck latency. I implemented Redis caching and asynchronous queues. As a result, our system handled 3x peak load with zero downtime.',
      audioDuration: 42,
    },
    token1
  );
  console.log('Resume session analysis result status:', resumeAnswerRes.success);
  const resumeSession = resumeAnswerRes.data;
  console.log('Resume session questionSource snapshot:', resumeSession.questionSource);
  console.log('Resume session resumeId:', resumeSession.resumeId);
  console.log('Resume session resumeLabel:', resumeSession.resumeLabel);
  console.log('Resume session difficulty:', resumeSession.difficulty);
  console.log('Resume session questionType:', resumeSession.questionType);
  console.log('Resume session anchor:', resumeSession.anchor);

  if (resumeSession.questionSource !== 'resume') {
    throw new Error(`Expected questionSource 'resume', got '${resumeSession.questionSource}'`);
  }
  if (resumeSession.resumeLabel !== 'Senior Fullstack Engineer') {
    throw new Error(`Expected resumeLabel 'Senior Fullstack Engineer', got '${resumeSession.resumeLabel}'`);
  }

  console.log('\n6. Checking GET /api/history for Account 1...');
  const historyRes1 = await getJson(`${API_BASE}/history`, token1);
  const historyItems1 = historyRes1.data;
  console.log(`Account 1 has ${historyItems1.length} history items:`);
  for (const item of historyItems1) {
    console.log(`- [${item.questionSource.toUpperCase()}] "${item.questionText?.substring(0, 50)}..." | Label: "${item.resumeLabel || 'N/A'}" | Diff: ${item.difficulty || 'N/A'}`);
  }

  console.log('\n7. Deleting Resume via DELETE /api/resume/:id...');
  const delRes = await deleteJson(`${API_BASE}/resume/${testResume._id}`, token1);
  console.log('Delete resume response status:', delRes.success);

  console.log('\n8. Re-fetching GET /api/history for Account 1 after resume deletion...');
  const historyResAfterDelete = await getJson(`${API_BASE}/history`, token1);
  const historyItemsAfterDelete = historyResAfterDelete.data;
  console.log(`Account 1 still has ${historyItemsAfterDelete.length} history items.`);
  const foundDeletedResumeSession = historyItemsAfterDelete.find(s => s._id === resumeSession._id);
  if (!foundDeletedResumeSession) {
    throw new Error('Resume session was deleted when resume was deleted!');
  }
  console.log('Preserved resume session label:', foundDeletedResumeSession.resumeLabel);
  if (!foundDeletedResumeSession.resumeLabel.includes('(deleted)')) {
    throw new Error(`Expected resumeLabel to include '(deleted)', got '${foundDeletedResumeSession.resumeLabel}'`);
  }
  console.log('CONFIRMED: Past session preserved with "(deleted)" appended to resumeLabel!');

  console.log('\n9. Testing Multi-User Isolation with Account 2...');
  console.log('Registering Account 2:', email2);
  const reg2Res = await postJson(`${API_BASE}/auth/register`, {
    name: 'Bob Candidate',
    email: email2,
    password,
  });
  const token2 = reg2Res.token;

  const historyRes2 = await getJson(`${API_BASE}/history`, token2);
  console.log(`Account 2 history count: ${historyRes2.data.length} (Expected: 0)`);
  if (historyRes2.data.length !== 0) {
    throw new Error('Account 2 can see Account 1 history!');
  }

  const resumesRes2 = await getJson(`${API_BASE}/resume`, token2);
  console.log(`Account 2 resumes count: ${resumesRes2.data.length} (Expected: 0)`);
  if (resumesRes2.data.length !== 0) {
    throw new Error('Account 2 can see Account 1 resumes!');
  }

  console.log('\n10. Testing Sign-In persistence for Account 1...');
  // Simulating logging in again as Account 1
  const login1Res = await postJson(`${API_BASE}/auth/login`, {
    email: email1,
    password,
  });
  const reToken1 = login1Res.token;
  const reHistory1 = await getJson(`${API_BASE}/history`, reToken1);
  console.log(`Account 1 re-login history count: ${reHistory1.data.length} (Expected: 2)`);
  if (reHistory1.data.length !== 2) {
    throw new Error(`Expected 2 history items for Account 1 upon re-login, got ${reHistory1.data.length}`);
  }

  // Cleanup test users
  console.log('\n11. Cleaning up test data from DB...');
  await Session.deleteMany({ userId: { $in: [reg1Res.user._id, reg2Res.user._id] } });
  await Question.deleteMany({ userId: { $in: [reg1Res.user._id, reg2Res.user._id] } });
  await Resume.deleteMany({ userId: { $in: [reg1Res.user._id, reg2Res.user._id] } });
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  await User.deleteMany({ _id: { $in: [reg1Res.user._id, reg2Res.user._id] } });
  await mongoose.disconnect();

  console.log('\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
}

main().catch((err) => {
  console.error('\n*** VERIFICATION FAILED ***:', err.message);
  process.exit(1);
});
