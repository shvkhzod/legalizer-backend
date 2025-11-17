// Simple migration script for Railway
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  // Use DATABASE_URL from Railway or construct from env vars
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'src', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Running database migrations...');
    await client.query(schema);
    console.log('✓ Database schema created successfully!');

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
