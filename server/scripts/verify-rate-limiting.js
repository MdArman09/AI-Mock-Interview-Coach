import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import AuthToken from '../models/AuthToken.js';
import {
  registerLimiter,
  loginIpLimiter,
  formatWaitTime,
} from '../middleware/rateLimiters.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;

const runVerifications = async () => {
  console.log('================================================================');
  console.log('      RATE LIMITING CONFIGURATION & ROBUSTNESS VERIFICATION     ');
  console.log('================================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB for test user tracking.');

  const createdEmails = [];

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Development Generous Limits (Create 7 accounts in a row)
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Development Mode: Creating 7 accounts in a row ---');
    console.log(`Current NODE_ENV on live server: ${process.env.NODE_ENV || 'development'}`);

    const baseTimestamp = Date.now();
    let devSuccessCount = 0;

    for (let i = 1; i <= 7; i++) {
      const email = `dev_acc_${baseTimestamp}_${i}@example.com`;
      createdEmails.push(email);

      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Dev User ${i}`,
          email,
          password: 'ValidPassword123!',
        }),
      });

      const body = await res.json();
      if (res.status === 201 && body.code === 'VERIFICATION_SENT') {
        devSuccessCount++;
        console.log(`✓ Account ${i}/7 registered successfully: status 201, code ${body.code}`);
      } else {
        console.error(`✗ Account ${i}/7 failed: status ${res.status}`, body);
      }
    }

    if (devSuccessCount === 7) {
      console.log('✓ PASS: Created 7 accounts in a row without encountering a 429 rate limit in development.');
    } else {
      console.error(`✗ FAIL: Only ${devSuccessCount}/7 accounts registered without hitting rate limit.`);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Production Mode Rate Limit Trigger & Minute Formatting
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Production Mode Simulation: Limit enforcement & Minutes formatting ---');

    // Spin up an isolated Express server with NODE_ENV="production" and production limits
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.RATE_LIMIT_REGISTER_MAX = '3'; // Set limit to 3 for fast simulation
    process.env.RATE_LIMIT_REGISTER_WINDOW_MS = '3600000'; // 1 hour (3600 seconds)

    const prodApp = express();
    prodApp.set('trust proxy', 1);
    prodApp.use(express.json());

    prodApp.post('/prod-register-test', registerLimiter, (req, res) => {
      res.status(201).json({ success: true, message: 'Simulated created' });
    });

    const testServer = await new Promise((resolve) => {
      const s = prodApp.listen(5098, () => resolve(s));
    });

    console.log('Spawned production-mode test listener on port 5098 with RATE_LIMIT_REGISTER_MAX=3');

    let prodResponses = [];
    for (let i = 1; i <= 4; i++) {
      const res = await fetch('http://localhost:5098/prod-register-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      prodResponses.push({ status: res.status, data });
      console.log(`Production Request #${i}: status ${res.status}, code ${data.code || 'SUCCESS'}, message: "${data.message}"`);
    }

    const fourthReq = prodResponses[3];
    const isRateLimited = fourthReq.status === 429 && fourthReq.data.code === 'RATE_LIMITED';
    const hasMinutes = fourthReq.data.message.includes('minute');

    if (isRateLimited && hasMinutes) {
      console.log('✓ PASS: In production mode, request exceeding limit was rejected with 429 RATE_LIMITED.');
      console.log(`✓ PASS: Message correctly formatted wait time in minutes: "${fourthReq.data.message}"`);
    } else {
      console.error('✗ FAIL: Production rate limit did not return expected 429 or minutes format.', fourthReq);
    }

    // -------------------------------------------------------------------------
    // TEST 3: RATE_LIMIT_DISABLED Ignored in Production Mode
    // -------------------------------------------------------------------------
    console.log('\n--- 3. RATE_LIMIT_DISABLED Ignored in Production ---');
    process.env.RATE_LIMIT_DISABLED = 'true';
    // Verify that despite RATE_LIMIT_DISABLED=true, requests still get 429 in production
    const fifthReq = await fetch('http://localhost:5098/prod-register-test', { method: 'POST' });
    const fifthData = await fifthReq.json();

    if (fifthReq.status === 429) {
      console.log('✓ PASS: RATE_LIMIT_DISABLED=true is strictly ignored when NODE_ENV="production".');
    } else {
      console.error('✗ FAIL: RATE_LIMIT_DISABLED was erroneously honored in production mode.');
    }

    // Close test server and restore original env
    await new Promise((resolve) => testServer.close(resolve));
    process.env.NODE_ENV = originalEnv;
    delete process.env.RATE_LIMIT_DISABLED;
    delete process.env.RATE_LIMIT_REGISTER_MAX;
    delete process.env.RATE_LIMIT_REGISTER_WINDOW_MS;

    // -------------------------------------------------------------------------
    // TEST 4: FormatWaitTime Threshold Verification (<= 90s vs > 90s)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Wait Time Formatting Unit Checks ---');
    const wait45 = formatWaitTime(45);
    const wait90 = formatWaitTime(90);
    const wait91 = formatWaitTime(91);
    const wait3060 = formatWaitTime(3060); // 51 minutes
    const wait3600 = formatWaitTime(3600); // 60 minutes

    console.log(`45 seconds:  "${wait45}" (Expected: "about 45 seconds")`);
    console.log(`90 seconds:  "${wait90}" (Expected: "about 90 seconds")`);
    console.log(`91 seconds:  "${wait91}" (Expected: "about 2 minutes")`);
    console.log(`3060 seconds: "${wait3060}" (Expected: "about 51 minutes")`);
    console.log(`3600 seconds: "${wait3600}" (Expected: "about 60 minutes")`);

    const formattingValid =
      wait45 === 'about 45 seconds' &&
      wait90 === 'about 90 seconds' &&
      wait91 === 'about 2 minutes' &&
      wait3060 === 'about 51 minutes' &&
      wait3600 === 'about 60 minutes';

    if (formattingValid) {
      console.log('✓ PASS: All wait time formatting thresholds match specification.');
    } else {
      console.error('✗ FAIL: Wait time formatting failed specification.');
    }

    // -------------------------------------------------------------------------
    // TEST 5: Cleanup Test Accounts
    // -------------------------------------------------------------------------
    if (createdEmails.length > 0) {
      const users = await User.find({ email: { $in: createdEmails } });
      const userIds = users.map((u) => u._id);
      await User.deleteMany({ _id: { $in: userIds } });
      await AuthToken.deleteMany({ userId: { $in: userIds } });
      console.log(`\n✓ Cleaned up ${createdEmails.length} test accounts and tokens from MongoDB.`);
    }

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB.');
    console.log('\n================================================================');
    console.log('             RATE LIMITING VERIFICATION FINISHED                ');
    console.log('================================================================');
  }
};

runVerifications();
