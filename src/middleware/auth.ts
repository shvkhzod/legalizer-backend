import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../config/jwt.js';
import type { JWTPayload } from '../config/jwt.js';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authenticateToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const payload = verifyAccessToken(token);

  if (!payload) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }

  // Attach user to request
  request.user = payload;
}

/**
 * Optional authentication middleware
 * Verifies token if present but doesn't fail if missing
 */
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (payload) {
      request.user = payload;
    }
  }
}
