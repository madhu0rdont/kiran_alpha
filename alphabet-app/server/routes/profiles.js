import { Router } from 'express';
import db from '../db.js';
import { seedProgressForChild } from '../../database/seedDb.js';

const router = Router();

// GET /api/profiles
router.get('/', (req, res) => {
  const profiles = db.prepare('SELECT * FROM profiles ORDER BY id').all();
  res.json(profiles);
});

// POST /api/profiles { name, avatar }
router.post('/', (req, res) => {
  const { name, avatar } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  const info = db.prepare('INSERT INTO profiles (name, avatar) VALUES (?, ?)').run(
    name.trim(),
    avatar || '🧒'
  );
  const childId = info.lastInsertRowid;

  // Seed progress rows for the new child
  seedProgressForChild(db, childId);

  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(childId);
  res.status(201).json(profile);
});

// PUT /api/profiles/:id { name, avatar }
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, avatar } = req.body;

  const existing = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  db.prepare('UPDATE profiles SET name = ?, avatar = ? WHERE id = ?').run(
    name?.trim() || existing.name,
    avatar || existing.avatar,
    id
  );

  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);
  res.json(profile);
});

// DELETE /api/profiles/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  const count = db.prepare('SELECT COUNT(*) as c FROM profiles').get().c;
  if (count <= 1) {
    return res.status(400).json({ error: 'Cannot delete the last profile' });
  }

  const existing = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // ON DELETE CASCADE handles progress and sessions
  db.prepare('DELETE FROM profiles WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;
