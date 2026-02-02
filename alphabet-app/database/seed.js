import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'alphabet.db');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const IMAGE_NAMES = [
  'anna', 'bam', 'chase', 'daniel', 'elmo',
  'fuli', 'goofy', 'house', 'icecream', 'jj',
  'kion', 'lightning', 'marshall', 'nemo', 'olaf',
  'peppa', 'elsa', 'rubble', 'skye', 'thomas',
  'umbrella', 'violin', 'watermelon', 'xylophone', 'yoyo', 'zuma',
];

const seedLetters = db.transaction(() => {
  const existing = db.prepare('SELECT COUNT(*) as c FROM letters').get();
  if (existing.c > 0) {
    console.log('Letters already seeded, skipping.');
    return;
  }

  const insertLetter = db.prepare(
    'INSERT INTO letters (character, case_type, image_name, display_order) VALUES (?, ?, ?, ?)'
  );
  const insertProgress = db.prepare(
    'INSERT INTO progress (letter_id, mode) VALUES (?, ?)'
  );

  for (let i = 0; i < 26; i++) {
    const upper = String.fromCharCode(65 + i);
    const lower = String.fromCharCode(97 + i);
    const image = IMAGE_NAMES[i];
    const order = i + 1;

    const upperInfo = insertLetter.run(upper, 'upper', image, order);
    const lowerInfo = insertLetter.run(lower, 'lower', image, order);

    // Create progress rows for each mode
    insertProgress.run(upperInfo.lastInsertRowid, 'upper');
    insertProgress.run(lowerInfo.lastInsertRowid, 'lower');
    insertProgress.run(upperInfo.lastInsertRowid, 'both');
    insertProgress.run(lowerInfo.lastInsertRowid, 'both');
  }

  // Restore custom display words from sidecar file
  const wordsPath = path.join(__dirname, 'custom-words.json');
  if (fs.existsSync(wordsPath)) {
    const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
    const entries = Object.entries(words);
    for (const [letter, word] of entries) {
      db.prepare('UPDATE letters SET display_word = ? WHERE UPPER(character) = ?').run(word, letter);
    }
    if (entries.length > 0) console.log(`Restored ${entries.length} custom word(s).`);
  }

  // Detect existing uploaded images and set has_image flag
  const imagesDir = path.join(__dirname, '..', 'client', 'public', 'images', 'letters');
  if (fs.existsSync(imagesDir)) {
    let count = 0;
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      if (fs.existsSync(path.join(imagesDir, `${letter}.png`))) {
        db.prepare('UPDATE letters SET has_image = 1 WHERE UPPER(character) = ?').run(letter);
        count++;
      }
    }
    if (count > 0) console.log(`Detected ${count} existing image(s), set has_image flags.`);
  }

  console.log('Seeded 52 letters and 104 progress records.');
});

seedLetters();
db.close();
