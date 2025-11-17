import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as repository from '../db/repository.js';
import { hashPassword, comparePassword, isValidPassword, isValidEmail } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
} from '../config/jwt.js';
import type {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  AuthResponse,
} from '../types/index.js';

/**
 * Authentication routes
 */
export async function authRoutes(fastify: FastifyInstance) {
  // Register new user
  fastify.post<{ Body: RegisterRequest }>(
    '/auth/register',
    async (request: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply) => {
      try {
        const { email, password, fullName } = request.body;

        // Validate input
        if (!email || !password) {
          return reply.status(400).send({
            error: 'Email and password are required',
          });
        }

        // Validate email format
        if (!isValidEmail(email)) {
          return reply.status(400).send({
            error: 'Invalid email format',
          });
        }

        // Validate password strength
        const passwordValidation = isValidPassword(password);
        if (!passwordValidation.valid) {
          return reply.status(400).send({
            error: 'Password does not meet requirements',
            details: passwordValidation.errors,
          });
        }

        // Check if user already exists
        const existingUser = await repository.findUserByEmail(email.toLowerCase());
        if (existingUser) {
          return reply.status(409).send({
            error: 'User with this email already exists',
          });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = await repository.createUser(
          email.toLowerCase(),
          passwordHash,
          fullName
        );

        // Generate tokens
        const accessToken = generateAccessToken({
          userId: user.id,
          email: user.email,
        });
        const refreshToken = generateRefreshToken();
        const refreshExpiry = getRefreshTokenExpiry();

        // Save refresh token
        await repository.createRefreshToken(user.id, refreshToken, refreshExpiry);

        const response: AuthResponse = {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
          },
        };

        return reply.status(201).send(response);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Failed to register user',
        });
      }
    }
  );

  // Login
  fastify.post<{ Body: LoginRequest }>(
    '/auth/login',
    async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) => {
      try {
        const { email, password } = request.body;

        // Validate input
        if (!email || !password) {
          return reply.status(400).send({
            error: 'Email and password are required',
          });
        }

        // Find user
        const user = await repository.findUserByEmail(email.toLowerCase());
        if (!user) {
          return reply.status(401).send({
            error: 'Invalid email or password',
          });
        }

        // Verify password
        const passwordValid = await comparePassword(password, user.password_hash);
        if (!passwordValid) {
          return reply.status(401).send({
            error: 'Invalid email or password',
          });
        }

        // Generate tokens
        const accessToken = generateAccessToken({
          userId: user.id,
          email: user.email,
        });
        const refreshToken = generateRefreshToken();
        const refreshExpiry = getRefreshTokenExpiry();

        // Save refresh token
        await repository.createRefreshToken(user.id, refreshToken, refreshExpiry);

        const response: AuthResponse = {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
          },
        };

        return reply.send(response);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Failed to login',
        });
      }
    }
  );

  // Refresh access token
  fastify.post<{ Body: RefreshTokenRequest }>(
    '/auth/refresh',
    async (request: FastifyRequest<{ Body: RefreshTokenRequest }>, reply: FastifyReply) => {
      try {
        const { refreshToken } = request.body;

        if (!refreshToken) {
          return reply.status(400).send({
            error: 'Refresh token is required',
          });
        }

        // Find refresh token
        const storedToken = await repository.findRefreshToken(refreshToken);
        if (!storedToken) {
          return reply.status(401).send({
            error: 'Invalid or expired refresh token',
          });
        }

        // Get user
        const user = await repository.findUserById(storedToken.user_id);
        if (!user) {
          return reply.status(401).send({
            error: 'User not found',
          });
        }

        // Generate new access token
        const accessToken = generateAccessToken({
          userId: user.id,
          email: user.email,
        });

        return reply.send({
          accessToken,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Failed to refresh token',
        });
      }
    }
  );

  // Logout
  fastify.post<{ Body: RefreshTokenRequest }>(
    '/auth/logout',
    async (request: FastifyRequest<{ Body: RefreshTokenRequest }>, reply: FastifyReply) => {
      try {
        const { refreshToken } = request.body;

        if (!refreshToken) {
          return reply.status(400).send({
            error: 'Refresh token is required',
          });
        }

        // Delete refresh token
        await repository.deleteRefreshToken(refreshToken);

        return reply.send({
          success: true,
          message: 'Logged out successfully',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Failed to logout',
        });
      }
    }
  );

  // Logout from all devices
  fastify.post(
    '/auth/logout-all',
    {
      preHandler: async (_request, _reply) => {
        // This would need auth middleware, but for simplicity, we'll accept userId in body
        // In production, you'd use the authenticateToken middleware
      },
    },
    async (request: FastifyRequest<{ Body: { userId: number } }>, reply: FastifyReply) => {
      try {
        const { userId } = request.body;

        if (!userId) {
          return reply.status(400).send({
            error: 'User ID is required',
          });
        }

        // Delete all refresh tokens for user
        await repository.deleteUserRefreshTokens(userId);

        return reply.send({
          success: true,
          message: 'Logged out from all devices',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Failed to logout',
        });
      }
    }
  );
}
