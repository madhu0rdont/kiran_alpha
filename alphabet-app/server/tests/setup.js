import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const IMAGE_NAMES = [
  'anna', 'bam', 'chase', 'daniel', 'elmo',
  'fuli', 'goofy', 'house', 'icecream', 'jj',
  'kion', 'lightning', 'marshall', 'nemo', 'olaf',
  'peppa', 'elsa', 'rubble', 'skye', 'thomas',
  'umbrella', 'violin', 'watermelon', 'xylophone', 'yoyo', 'zuma',
];

/**
 * Create a fresh test database and return its path.
 * Must be called BEFORE importing any module that uses db.js.
 */
export function createTestDb() {
  const dbPath = path.join(os.tmpdir(), `alphabet-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT DEFAULT '🧒',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character TEXT NOT NULL,
      case_type TEXT NOT NULL CHECK (case_type IN ('upper', 'lower')),
      image_name TEXT NOT NULL,
      display_order INTEGER NOT NULL,
      has_image INTEGER NOT NULL DEFAULT 0,
      display_word TEXT DEFAULT NULL,
      UNIQUE(character, case_type)
    );

    CREATE TABLE progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL DEFAULT 1 REFERENCES profiles(id) ON DELETE CASCADE,
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
      UNIQUE(child_id, letter_id, mode)
    );

    CREATE TABLE sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL DEFAULT 1 REFERENCES profiles(id) ON DELETE CASCADE,
      mode TEXT NOT NULL CHECK (mode IN ('upper', 'lower', 'both')),
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      total_cards INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      new_letters_introduced TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX idx_progress_next_review ON progress(next_review_date);
    CREATE INDEX idx_progress_status ON progress(status);
    CREATE INDEX idx_progress_child ON progress(child_id);
    CREATE INDEX idx_sessions_started ON sessions(started_at);
    CREATE INDEX idx_sessions_child ON sessions(child_id);
  `);

  // Create default profile
  db.prepare("INSERT INTO profiles (name, avatar) VALUES ('Test', '🧒')").run();

  // Seed letters and progress
  const insertLetter = db.prepare(
    'INSERT INTO letters (character, case_type, image_name, display_order) VALUES (?, ?, ?, ?)'
  );
  const insertProgress = db.prepare(
    'INSERT INTO progress (child_id, letter_id, mode) VALUES (?, ?, ?)'
  );

  for (let i = 0; i < 26; i++) {
    const upper = String.fromCharCode(65 + i);
    const lower = String.fromCharCode(97 + i);
    const image = IMAGE_NAMES[i];
    const order = i + 1;

    const upperInfo = insertLetter.run(upper, 'upper', image, order);
    const lowerInfo = insertLetter.run(lower, 'lower', image, order);

    insertProgress.run(1, upperInfo.lastInsertRowid, 'upper');
    insertProgress.run(1, lowerInfo.lastInsertRowid, 'lower');
    insertProgress.run(1, upperInfo.lastInsertRowid, 'both');
    insertProgress.run(1, lowerInfo.lastInsertRowid, 'both');
  }

  db.close();
  return dbPath;
}

export function removeTestDb(dbPath) {
  try {
    fs.unlinkSync(dbPath);
    fs.unlinkSync(dbPath + '-shm');
    fs.unlinkSync(dbPath + '-wal');
  } catch {
    // ignore
  }
}
