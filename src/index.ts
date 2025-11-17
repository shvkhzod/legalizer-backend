import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config/env.js';
import { testConnection, closePool } from './db/connection.js';
import { authRoutes } from './routes/auth.js';
import { reportRoutes } from './routes/reports.js';

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register CORS - support multiple origins
await fastify.register(cors, {
  origin: (origin, cb) => {
    const allowedOrigins = config.cors.origin.split(',').map(o => o.trim());

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      cb(null, true);
      return;
    }

    // Check if origin is allowed
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
});

// Health check route
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register API routes
await fastify.register(authRoutes, { prefix: '/api' });
await fastify.register(reportRoutes, { prefix: '/api' });

// Graceful shutdown
const gracefulShutdown = async () => {
  fastify.log.info('Shutting down gracefully...');
  await fastify.close();
  await closePool();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const start = async () => {
  try {
    // Test database connection
    await testConnection();

    // Start listening
    await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });

    fastify.log.info(
      `Server running at http://${config.server.host}:${config.server.port}`
    );
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
