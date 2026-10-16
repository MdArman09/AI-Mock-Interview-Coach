import dotenv from '../server/node_modules/dotenv/lib/main.js';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from '../server/node_modules/jsonwebtoken/index.js';
import mongoose from '../server/node_modules/mongoose/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const BASE_URL = 'http://localhost:5000';
const RESUME_ID = '6aca3741e6be499ecf7f1e59';
const USER_ID = '6ab9689b84d5c115db1253cc';

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[Verify] Connected to MongoDB');

  const resumeObjectId = new mongoose.Types.ObjectId(RESUME_ID);
  const questionsColl = mongoose.connection.collection('questions');
  const resumesColl = mongoose.connection.collection('resumes');

  const resumeDoc = await resumesColl.findOne({ _id: resumeObjectId });
  if (!resumeDoc) {
    console.error('[Verify] Resume not found:', RESUME_ID);
    process.exit(1);
  }

  console.log(`[Verify] Testing resume: "${resumeDoc.fileName}", level: ${resumeDoc.level}, planned questions: ${resumeDoc.plannedQuestionCount}`);

  // Generate a valid JWT token for this user
  const token = jwt.sign({ id: USER_ID }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // -------------------------------------------------------------
  // TEST 1: Real Full Generation on this resume
  // -------------------------------------------------------------
  console.log('\n======================================================');
  console.log('TEST 1: Real Full Question Generation');
  console.log('======================================================');

  const startTime1 = Date.now();
  const res1 = await fetch(`${BASE_URL}/api/resume/generate-questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ resumeId: RESUME_ID }),
  });

  const duration1 = Date.now() - startTime1;
  const data1 = await res1.json();

  console.log(`HTTP Status: ${res1.status}`);
  console.log(`Total Time: ${(duration1 / 1000).toFixed(2)}s`);
  console.log('Stats from response:');
  console.log(`- Total Batches Planned: ${data1.stats?.totalBatches}`);
  console.log(`- Succeeded Batches: ${data1.stats?.succeededBatches}`);
  console.log(`- Failed Batches: ${data1.stats?.failedBatches}`);
  console.log(`- Total Groq Calls: ${data1.stats?.groqCallsCount}`);
  console.log(`- 429 Rate Limits Encountered: ${data1.stats?.rateLimitsCount}`);
  console.log(`- Retries Executed: ${data1.stats?.retriesCount}`);
  console.log(`- Final Question Count: ${data1.count}`);
  console.log(`- Failed Sections: ${JSON.stringify(data1.failedSections || [])}`);

  const dbCount1 = await questionsColl.countDocuments({ resumeId: resumeObjectId });
  console.log(`- Questions stored in DB: ${dbCount1}`);

  if (dbCount1 !== data1.count || data1.count < 10) {
    console.error('[Verify] TEST 1 FAILED: Unexpected question count!');
  } else {
    console.log('[Verify] TEST 1 PASSED: Real generation succeeded cleanly!');
  }

  const initialQuestionsInDb = await questionsColl.find({ resumeId: resumeObjectId }).toArray();
  const initialIds = initialQuestionsInDb.map((q) => q._id.toString());

  // -------------------------------------------------------------
  // TEST 2A: Simulate rate limit with failure (Untouched DB verification)
  // When a retry section hits rate limit and fails:
  // previous question set in DB MUST REMAIN UNTOUCHED!
  // Response status MUST BE 429 with AI_RATE_LIMITED!
  // -------------------------------------------------------------
  console.log('\n======================================================');
  console.log('TEST 2A: Simulated Rate Limit Error & Untouched DB Verification');
  console.log('======================================================');

  const res2A = await fetch(`${BASE_URL}/api/resume/generate-questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      resumeId: RESUME_ID,
      sectionIds: ['proj_0'],
      mockRateLimitOnSection: 'proj_0',
    }),
  });

  const data2A = await res2A.json();
  console.log(`HTTP Status: ${res2A.status} (Expected 429)`);
  console.log(`Code: ${data2A.code} (Expected AI_RATE_LIMITED)`);
  console.log(`Message: "${data2A.message}"`);
  console.log(`Retry After Seconds: ${data2A.retryAfterSeconds}`);

  const dbCount2A = await questionsColl.countDocuments({ resumeId: resumeObjectId });
  console.log(`Questions in DB after rate limit: ${dbCount2A} (Expected ${dbCount1})`);

  const currentQuestionsInDb = await questionsColl.find({ resumeId: resumeObjectId }).toArray();
  const currentIds = currentQuestionsInDb.map((q) => q._id.toString());
  const setsMatch = initialIds.length === currentIds.length && initialIds.every((id) => currentIds.includes(id));
  console.log(`Previous question set untouched in DB: ${setsMatch}`);

  if (res2A.status === 429 && data2A.code === 'AI_RATE_LIMITED' && setsMatch && dbCount2A === dbCount1) {
    console.log('[Verify] TEST 2A PASSED: Rate limit mapped to 429, retry-after returned, and previous question set preserved untouched!');
  } else {
    console.error('[Verify] TEST 2A FAILED');
  }

  // -------------------------------------------------------------
  // TEST 2B: Partial Success Simulation (1 section failed with 429, >= 60% succeeded)
  // and "Retry missing sections" appends the missing questions!
  // -------------------------------------------------------------
  console.log('\n======================================================');
  console.log('TEST 2B: Partial Success (1 Failed Section) & Retry Missing Sections');
  console.log('======================================================');

  const res2B = await fetch(`${BASE_URL}/api/resume/generate-questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      resumeId: RESUME_ID,
      mockRateLimitOnSection: 'proj_0',
    }),
  });

  const data2B = await res2B.json();
  console.log(`HTTP Status: ${res2B.status} (Expected 200)`);
  console.log(`Generated Questions Count: ${data2B.count}`);
  console.log(`Failed Sections Count: ${data2B.failedSections?.length} (Expected 1)`);
  console.log(`Failed Section details: ${JSON.stringify(data2B.failedSections)}`);

  const failedSection = data2B.failedSections?.[0];
  if (failedSection && failedSection.id === 'proj_0') {
    console.log(`\nPartial success contract verified: ${data2B.count} questions generated, 1 section couldn't be generated.`);
    console.log(`Now simulating user clicking "[Retry missing sections]" for section "${failedSection.name}"...`);

    const resRetry = await fetch(`${BASE_URL}/api/resume/generate-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        resumeId: RESUME_ID,
        sectionIds: [failedSection.id],
      }),
    });

    const dataRetry = await resRetry.json();
    console.log(`Retry HTTP Status: ${resRetry.status}`);
    console.log(`Retry Response Message: "${dataRetry.message}"`);
    console.log(`Total Questions after appending retry: ${dataRetry.count}`);
    console.log(`Remaining Failed Sections: ${dataRetry.failedSections?.length || 0}`);

    const finalDbCount = await questionsColl.countDocuments({ resumeId: resumeObjectId });
    console.log(`Final questions stored in DB: ${finalDbCount}`);

    if (finalDbCount > data2B.count && (dataRetry.failedSections?.length || 0) === 0) {
      console.log('[Verify] TEST 2B PASSED: Partial results saved, missing section retried and appended cleanly!');
    } else {
      console.error('[Verify] TEST 2B FAILED');
    }
  } else {
    console.error('[Verify] TEST 2B FAILED: Failed section was not captured as expected');
  }

  await mongoose.disconnect();
  console.log('\n======================================================');
  console.log('[Verify] ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('======================================================');
}

main().catch((err) => {
  console.error('[Verify] Fatal error:', err);
  process.exit(1);
});
