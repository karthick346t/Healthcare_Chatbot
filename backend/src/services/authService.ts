import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { OAuth2Client } from 'google-auth-library';
import config from '../config';
import { uploadUserBackup } from './awsService';

const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

/**
 * Generate JWT token for a user
 */
export function generateToken(userId: string): string {
    return jwt.sign({ userId }, config.JWT_SECRET, {
        expiresIn: '7d',
    });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): { userId: string } {
    return jwt.verify(token, config.JWT_SECRET) as { userId: string };
}

/**
 * Register a new user with email and password
 */
export async function registerUser(
    name: string,
    email: string,
    password: string
): Promise<{ user: unknown; token: string }> {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error('An account with this email already exists');
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(String(user._id));

    // Trigger S3 User Backup (Non-blocking)
    uploadUserBackup(user).catch(err =>
        console.error(`⚠️ S3 User Backup Failed for ${user._id}:`, err)
    );

    const userObj = JSON.parse(JSON.stringify(user));
    delete userObj.password;

    return { user: userObj, token };
}

/**
 * Login with email and password
 */
export async function loginUser(
    email: string,
    password: string
): Promise<{ user: unknown; token: string }> {
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

    const token = generateToken(String(user._id));

    // Trigger S3 User Backup (Non-blocking) - Keep backup fresh on login
    uploadUserBackup(user).catch(err =>
        console.error(`⚠️ S3 User Backup Failed for ${user._id}:`, err)
    );

    const userObj = JSON.parse(JSON.stringify(user));
    delete userObj.password;

    return { user: userObj, token };
}

/**
 * Login or register via Google OAuth
 */
export async function googleLogin(
    idToken: string
): Promise<{ user: IUser; token: string }> {
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
        console.log(`   - Picture URL: ${picture ? 'Present' : 'Missing'}`); // Don't log full URL to keep logs clean, just presence

        let user = await User.findOne({
            $or: [{ googleId }, { email }],
        });

        if (user) {
            let updates = false;
            if (!user.googleId) {
                user.googleId = googleId;
                updates = true;
            }
            // Always update avatar if provided by Google to keep it fresh
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

        const token = generateToken(String(user._id));
        return { user, token };
    } catch (error: any) {
        console.error("❌ Google Verification Error:", error.message);
        if (error.message.includes("Wrong recipient")) {
            console.error(`   Expected Audience: ${config.GOOGLE_CLIENT_ID}`);
            // Try to decode without verification to see what's in it (debugging only)
            const decoded = jwt.decode(idToken);
            console.error(`   Received Token Payload:`, JSON.stringify(decoded, null, 2));
        }
        throw new Error("Google authentication failed. " + error.message);
    }
}

/**
 * Get user by ID (for /me endpoint)
 */
export async function getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
}
