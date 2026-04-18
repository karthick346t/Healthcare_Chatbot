import { Request, Response, NextFunction } from 'express';
import mongoose, { Schema } from 'mongoose';

// ─────────────────────────────────────────────
// Audit Log Model (inline — keeps middleware self-contained)
// ─────────────────────────────────────────────
const AuditLogSchema = new Schema({
  userId:    { type: String, default: 'anonymous' },
  method:    { type: String, required: true },
  path:      { type: String, required: true },
  status:    { type: Number },
  ip:        { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
});

// compound index for efficient lookups by user + time
AuditLogSchema.index({ userId: 1, timestamp: -1 });

const AuditLog = mongoose.models['AuditLog'] ||
  mongoose.model('AuditLog', AuditLogSchema);

// ─────────────────────────────────────────────
// Middleware
// Records all state-mutating requests (POST / PUT / PATCH / DELETE)
// Non-blocking: fires-and-forgets so it never slows the response.
// ─────────────────────────────────────────────
export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  // Only track mutations — skip reads and static assets
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  // Capture status code after response finishes
  res.on('finish', () => {
    const entry = {
      userId:    req.user?.userId ?? 'anonymous',
      method:    req.method,
      path:      req.path,
      status:    res.statusCode,
      ip:        req.ip ?? req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'] ?? 'unknown',
    };

    // Fire-and-forget — never block the response
    AuditLog.create(entry).catch((err: any) =>
      console.error('[AuditLog] Failed to write audit entry:', err?.message)
    );
  });

  next();
}
