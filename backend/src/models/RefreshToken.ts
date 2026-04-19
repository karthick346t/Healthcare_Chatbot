import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// TTL index — MongoDB automatically deletes expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Hash a refresh token for secure storage.
 * We never store the raw token — only a SHA-256 hash.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Store a new refresh token in the database.
 */
export async function saveRefreshTokenToDB(
  userId: string,
  token: string,
  expiresInDays = 7
): Promise<void> {
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  // Remove any existing tokens for this user to prevent accumulation
  // (optional: allow multiple devices by dropping this line)
  await RefreshToken.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
  await RefreshToken.create({ userId: new mongoose.Types.ObjectId(userId), tokenHash, expiresAt });
}

/**
 * Revoke a specific refresh token by deleting it from the database.
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await RefreshToken.deleteOne({ tokenHash });
}

/**
 * Verify a refresh token exists in the database (not revoked).
 * Returns the stored record or null.
 */
export async function findRefreshTokenInDB(
  token: string,
  userId: string
): Promise<IRefreshToken | null> {
  const tokenHash = hashToken(token);
  return RefreshToken.findOne({
    tokenHash,
    userId: new mongoose.Types.ObjectId(userId),
  });
}

const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
export default RefreshToken;
