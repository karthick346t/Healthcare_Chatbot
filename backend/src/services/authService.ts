import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { OAuth2Client } from 'google-auth-library';
import config from '../config';
import { uploadUserBackup } from './awsService';
import { saveRefreshTokenToDB } from '../models/RefreshToken';

const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

/**
 * Generate Access JWT token for a user.
 * Now includes the user's role so downstream middleware
 * can authorise without a DB lookup.
 */
export function generateAccessToken(userId: string, role: string = 'patient'): string {
    return jwt.sign({ userId, role }, config.JWT_SECRET, {
        expiresIn: (config.JWT_EXPIRES_IN || '15m') as any,
    });
}

/**
 * Generate Refresh JWT token for a user.
 */
export function generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, config.JWT_REFRESH_SECRET, {
        expiresIn: (config.JWT_REFRESH_EXPIRES_IN || '7d') as any,
    });
}

/**
 * Verify and decode a JWT access token.
 */
export function verifyToken(token: string): { userId: string; role?: string } {
    return jwt.verify(token, config.JWT_SECRET) as { userId: string; role?: string };
}

/**
 * Register a new user with email and password.
 */
export async function registerUser(
    name: string,
    email: string,
    password: string
): Promise<{ user: unknown; accessToken: string; refreshToken: string }> {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error('An account with this email already exists');
    }

    const user = await User.create({ name, email, password });
    const accessToken = generateAccessToken(String(user._id), user.role);
    const refreshToken = generateRefreshToken(String(user._id));

    // Persist refresh token to DB for revocation support
    await saveRefreshTokenToDB(String(user._id), refreshToken).catch(err =>
        console.error('⚠️ Failed to persist refresh token:', err)
    );

    // Trigger S3 User Backup (Non-blocking)
    uploadUserBackup(user).catch(err =>
        console.error(`⚠️ S3 User Backup Failed for ${user._id}:`, err)
    );

    const userObj = JSON.parse(JSON.stringify(user));
    delete userObj.password;

    return { user: userObj, accessToken, refreshToken };
}

/**
 * Login with email and password.
 */
export async function loginUser(
    email: string,
    password: string
): Promise<{ user: unknown; accessToken: string; refreshToken: string }> {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        throw new Error('Invalid email or password');
    }

    if (!user.password) {
        throw new Error('This account uses Google Sign-In. Please sign in with Google.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

    const accessToken = generateAccessToken(String(user._id), user.role);
    const refreshToken = generateRefreshToken(String(user._id));

    // Persist refresh token to DB for revocation support
    await saveRefreshTokenToDB(String(user._id), refreshToken).catch(err =>
        console.error('⚠️ Failed to persist refresh token:', err)
    );

    // Trigger S3 User Backup (Non-blocking)
    uploadUserBackup(user).catch(err =>
        console.error(`⚠️ S3 User Backup Failed for ${user._id}:`, err)
    );

    const userObj = JSON.parse(JSON.stringify(user));
    delete userObj.password;

    return { user: userObj, accessToken, refreshToken };
}

/**
 * Login or register via Google OAuth.
 */
export async function googleLogin(
    idToken: string
): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    console.log(`🔐 Verifying Google Token for Client ID: ${config.GOOGLE_CLIENT_ID}`);
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: config.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw new Error('Invalid Google token');
        }

        const { sub: googleId, email, name, picture } = payload;

        console.log(`✅ Google Token Verified for ${email} (${googleId})`);
        console.log(`   - Name: ${name}`);
        console.log(`   - Picture URL: ${picture ? 'Present' : 'Missing'}`);

        let user = await User.findOne({
            $or: [{ googleId }, { email }],
        });

        if (user) {
            let updates = false;
            if (!user.googleId) {
                user.googleId = googleId;
                updates = true;
            }
            if (picture && user.avatar !== picture) {
                user.avatar = picture;
                updates = true;
            }
            if (updates) {
                await user.save();
            }
        } else {
            user = await User.create({
                name: name || email!.split('@')[0],
                email,
                googleId,
                avatar: picture,
            });
        }

        // Trigger S3 User Backup
        uploadUserBackup(user).catch(err =>
            console.error(`⚠️ S3 User Backup Failed for ${user._id}:`, err)
        );

        const accessToken = generateAccessToken(String(user._id), user.role);
        const refreshToken = generateRefreshToken(String(user._id));

        // Persist refresh token to DB for revocation support
        await saveRefreshTokenToDB(String(user._id), refreshToken).catch(err =>
            console.error('⚠️ Failed to persist refresh token:', err)
        );

        return { user, accessToken, refreshToken };
    } catch (error: any) {
        console.error('❌ Google Verification Error:', error.message);
        if (error.message.includes('Wrong recipient')) {
            console.error(`   Expected Audience: ${config.GOOGLE_CLIENT_ID}`);
            const decoded = jwt.decode(idToken);
            console.error(`   Received Token Payload:`, JSON.stringify(decoded, null, 2));
        }
        throw new Error('Google authentication failed. ' + error.message);
    }
}

/**
 * Get user by ID (for /me endpoint)
 */
export async function getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
}
