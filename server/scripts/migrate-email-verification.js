import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('[Migration Error]: MONGO_URI is missing from environment.');
  process.exit(1);
}

const runMigration = async () => {
  try {
    console.log('[Migration] Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('[Migration] Connected to MongoDB.');

    // Find all users that either don't have emailVerified = true or don't have tokenVersion set
    const filter = {
      $or: [
        { emailVerified: { $ne: true } },
        { tokenVersion: { $exists: false } },
        { tokenVersion: null },
      ],
    };

    const countToUpdate = await User.countDocuments(filter);
    console.log(`[Migration] Found ${countToUpdate} existing user(s) needing update.`);

    const result = await User.updateMany(filter, {
      $set: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        tokenVersion: 0,
      },
    });

    console.log(`[Migration] Idempotent migration complete. Updated ${result.modifiedCount} user(s) to emailVerified: true, tokenVersion: 0.`);
    await mongoose.disconnect();
    console.log('[Migration] Database disconnected cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('[Migration Failed]:', error);
    process.exit(1);
  }
};

runMigration();
