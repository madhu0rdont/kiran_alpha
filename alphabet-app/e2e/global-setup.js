import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { seedDb } from '../database/seedDb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(os.tmpdir(), 'alphabet-e2e.db');

export default function globalSetup() {
  // Clean up any leftover DB
  try { fs.unlinkSync(DB_PATH); } catch { /* ignore */ }
  try { fs.unlinkSync(DB_PATH + '-shm'); } catch { /* ignore */ }
  try { fs.unlinkSync(DB_PATH + '-wal'); } catch { /* ignore */ }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character TEXT NOT NULL,
      case_type TEXT NOT NULL CHECK (case_type IN ('upper', 'lower')),
      image_name TEXT NOT NULL,
      display_order INTEGER NOT NULL,
      has_image INTEGER NOT NULL DEFAULT 0,
      display_word TEXT DEFAULT NULL,
      UNIQUE(character, case_type)
    );
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      letter_id INTEGER NOT NULL REFERENCES letters(id),
      mode TEXT NOT NULL CHECK (mode IN ('upper', 'lower', 'both')),
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'learning', 'mastered')),
      ease_factor REAL NOT NULL DEFAULT 2.5,
      interval_days INTEGER NOT NULL DEFAULT 1,
      repetitions INTEGER NOT NULL DEFAULT 0,
      next_review_date TEXT,
      last_reviewed TEXT,
      times_failed INTEGER NOT NULL DEFAULT 0,
      recent_fails INTEGER NOT NULL DEFAULT 0,
      introduced_date TEXT,
      UNIQUE(letter_id, mode)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mode TEXT NOT NULL CHECK (mode IN ('upper', 'lower', 'both')),
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      total_cards INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      new_letters_introduced TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_progress_next_review ON progress(next_review_date);
    CREATE INDEX IF NOT EXISTS idx_progress_status ON progress(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);
  `);

  const imagesDir = path.join(__dirname, '..', 'client', 'public', 'images', 'letters');
  seedDb(db, {
    customWordsPath: path.join(__dirname, '..', 'database', 'custom-words.json'),
    imagesDir,
  });

  db.close();
}
