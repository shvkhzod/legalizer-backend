# Charity Compliance Checker - Backend API

TypeScript + Fastify + PostgreSQL backend for storing and retrieving compliance scan reports.

## Features

- **JWT Authentication** - Secure user registration and login
- **No ORM** - Pure SQL queries for simplicity and performance
- **RESTful API** - Clean endpoints for report management
- **Type-safe** - Full TypeScript implementation
- **Password Security** - Bcrypt hashing with validation
- **Refresh Tokens** - Long-lived sessions with token refresh

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure PostgreSQL

Create the database:

```bash
psql -U postgres
CREATE DATABASE charity_compliance;
\q
```

### 3. Run Database Schema

```bash
npm run db:schema
```

Or manually:

```bash
psql -U postgres -d charity_compliance -f src/db/schema.sql
```

### 4. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials and JWT secrets:

```env
PORT=3001
HOST=0.0.0.0

DB_HOST=localhost
DB_PORT=5432
DB_NAME=charity_compliance
DB_USER=postgres
DB_PASSWORD=your_password

CORS_ORIGIN=http://localhost:5173

JWT_ACCESS_SECRET=your-super-secret-access-key-change-me
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY_DAYS=7
```

**Important:** Generate secure random secrets for `JWT_ACCESS_SECRET` in production!

### 5. Start the Server

Development mode (with hot reload):

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Health Check

```
GET /health
```

Returns server status.

---

## Authentication Endpoints

### Register

```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fullName": "John Doe" // optional
}
```

**Response:**
```json
{
  "accessToken": "jwt-token...",
  "refreshToken": "refresh-token...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

**Password Requirements:**
- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Login

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** Same as register

### Refresh Token

```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token..."
}
```

**Response:**
```json
{
  "accessToken": "new-jwt-token..."
}
```

### Logout

```
POST /api/auth/logout
Content-Type: application/json

{
  "refreshToken": "refresh-token..."
}
```

### Logout All Devices

```
POST /api/auth/logout-all
Content-Type: application/json

{
  "userId": 1
}
```

---

## Report Endpoints

All report endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <accessToken>
```

### Create Report

```
POST /api/reports
Authorization: Bearer <token>
Content-Type: application/json

{
  "report": { /* ComplianceReport object */ }
}
```

### Get User Reports

```
GET /api/reports?limit=50&offset=0
Authorization: Bearer <token>
```

Returns paginated list of reports for the authenticated user.

### Get Report Details

```
GET /api/reports/:id
Authorization: Bearer <token>
```

Returns full report data (only if owned by user).

### Delete Report

```
DELETE /api/reports/:id
Authorization: Bearer <token>
```

Deletes a specific report (only if owned by user).

### Get Recent Reports

```
GET /api/reports/recent?limit=10
```

Returns recent reports (public endpoint, no auth required).

## Database Schema

### Users Table

- `id` - Auto-incrementing primary key
- `email` - Unique email address
- `password_hash` - Bcrypt hashed password
- `full_name` - User's full name (optional)
- `is_verified` - Email verification status
- `created_at` - Registration timestamp
- `updated_at` - Last update timestamp

### Refresh Tokens Table

- `id` - Auto-incrementing primary key
- `user_id` - Foreign key to users
- `token` - Unique refresh token
- `expires_at` - Token expiration date
- `created_at` - Creation timestamp

### Reports Table

- `id` - Auto-incrementing primary key
- `user_id` - Foreign key to users
- `scanned_url` - The URL that was scanned
- `scan_date` - When the scan was performed
- `overall_status` - Compliance status
- `overall_score` - Score (0-100)
- `report_data` - Full report JSON (JSONB)
- `created_at` - Timestamp

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── env.ts          # Environment configuration
│   │   └── jwt.ts          # JWT utilities
│   ├── db/
│   │   ├── connection.ts   # PostgreSQL connection pool
│   │   ├── repository.ts   # Data access layer (pure SQL)
│   │   ├── schema.sql      # Database schema
│   │   └── init.sql        # Database initialization
│   ├── middleware/
│   │   └── auth.ts         # Authentication middleware
│   ├── routes/
│   │   ├── auth.ts         # Authentication routes
│   │   └── reports.ts      # Report API routes
│   ├── types/
│   │   └── index.ts        # TypeScript types
│   ├── utils/
│   │   └── password.ts     # Password hashing & validation
│   └── index.ts            # Main server file
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Authentication Flow

1. **Registration:** User registers with email/password
2. **Login:** User logs in, receives access token (15min) and refresh token (7 days)
3. **Authenticated Requests:** Include `Authorization: Bearer <accessToken>` header
4. **Token Refresh:** When access token expires, use refresh token to get new access token
5. **Logout:** Delete refresh token to invalidate session

## Development Notes

- **No ORM** - All queries are raw SQL for simplicity
- **JWT Tokens** - Access tokens expire in 15 minutes, refresh tokens in 7 days
- **Password Security** - Bcrypt hashing with configurable rounds (default: 10)
- **PostgreSQL JSONB** - Full report data stored as JSONB for flexibility
- **Connection Pooling** - Configured with sensible defaults
- **Graceful Shutdown** - Proper cleanup on SIGTERM/SIGINT
- **CORS** - Configured for the frontend origin

## Security Best Practices

1. **Always use HTTPS in production**
2. **Generate strong JWT secrets** - Use `openssl rand -base64 32` or similar
3. **Set secure environment variables** - Never commit `.env` files
4. **Rotate refresh tokens** - Consider implementing token rotation
5. **Rate limiting** - Add rate limiting for authentication endpoints (not included)
6. **Email verification** - Implement email verification for production (schema ready)

## Troubleshooting

### Database Connection Failed

Check your PostgreSQL service is running:

```bash
# Windows
pg_ctl status

# Linux/Mac
systemctl status postgresql
```

Verify your `.env` credentials match your PostgreSQL setup.

### Port Already in Use

Change the `PORT` in `.env` to an available port.

### CORS Errors

Update `CORS_ORIGIN` in `.env` to match your frontend URL.
