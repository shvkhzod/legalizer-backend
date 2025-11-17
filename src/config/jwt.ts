import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from './env.js';
import crypto from 'crypto';

export interface JWTPayload {
  userId: number;
  email: string;
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: JWTPayload): string {
  const secret: string = config.jwt.accessSecret;
  const options: SignOptions = {
    expiresIn: config.jwt.accessExpiry as any,
  };
  return jwt.sign(payload, secret, options);
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret) as JWTPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Get refresh token expiry date
 */
export function getRefreshTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + config.jwt.refreshExpiryDays);
  return expiry;
}
