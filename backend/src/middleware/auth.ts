import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
            };
        }
    }
}

/**
 * JWT Authentication Middleware
 * Extracts Bearer token from Authorization header, verifies it,
 * and attaches userId to req.user for downstream handlers.
 */
export default function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token);
        req.user = { userId: decoded.userId };
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token.' });
        return;
    }
}

/**
 * Admin Middleware
 * Checks if the authenticated user has 'admin' role.
 * Must be placed AFTER authMiddleware.
 */
export const adminMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user || !req.user.userId) {
            res.status(401).json({ error: 'Access denied. Not authenticated.' });
            return;
        }

        const user = await import('../models/User').then(m => m.default.findById(req.user!.userId));

        if (!user || user.role !== 'admin') {
            res.status(403).json({ error: 'Access denied. Admin privileges required.' });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({ error: 'Server error checking admin privileges.' });
    }
};
