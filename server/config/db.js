import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
};

// Register connection lifecycle listeners
mongoose.connection.on('connected', () => {
  console.log('[MongoDB] Event: Connected to database');
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Event: Disconnected from database');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Event: Reconnected to database');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Event: Connection error:', err.message);
});

/**
 * Connects to MongoDB with connection pooling, timeouts, and retry backoff.
 * Resolves only when connection succeeds, or throws if maxRetries exceeded.
 */
export const connectDB = async (maxRetries = 5, initialDelayMs = 2000) => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI environment variable is missing in server/.env');
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[MongoDB] Connecting to database (attempt ${attempt}/${maxRetries})...`);
      const conn = await mongoose.connect(mongoUri, mongooseOptions);
      console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
      console.log(`[MongoDB] Database: ${conn.connection.name}`);
      return conn;
    } catch (error) {
      console.error(`[MongoDB] Connection attempt ${attempt} failed: ${error.message}`);
      if (attempt === maxRetries) {
        console.error('[MongoDB] Max connection attempts exceeded. Initial database connection failed.');
        throw error;
      }
      const delay = Math.round(initialDelayMs * Math.pow(1.5, attempt - 1));
      console.log(`[MongoDB] Retrying initial connection in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export default connectDB;
