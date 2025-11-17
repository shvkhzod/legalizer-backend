import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Railway provides DATABASE_URL, parse it if available
function parseDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port, 10),
      name: url.pathname.slice(1), // Remove leading slash
      user: url.username,
      password: url.password,
    };
  }

  // Fallback to individual env vars
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'charity_compliance',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  };
}

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || '0.0.0.0',
  },
  database: parseDatabaseUrl(),
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'change-me-in-production-access',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m', // 15 minutes
    refreshExpiryDays: parseInt(process.env.JWT_REFRESH_EXPIRY_DAYS || '7', 10), // 7 days
  },
};
