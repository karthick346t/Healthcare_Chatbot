import { Router, type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
    registerUser,
    loginUser,
    googleLogin,
    getUserById,
} from '../services/authService';
import authMiddleware from '../middleware/auth';

const router = Router();

// Rate limit login attempts: 10 per minute per IP
const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts. Please try again later.' },
});

/**
 * POST /api/auth/register
 */
router.post(
    '/register',
    [
        body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
        body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    ],
    async (req: Request, res: Response): Promise<void> => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: errors.array()[0].msg });
            return;
        }

        try {
            const { name, email, password } = req.body;
            const result = await registerUser(name, email, password);
            res.status(201).json(result);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Registration failed';
            const status = message.includes('already exists') ? 409 : 500;
            res.status(status).json({ error: message });
        }
    }
);

/**
 * POST /api/auth/login
 */
router.post(
    '/login',
    loginLimiter,
    [
        body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    async (req: Request, res: Response): Promise<void> => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: errors.array()[0].msg });
            return;
        }

        try {
            const { email, password } = req.body;
            const result = await loginUser(email, password);
            res.json(result);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Login failed';
            res.status(401).json({ error: message });
        }
    }
);

/**
 * POST /api/auth/google
 */
router.post(
    '/google',
    [body('idToken').notEmpty().withMessage('Google ID token is required')],
    async (req: Request, res: Response): Promise<void> => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: errors.array()[0].msg });
            return;
        }

        try {
            const { idToken } = req.body;
            const result = await googleLogin(idToken);
            res.json(result);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Google auth failed';
            res.status(401).json({ error: 'Google authentication failed. ' + message });
        }
    }
);

/**
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await getUserById(req.user!.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ user });
    } catch (err: unknown) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
