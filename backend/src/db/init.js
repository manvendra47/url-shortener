import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Uses Node's built-in SQLite driver (stable since Node 22.5+) instead of the
// better-sqlite3 native package, so there's nothing to compile on install —
// no Visual Studio / build tools required on any platform.
const dbPath = process.env.DB_PATH || './data/app.db';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    short_code TEXT UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    title TEXT,
    click_count INTEGER NOT NULL DEFAULT 0,
    max_clicks INTEGER,
    expires_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    link_password_hash TEXT,
    require_preview INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    clicked_at TEXT NOT NULL DEFAULT (datetime('now')),
    referrer TEXT,
    user_agent TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
  CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
  CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
`);

// Lightweight migration for databases created before password-protection /
// link-preview support was added. SQLite has no "ADD COLUMN IF NOT EXISTS",
// so we probe the schema and only add what's missing.
const existingColumns = db.prepare('PRAGMA table_info(links)').all().map((c) => c.name);
if (!existingColumns.includes('link_password_hash')) {
  db.exec('ALTER TABLE links ADD COLUMN link_password_hash TEXT');
}
if (!existingColumns.includes('require_preview')) {
  db.exec('ALTER TABLE links ADD COLUMN require_preview INTEGER NOT NULL DEFAULT 0');
}

console.log('Database initialized at', dbPath);
