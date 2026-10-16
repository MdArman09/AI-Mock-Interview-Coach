import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import validateEnv from './config/validateEnv.js';
import sanitizeNoSql from './middleware/sanitizeNoSql.js';
import authRoutes from './routes/auth.js';
import questionRoutes from './routes/questions.js';
import sessionRoutes from './routes/sessionRoutes.js';
import userRoutes from './routes/user.js';
import resumeRoutes from './routes/resume.js';
import contactRoutes from './routes/contact.js';
import { verifyEmailServiceStartup } from './services/emailService.js';

// Catch unhandled rejections and uncaught exceptions with full stack traces
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection] at:', promise);
  if (reason instanceof Error) {
    console.error('[Unhandled Rejection Stack]:', reason.stack);
  } else {
    console.error('[Unhandled Rejection Reason]:', reason);
  }
});

process.on('uncaughtException', (error) => {
  console.error('[Uncaught Exception]:', error.message);
  console.error('[Uncaught Exception Stack]:', error.stack);
});

// Load environment variables (supports launching from project root or server directory)
const __serverDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.join(__serverDir, '.env') });

// Validate required environment variables immediately before accepting connections
validateEnv();

const app = express();

// Trust reverse proxy for correct client IP detection with rate limiting
app.set('trust proxy', 1);

// Security headers and information disclosure protection
app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: false, // CSP managed at frontend/reverse proxy layer
    crossOriginEmbedderPolicy: false,
  })
);

// CORS allowlist configuration
const getCorsOrigins = () => {
  const allowed = new Set();
  if (process.env.FRONTEND_URL) {
    allowed.add(process.env.FRONTEND_URL.trim().replace(/\/$/, ''));
  }
  if (process.env.CORS_ORIGINS) {
    process.env.CORS_ORIGINS.split(',').forEach((orig) => {
      const clean = orig.trim().replace(/\/$/, '');
      if (clean) allowed.add(clean);
    });
  }
  // Allow local dev client only when not running in production
  if (process.env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:5173');
    allowed.add('http://127.0.0.1:5173');
  }
  return allowed;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = getCorsOrigins();
    const cleanOrigin = origin.trim().replace(/\/$/, '');
    if (allowed.has(cleanOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not permitted by CORS policy`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// HTTP request logger: method, path, status, and duration only (no query tokens, bodies, or headers)
app.use(
  morgan((tokens, req, res) => {
    const method = tokens.method(req, res);
    const url = tokens.url(req, res).split('?')[0];
    const status = tokens.status(req, res);
    const responseTime = tokens['response-time'](req, res);
    return `[HTTP] ${method} ${url} ${status} - ${responseTime}ms`;
  })
);

// Body parser limits: 1mb for /api/analyze (spoken transcripts), 100kb default everywhere else
app.use('/api/analyze', express.json({ limit: '1mb' }));
app.use(express.json({ limit: '100kb' }));

// NoSQL injection protection: recursively sanitize '$' and '.' keys in body, query, and params
app.use(sanitizeNoSql);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api', sessionRoutes);

// Health check endpoint reporting DB state, uptime, and detected client IP (in development)
app.get('/api/health', (req, res) => {
  const readyStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const readyState = mongoose.connection.readyState;
  const dbState = readyStateMap[readyState] || 'unknown';
  const isDbHealthy = readyState === 1;
  const isDev = process.env.NODE_ENV !== 'production';

  const healthData = {
    status: isDbHealthy ? 'ok' : 'degraded',
    uptime: Math.floor(process.uptime()),
    uptimeFormatted: `${Math.floor(process.uptime())}s`,
    database: {
      status: dbState,
      readyState,
      healthy: isDbHealthy,
    },
    timestamp: new Date().toISOString(),
  };

  // Include detected client IP in development only
  if (isDev) {
    healthData.clientIp = req.ip;
  }

  res.status(isDbHealthy ? 200 : 503).json(healthData);
});

// Centralized 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `API route not found: ${req.method} ${req.originalUrl.split('?')[0]}`,
  });
});

// Centralized error handler: strictly conceals stack traces and internal errors in production
app.use((err, req, res, next) => {
  // CORS policy violation
  if (err.message && err.message.includes('not permitted by CORS policy')) {
    return res.status(403).json({
      success: false,
      code: 'CORS_FORBIDDEN',
      message: 'Request origin not permitted by CORS policy',
    });
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      code: 'FILE_TOO_LARGE',
      message: 'Uploaded file exceeds the maximum size limit of 5MB',
    });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      code: 'UPLOAD_ERROR',
      message: err.message,
    });
  }

  // Body parser size limit
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request payload exceeds maximum allowed size limit',
    });
  }

  // Malformed JSON syntax
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_JSON',
      message: 'Malformed JSON payload in request body',
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  console.error(`[Server Error] ${err.name || 'Error'}: ${err.message}`);
  if (isDev && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    code: err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR'),
    message: isDev
      ? err.message
      : statusCode === 500
      ? 'An unexpected server error occurred'
      : err.message,
  });
});

const PORT = process.env.PORT || 5000;
let server;

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`[Server] Received ${signal}. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP connections closed.');
      try {
        await mongoose.connection.close(false);
        console.log('[MongoDB] Database connection closed.');
      } catch (err) {
        console.error('[MongoDB] Error closing database connection:', err.message);
      }
      process.exit(0);
    });

    // Force exit if hanging connections persist past 10 seconds
    setTimeout(() => {
      console.error('[Server] Graceful shutdown timeout reached. Force exiting.');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Don't start accepting requests until the initial DB connection succeeds
const startServer = async () => {
  try {
    await connectDB();
    await verifyEmailServiceStartup();
    server = app.listen(PORT, () => {
      console.log(`[Server] AI Mock Interview Coach backend running on port ${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('[Server] Fatal startup error — could not establish database connection:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;
