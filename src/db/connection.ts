import pg from 'pg';
import { config } from '../config/env.js';

const { Pool } = pg;

// Create PostgreSQL connection pool
export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

// Test database connection
export async function testConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    console.log('✓ Database connected successfully');
    client.release();
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    throw error;
  }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('Database pool closed');
}
