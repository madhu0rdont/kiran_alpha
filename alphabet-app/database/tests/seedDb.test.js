import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { seedDb } from '../seedDb.js';

let db;
let tmpDir;
let imagesDir;
let customWordsPath;

function createDb() {
  const dbPath = path.join(tmpDir, 'test.db');
  const d = new Database(dbPath);
  d.pragma('foreign_keys = ON');
  d.exec(`
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
      status TEXT NOT NULL DEFAULT 'new',
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
      mode TEXT NOT NULL,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      total_cards INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      new_letters_introduced TEXT NOT NULL DEFAULT ''
    );
  `);
  return d;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-test-'));
  imagesDir = path.join(tmpDir, 'images');
  fs.mkdirSync(imagesDir);
  customWordsPath = path.join(tmpDir, 'custom-words.json');
  db = createDb();
});

afterEach(() => {
  db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('seedDb', () => {
  it('seeds 52 letters and 104 progress records', () => {
    const result = seedDb(db, { customWordsPath, imagesDir });
    expect(result.skipped).toBe(false);
    expect(result.letters).toBe(52);
    expect(result.progress).toBe(104);

    const letterCount = db.prepare('SELECT COUNT(*) as c FROM letters').get().c;
    expect(letterCount).toBe(52);

    const progressCount = db.prepare('SELECT COUNT(*) as c FROM progress').get().c;
    expect(progressCount).toBe(104);
  });

  it('creates 26 uppercase and 26 lowercase letters', () => {
    seedDb(db, { customWordsPath, imagesDir });
    const upper = db.prepare("SELECT COUNT(*) as c FROM letters WHERE case_type = 'upper'").get().c;
    const lower = db.prepare("SELECT COUNT(*) as c FROM letters WHERE case_type = 'lower'").get().c;
    expect(upper).toBe(26);
    expect(lower).toBe(26);
  });

  it('assigns correct image names', () => {
    seedDb(db, { customWordsPath, imagesDir });
    const a = db.prepare("SELECT image_name FROM letters WHERE character = 'A'").get();
    expect(a.image_name).toBe('anna');
    const z = db.prepare("SELECT image_name FROM letters WHERE character = 'Z'").get();
    expect(z.image_name).toBe('zuma');
  });

  it('skips if letters already exist', () => {
    seedDb(db, { customWordsPath, imagesDir });
    const result = seedDb(db, { customWordsPath, imagesDir });
    expect(result.skipped).toBe(true);
  });

  it('restores custom words from JSON file', () => {
    fs.writeFileSync(customWordsPath, JSON.stringify({ T: 'Tent', A: 'Apple' }));

    const result = seedDb(db, { customWordsPath, imagesDir });
    expect(result.restoredWords).toBe(2);

    const tUpper = db.prepare("SELECT display_word FROM letters WHERE character = 'T'").get();
    const tLower = db.prepare("SELECT display_word FROM letters WHERE character = 't'").get();
    expect(tUpper.display_word).toBe('Tent');
    expect(tLower.display_word).toBe('Tent');

    const aUpper = db.prepare("SELECT display_word FROM letters WHERE character = 'A'").get();
    expect(aUpper.display_word).toBe('Apple');
  });

  it('does not crash when custom-words.json is missing', () => {
    const result = seedDb(db, { customWordsPath, imagesDir });
    expect(result.restoredWords).toBe(0);
  });

  it('detects existing image files and sets has_image', () => {
    // Create fake image files
    fs.writeFileSync(path.join(imagesDir, 'A.png'), 'fake');
    fs.writeFileSync(path.join(imagesDir, 'M.png'), 'fake');

    const result = seedDb(db, { customWordsPath, imagesDir });
    expect(result.detectedImages).toBe(2);

    const aUpper = db.prepare("SELECT has_image FROM letters WHERE character = 'A'").get();
    const aLower = db.prepare("SELECT has_image FROM letters WHERE character = 'a'").get();
    expect(aUpper.has_image).toBe(1);
    expect(aLower.has_image).toBe(1);

    const mUpper = db.prepare("SELECT has_image FROM letters WHERE character = 'M'").get();
    expect(mUpper.has_image).toBe(1);

    // B should not have image
    const b = db.prepare("SELECT has_image FROM letters WHERE character = 'B'").get();
    expect(b.has_image).toBe(0);
  });

  it('does not set has_image when images dir is missing', () => {
    fs.rmSync(imagesDir, { recursive: true });

    const result = seedDb(db, { customWordsPath, imagesDir });
    expect(result.detectedImages).toBe(0);

    const all = db.prepare('SELECT SUM(has_image) as total FROM letters').get();
    expect(all.total).toBe(0);
  });

  it('creates progress rows for all three modes', () => {
    seedDb(db, { customWordsPath, imagesDir });
    const upper = db.prepare("SELECT COUNT(*) as c FROM progress WHERE mode = 'upper'").get().c;
    const lower = db.prepare("SELECT COUNT(*) as c FROM progress WHERE mode = 'lower'").get().c;
    const both = db.prepare("SELECT COUNT(*) as c FROM progress WHERE mode = 'both'").get().c;
    expect(upper).toBe(26);
    expect(lower).toBe(26);
    expect(both).toBe(52);
  });

  it('handles both custom words and images together', () => {
    fs.writeFileSync(customWordsPath, JSON.stringify({ A: 'Ant' }));
    fs.writeFileSync(path.join(imagesDir, 'A.png'), 'fake');

    const result = seedDb(db, { customWordsPath, imagesDir });
    expect(result.restoredWords).toBe(1);
    expect(result.detectedImages).toBe(1);

    const a = db.prepare("SELECT display_word, has_image FROM letters WHERE character = 'A'").get();
    expect(a.display_word).toBe('Ant');
    expect(a.has_image).toBe(1);
  });
});
