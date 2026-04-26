// src/app.ts
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import i18nextMiddleware from 'i18next-http-middleware';

import mongoose from 'mongoose';
import chatRouter from './routes/chat';
import uploadRouter from './routes/upload';
import ragRouter from './routes/rag';
import appointmentRouter from './routes/appointments';
import authRouter from './routes/auth';
import backupRouter from './routes/backup';
import adminRouter from './routes/admin';
import doctorRouter from './routes/doctors';
import reportRouter from './routes/reports';
import ttsRouter from './routes/ttsRoutes';
import localizationMiddleware from './middleware/localization';
import { auditLogger } from './middleware/audit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import config from './config';
import { vectorStore } from './services/ragService';

import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import logger from './utils/logger';

const app = express();

// Request logging with response time
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      statusCode: res.statusCode,
      responseTime: duration
    });
  });
  next();
});

// ─────────────────────────────────────────────
// Security Headers (Helmet)
// ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // NOTE: 'unsafe-inline' kept because Swagger UI (/api/docs) injects inline scripts.
      // If Swagger is moved behind auth or removed, drop 'unsafe-inline' too.
      // 'unsafe-eval' intentionally removed — it enables arbitrary JS eval().
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginOpenerPolicy: false,
}));

// ─────────────────────────────────────────────
// CORS — only allow known frontend origins
// ─────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (config.FRONTEND_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    const corsError: any = new Error(`CORS: origin '${origin}' is not allowed.`);
    corsError.statusCode = 403;
    corsError.code = 'CORS_ORIGIN_DENIED';
    callback(corsError);
  },
  credentials: true,
}));

// ─────────────────────────────────────────────
// Rate Limiting — 60 req/min globally (tightened from 100)
// ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please slow down and try again in a minute.'
    }
  },
});
app.use(limiter);

// Stricter limit for auth endpoints (10 req/min)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED_AUTH',
      message: 'Too many authentication attempts. Please wait a minute.'
    }
  },
});

// ─────────────────────────────────────────────
// Body & Cookie Parsers
// ─────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// ─────────────────────────────────────────────
// i18n Internationalization
// ─────────────────────────────────────────────
i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    preload: ['en', 'es'],
    backend: { loadPath: __dirname + '/locales/{{lng}}.json' }
  });
app.use(i18nextMiddleware.handle(i18next));
app.use(localizationMiddleware);

// ─────────────────────────────────────────────
// Audit Logging — fire-and-forget for all mutations
// ─────────────────────────────────────────────
app.use(auditLogger);

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────
app.get('/healthz', async (req: Request, res: Response) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbConnected = dbState === 1;
    const ragStats = await vectorStore.getStats().catch(() => ({ totalCount: 0 }));

    if (!dbConnected) {
      return res.status(503).json({
        status: "error",
        db: "disconnected",
        rag: { docs: ragStats.totalCount, enabled: config.RAG_ENABLED },
        uptime: Math.floor(process.uptime()) + 's',
        env: config.NODE_ENV,
      });
    }

    res.json({
      status: "ok",
      db: "connected",
      rag: { docs: ragStats.totalCount, enabled: config.RAG_ENABLED },
      uptime: Math.floor(process.uptime()) + 's',
      env: config.NODE_ENV,
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({ status: "error", message: "Service unavailable" });
  }
});
app.use('/api/chat', chatRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/rag', ragRouter);
app.use('/api/auth', authLimiter, authRouter); // ✅ Stricter rate limit on auth
app.use('/api/backup', backupRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/doctors', doctorRouter);
app.use('/api/admin', adminRouter);
app.use('/api/reports', reportRouter);
app.use('/api/tts', ttsRouter);

// ─────────────────────────────────────────────
// Swagger UI (Development only)
// ─────────────────────────────────────────────
if (config.NODE_ENV !== 'production') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// ─────────────────────────────────────────────
// Serve Frontend (Single-Port Deployment)
// ─────────────────────────────────────────────
const frontendPath = path.join(__dirname, '../public');
app.use(express.static(frontendPath));

// 404 handler for API routes (must be before SPA catch-all)
app.use('/api', notFoundHandler);

// Catch-all: serve the React app for any non-API route
app.get(/(.*)/, (req: Request, res: Response) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized error handler (last middleware)
app.use(errorHandler);

export default app;


