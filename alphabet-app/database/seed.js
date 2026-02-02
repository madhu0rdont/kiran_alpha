import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import { seedDb } from './seedDb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'alphabet.db');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const result = db.transaction(() => {
  return seedDb(db, {
    customWordsPath: path.join(__dirname, 'custom-words.json'),
    imagesDir: path.join(__dirname, '..', 'client', 'public', 'images', 'letters'),
  });
})();

if (result.skipped) {
  console.log('Letters already seeded, skipping.');
} else {
  if (result.restoredWords > 0) console.log(`Restored ${result.restoredWords} custom word(s).`);
  if (result.detectedImages > 0) console.log(`Detected ${result.detectedImages} existing image(s), set has_image flags.`);
  console.log(`Seeded ${result.letters} letters and ${result.progress} progress records.`);
}

db.close();
