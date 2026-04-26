import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog';

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
      userId:    req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined,
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
