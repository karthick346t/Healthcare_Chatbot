// src/app.ts
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import i18nextMiddleware from 'i18next-http-middleware';

import chatRouter from './routes/chat';
import uploadRouter from './routes/upload';
import ragRouter from './routes/rag';
import appointmentRouter from './routes/appointments';
import authRouter from './routes/auth';
import backupRouter from './routes/backup';
import adminRouter from './routes/admin';
import doctorRouter from './routes/doctors';
import reportRouter from './routes/reports';
import localizationMiddleware from './middleware/localization';
import { auditLogger } from './middleware/audit';
import config from './config';

import path from 'path';

const app = express();

// ─────────────────────────────────────────────
// Security Headers (Helmet)
// ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
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
    callback(new Error(`CORS: origin '${origin}' is not allowed.`));
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
  message: { error: 'Too many requests. Please slow down and try again in a minute.' },
});
app.use(limiter);

// Stricter limit for auth endpoints (10 req/min)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts. Please wait a minute.' },
});

// ─────────────────────────────────────────────
// Body Parser
// ─────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));

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
    const mongoose = require('mongoose');
    const { vectorStore } = require('./services/ragService');
    const dbState = mongoose.connection.readyState;
    const ragDocs = vectorStore.getDocuments().length;
    res.json({
      status: "ok",
      db: dbState === 1 ? "connected" : "disconnected",
      rag: { docs: ragDocs, enabled: config.RAG_ENABLED },
      uptime: Math.floor(process.uptime()) + 's',
      env: config.NODE_ENV,
    });
  } catch (error) {
    res.status(500).json({ status: "error" });
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

// ─────────────────────────────────────────────
// Serve Frontend (Single-Port Deployment)
// ─────────────────────────────────────────────
const frontendPath = path.join(__dirname, '../public');
app.use(express.static(frontendPath));

// Catch-all: serve the React app for any non-API route
app.get(/(.*)/, (req: Request, res: Response) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

export default app;

