import fs from 'fs';
import path from 'path';

const IMAGE_NAMES = [
  'anna', 'bam', 'chase', 'daniel', 'elmo',
  'fuli', 'goofy', 'house', 'icecream', 'jj',
  'kion', 'lightning', 'marshall', 'nemo', 'olaf',
  'peppa', 'elsa', 'rubble', 'skye', 'thomas',
  'umbrella', 'violin', 'watermelon', 'xylophone', 'yoyo', 'zuma',
];

/**
 * Seed a database with letters and progress.
 * @param {object} db - better-sqlite3 database instance
 * @param {object} opts
 * @param {string} opts.customWordsPath - path to custom-words.json
 * @param {string} opts.imagesDir - path to uploaded images directory
 */
export function seedDb(db, { customWordsPath, imagesDir }) {
  const existing = db.prepare('SELECT COUNT(*) as c FROM letters').get();
  if (existing.c > 0) {
    return { skipped: true };
  }

  // Ensure a default profile exists
  const profileCount = db.prepare('SELECT COUNT(*) as c FROM profiles').get().c;
  if (profileCount === 0) {
    db.prepare("INSERT INTO profiles (name, avatar) VALUES ('Kiran', '🧒')").run();
  }
  const defaultProfile = db.prepare('SELECT id FROM profiles ORDER BY id LIMIT 1').get();
  const childId = defaultProfile.id;

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

    insertProgress.run(childId, upperInfo.lastInsertRowid, 'upper');
    insertProgress.run(childId, lowerInfo.lastInsertRowid, 'lower');
    insertProgress.run(childId, upperInfo.lastInsertRowid, 'both');
    insertProgress.run(childId, lowerInfo.lastInsertRowid, 'both');
  }

  // Restore custom display words from sidecar file
  let restoredWords = 0;
  if (fs.existsSync(customWordsPath)) {
    const words = JSON.parse(fs.readFileSync(customWordsPath, 'utf8'));
    const entries = Object.entries(words);
    for (const [letter, word] of entries) {
      db.prepare('UPDATE letters SET display_word = ? WHERE UPPER(character) = ?').run(word, letter);
    }
    restoredWords = entries.length;
  }

  // Detect existing uploaded images and set has_image flag
  let detectedImages = 0;
  if (fs.existsSync(imagesDir)) {
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      if (fs.existsSync(path.join(imagesDir, `${letter}.png`))) {
        db.prepare('UPDATE letters SET has_image = 1 WHERE UPPER(character) = ?').run(letter);
        detectedImages++;
      }
    }
  }

  return { skipped: false, letters: 52, progress: 104, restoredWords, detectedImages };
}

/**
 * Create progress rows for a new child profile.
 * @param {object} db - better-sqlite3 database instance
 * @param {number} childId - the profile id
 */
export function seedProgressForChild(db, childId) {
  const letters = db.prepare('SELECT id FROM letters').all();
  const insert = db.prepare('INSERT INTO progress (child_id, letter_id, mode) VALUES (?, ?, ?)');

  for (const letter of letters) {
    const caseType = db.prepare('SELECT case_type FROM letters WHERE id = ?').get(letter.id).case_type;
    if (caseType === 'upper') {
      insert.run(childId, letter.id, 'upper');
      insert.run(childId, letter.id, 'both');
    } else {
      insert.run(childId, letter.id, 'lower');
      insert.run(childId, letter.id, 'both');
    }
  }
}
