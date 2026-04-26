import { NextFunction, Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`
    }
  });
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = Number(err?.statusCode) || Number(err?.status) || 500;
  const message = err?.message || 'Internal server error';
  const code = err?.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');

  if (statusCode >= 500) {
    console.error(`[ErrorMiddleware] ${req.method} ${req.originalUrl}:`, err);
  }

  if (res.headersSent) return;
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message
    }
  });
}

