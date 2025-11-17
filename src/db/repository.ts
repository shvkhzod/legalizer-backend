import { pool } from './connection.js';
import type { ComplianceReport, Report, ReportSummary, User, RefreshToken } from '../types/index.js';

/**
 * Repository for database operations (No ORM - pure SQL)
 */

// Auth & User operations
export async function createUser(
  email: string,
  passwordHash: string,
  fullName?: string
): Promise<User> {
  const client = await pool.connect();
  try {
    const result = await client.query<User>(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [email, passwordHash, fullName || null]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const client = await pool.connect();
  try {
    const result = await client.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } finally {
    client.release();
  }
}

export async function findUserById(userId: number): Promise<User | null> {
  const client = await pool.connect();
  try {
    const result = await client.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } finally {
    client.release();
  }
}

// Refresh token operations
export async function createRefreshToken(
  userId: number,
  token: string,
  expiresAt: Date
): Promise<RefreshToken> {
  const client = await pool.connect();
  try {
    const result = await client.query<RefreshToken>(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, token, expiresAt]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function findRefreshToken(token: string): Promise<RefreshToken | null> {
  const client = await pool.connect();
  try {
    const result = await client.query<RefreshToken>(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } finally {
    client.release();
  }
}

export async function deleteRefreshToken(token: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'DELETE FROM refresh_tokens WHERE token = $1',
      [token]
    );

    return result.rowCount !== null && result.rowCount > 0;
  } finally {
    client.release();
  }
}

export async function deleteUserRefreshTokens(userId: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      'DELETE FROM refresh_tokens WHERE user_id = $1',
      [userId]
    );
  } finally {
    client.release();
  }
}

// Report operations
export async function createReport(
  userId: number,
  report: ComplianceReport
): Promise<Report> {
  const client = await pool.connect();
  try {
    const result = await client.query<Report>(
      `INSERT INTO reports
        (user_id, scanned_url, scan_date, overall_status, overall_score, report_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        report.scannedUrl,
        report.scanDate,
        report.overallStatus,
        report.overallScore,
        JSON.stringify(report),
      ]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function getReportsByUser(
  userId: number,
  limit: number = 50,
  offset: number = 0
): Promise<{ reports: ReportSummary[]; total: number }> {
  const client = await pool.connect();
  try {
    // Get total count
    const countResult = await client.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM reports WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get reports
    const result = await client.query<Report>(
      `SELECT id, scanned_url, scan_date, overall_status, overall_score, created_at
       FROM reports
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const reports: ReportSummary[] = result.rows.map((row) => ({
      id: row.id,
      scannedUrl: row.scanned_url,
      scanDate: row.scan_date.toISOString(),
      overallStatus: row.overall_status,
      overallScore: row.overall_score,
      createdAt: row.created_at.toISOString(),
    }));

    return { reports, total };
  } finally {
    client.release();
  }
}

export async function getReportById(reportId: number): Promise<Report | null> {
  const client = await pool.connect();
  try {
    const result = await client.query<Report>(
      'SELECT * FROM reports WHERE id = $1',
      [reportId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } finally {
    client.release();
  }
}

export async function deleteReport(reportId: number, userId: number): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'DELETE FROM reports WHERE id = $1 AND user_id = $2',
      [reportId, userId]
    );

    return result.rowCount !== null && result.rowCount > 0;
  } finally {
    client.release();
  }
}

export async function getRecentReports(limit: number = 10): Promise<ReportSummary[]> {
  const client = await pool.connect();
  try {
    const result = await client.query<Report>(
      `SELECT id, scanned_url, scan_date, overall_status, overall_score, created_at
       FROM reports
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      scannedUrl: row.scanned_url,
      scanDate: row.scan_date.toISOString(),
      overallStatus: row.overall_status,
      overallScore: row.overall_score,
      createdAt: row.created_at.toISOString(),
    }));
  } finally {
    client.release();
  }
}
