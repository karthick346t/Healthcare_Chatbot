import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
import logger from '../utils/logger';

// Extend Express Request type to include user (with role)
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role?: string;
            };
        }
    }
}

/**
 * JWT Authentication Middleware
 * Extracts Bearer token from Authorization header, verifies it,
 * and attaches userId + role to req.user for downstream handlers.
 * Role is embedded in the JWT — no DB lookup needed.
 */
export default function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('Authentication failed: missing Bearer token', {
            method: req.method,
            path: req.originalUrl,
            ip: req.ip,
            hasAuthorizationHeader: Boolean(authHeader),
            userAgent: req.headers['user-agent']
        });
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token);
        req.user = { userId: decoded.userId, role: decoded.role };
        logger.debug('Authentication success', {
            method: req.method,
            path: req.originalUrl,
            userId: decoded.userId,
            role: decoded.role
        });
        next();
    } catch (err) {
        logger.warn('Authentication failed: invalid or expired token', {
            method: req.method,
            path: req.originalUrl,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        res.status(401).json({ error: 'Invalid or expired token.' });
        return;
    }
}

/**
 * Admin Middleware
 * Reads role from the JWT (already in req.user) — zero DB lookups.
 * Must be placed AFTER authMiddleware.
 */
export function adminMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!req.user) {
        res.status(401).json({ error: 'Access denied. Not authenticated.' });
        return;
    }

    if (req.user.role !== 'admin') {
        res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        return;
    }

    next();
}

/**
 * Staff Middleware
 * Reads role from the JWT (already in req.user) — zero DB lookups.
 * Must be placed AFTER authMiddleware.
 */
export function staffMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!req.user) {
        res.status(401).json({ error: 'Access denied. Not authenticated.' });
        return;
    }

    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
        res.status(403).json({ error: 'Access denied. Staff privileges required.' });
        return;
    }

    next();
}
