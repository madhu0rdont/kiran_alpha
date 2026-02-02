import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', '..', 'client', 'public', 'images', 'letters');
const CUSTOM_WORDS_PATH = path.join(__dirname, '..', '..', 'database', 'custom-words.json');

function saveCustomWords() {
  const rows = db.prepare("SELECT character, display_word FROM letters WHERE case_type = 'upper' AND display_word IS NOT NULL").all();
  const words = {};
  for (const r of rows) words[r.character] = r.display_word;
  fs.writeFileSync(CUSTOM_WORDS_PATH, JSON.stringify(words, null, 2));
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

// GET /api/admin/letters — all unique letters (upper only, since images are shared)
router.get('/letters', (req, res) => {
  const rows = db.prepare(`
    SELECT id, character, case_type, image_name, display_order, has_image, display_word
    FROM letters
    WHERE case_type = 'upper'
    ORDER BY display_order
  `).all();
  res.json(rows);
});

// POST /api/admin/upload/:letter — upload and resize image
router.post('/upload/:letter', upload.single('image'), async (req, res) => {
  const letter = req.params.letter.toUpperCase();
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const filename = `${letter}.png`;
    const outPath = path.join(IMAGES_DIR, filename);

    await sharp(req.file.buffer)
      .resize(400, 400, { fit: 'cover' })
      .png()
      .toFile(outPath);

    // Update both upper and lower case rows
    db.prepare('UPDATE letters SET has_image = 1 WHERE UPPER(character) = ?').run(letter);

    res.json({ success: true, letter, path: `/images/letters/${filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/word/:letter — update display word
router.put('/word/:letter', (req, res) => {
  const letter = req.params.letter.toUpperCase();
  const { word } = req.body;
  const value = word && word.trim() ? word.trim() : null;

  try {
    db.prepare('UPDATE letters SET display_word = ? WHERE UPPER(character) = ?').run(value, letter);
    saveCustomWords();
    res.json({ success: true, letter, display_word: value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/image/:letter — remove image
router.delete('/image/:letter', (req, res) => {
  const letter = req.params.letter.toUpperCase();
  const filePath = path.join(IMAGES_DIR, `${letter}.png`);

  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    db.prepare('UPDATE letters SET has_image = 0 WHERE UPPER(character) = ?').run(letter);
    res.json({ success: true, letter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
