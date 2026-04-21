import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import config from '../config';
import { registerUser, loginUser, googleLogin, generateAccessToken } from '../services/authService';
import { revokeRefreshToken, findRefreshTokenInDB } from '../models/RefreshToken';
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
            const { user, accessToken, refreshToken } = await registerUser(name, email, password);
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            res.status(201).json({ user, token: accessToken });
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
            const { user, accessToken, refreshToken } = await loginUser(email, password);
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            res.json({ user, token: accessToken });
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
            const { user, accessToken, refreshToken } = await googleLogin(idToken);
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            res.json({ user, token: accessToken });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Google auth failed';
            res.status(401).json({ error: 'Google authentication failed. ' + message });
        }
    }
);

/**
 * POST /api/auth/refresh
 * Issues a new access token using the stored httpOnly refresh token cookie.
 * Validates against the DB to detect revoked tokens.
 */
router.post('/refresh', async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token provided' });
    }

    try {
        // 1. Verify JWT signature + expiry
        const decoded = jwt.verify(
            refreshToken,
            config.JWT_REFRESH_SECRET || config.JWT_SECRET
        ) as { userId: string };

        // 2. Check the token hasn't been revoked in the DB
        const storedToken = await findRefreshTokenInDB(refreshToken, decoded.userId);
        if (!storedToken) {
            return res.status(403).json({ error: 'Refresh token has been revoked. Please log in again.' });
        }

        // 3. Get current user role (role may have changed since token was issued)
        const user = await User.findById(decoded.userId).select('role');
        if (!user) {
            return res.status(403).json({ error: 'User account not found.' });
        }

        // 4. Issue new access token with fresh role
        const newAccessToken = generateAccessToken(decoded.userId, user.role);
        res.json({ token: newAccessToken });
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }
});

/**
 * POST /api/auth/logout
 * Clears the cookie AND deletes the refresh token from the DB (true revocation).
 */
router.post('/logout', async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
        try {
            await revokeRefreshToken(refreshToken);
            console.log('[Auth] Refresh token revoked on logout');
        } catch (err) {
            console.error('[Auth] Failed to revoke refresh token:', err);
        }
    }

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user!.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
            gender: user.gender,
            dateOfBirth: user.dateOfBirth,
            bloodGroup: user.bloodGroup,
            address: user.address,
            allergies: user.allergies,
            chronicConditions: user.chronicConditions,
            emergencyContact: user.emergencyContact
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PUT /api/auth/profile
 */
router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
    try {
        const updates = req.body;
        // Prevent updating sensitive fields via this endpoint
        delete updates.password;
        delete updates.role;
        delete updates.email;
        delete updates.googleId;

        const user = await User.findByIdAndUpdate(
            req.user!.userId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
