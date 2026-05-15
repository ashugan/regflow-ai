import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function initializeDatabase() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS requests (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      risk TEXT NOT NULL,
      ai_review TEXT,
      deleted_at TIMESTAMP
    );
  `);

  // Add deleted_at column if it doesn't exist (for existing tables)
  await db.query(`
    ALTER TABLE requests
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      request_id INTEGER,
      action TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      request_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Connected to PostgreSQL database");
}