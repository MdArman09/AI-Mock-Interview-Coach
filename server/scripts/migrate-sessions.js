import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Idempotent migration script for legacy sessions:
 * For existing sessions with no questionSource:
 * - Looks up the question by questionId.
 * - If question exists and has a resumeId or source: "resume-generated", sets questionSource: "resume"
 *   (and the label if the resume still exists, or question's label).
 * - Copies difficulty, questionType, and anchor if available.
 * - Everything else defaults to questionSource: "bank".
 * - Logs how many sessions were updated.
 */
export async function migrateLegacySessions() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is missing in server/.env');
  }

  const isAlreadyConnected = mongoose.connection.readyState === 1;
  if (!isAlreadyConnected) {
    await mongoose.connect(mongoUri);
    console.log('[Migration] Connected to MongoDB');
  }

  const sessionsColl = mongoose.connection.collection('sessions');
  const questionsColl = mongoose.connection.collection('questions');
  const resumesColl = mongoose.connection.collection('resumes');

  // Find sessions without questionSource
  const unmigratedSessions = await sessionsColl
    .find({
      $or: [
        { questionSource: { $exists: false } },
        { questionSource: null },
      ],
    })
    .toArray();

  console.log(`[Migration] Found ${unmigratedSessions.length} legacy sessions needing migration.`);

  let updatedCount = 0;

  for (const session of unmigratedSessions) {
    let questionSource = 'bank';
    let resumeId = null;
    let resumeLabel = null;
    let difficulty = null;
    let questionType = null;
    let anchor = null;

    if (session.questionId) {
      const q = await questionsColl.findOne({ _id: session.questionId });
      if (q) {
        difficulty = q.difficulty || null;
        questionType = q.type || q.category || null;
        anchor = q.anchor || null;

        const isResumeQuestion =
          Boolean(q.resumeId) ||
          q.source === 'resume-generated' ||
          q.category === 'Resume';

        if (isResumeQuestion) {
          questionSource = 'resume';
          if (q.resumeId) {
            resumeId = q.resumeId;
            const r = await resumesColl.findOne({ _id: q.resumeId });
            if (r) {
              resumeLabel = r.label || r.fileName || 'Resume';
            }
          }
          if (!resumeLabel) {
            resumeLabel = q.resumeLabel || 'Resume';
          }
        }
      }
    }

    const updateDoc = {
      $set: {
        questionSource,
        resumeId: resumeId || undefined,
        resumeLabel: resumeLabel || undefined,
        difficulty: difficulty || undefined,
        questionType: questionType || undefined,
        anchor: anchor || undefined,
      },
    };

    await sessionsColl.updateOne({ _id: session._id }, updateDoc);
    updatedCount++;
  }

  console.log(`[Migration] Successfully migrated ${updatedCount} sessions.`);

  if (!isAlreadyConnected) {
    await mongoose.disconnect();
    console.log('[Migration] MongoDB disconnected');
  }

  return updatedCount;
}

// Direct execution support
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrateLegacySessions()
    .then((count) => {
      console.log(`[Migration] Done. ${count} sessions updated.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration] Failed:', err);
      process.exit(1);
    });
}
