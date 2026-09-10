import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required. Set it in backend/.env');
}

export const pool = new Pool({ connectionString });

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS links (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      short_code TEXT UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      title TEXT,
      click_count INTEGER NOT NULL DEFAULT 0,
      max_clicks INTEGER,
      expires_at TIMESTAMPTZ,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      link_password_hash TEXT,
      require_preview BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS clicks (
      id SERIAL PRIMARY KEY,
      link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
      clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      referrer TEXT,
      user_agent TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
    CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
    CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
  `);

  await pool.query(`
    ALTER TABLE links
      ADD COLUMN IF NOT EXISTS link_password_hash TEXT,
      ADD COLUMN IF NOT EXISTS require_preview BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  console.log('Database initialized successfully');
}
