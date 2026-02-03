import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';
import sessionRouter from './routes/session.js';
import adminRouter from './routes/admin.js';
import profileRouter from './routes/profiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  const letters = db.prepare('SELECT COUNT(*) as c FROM letters').get().c;
  const progress = db.prepare('SELECT COUNT(*) as c FROM progress').get().c;
  res.json({ status: 'ok', letters, progress });
});

app.get('/api/letters', (req, res) => {
  const { case_type } = req.query;
  let rows;
  if (case_type) {
    rows = db.prepare('SELECT * FROM letters WHERE case_type = ? ORDER BY display_order').all(case_type);
  } else {
    rows = db.prepare('SELECT * FROM letters ORDER BY case_type, display_order').all();
  }
  res.json(rows);
});

app.use('/api/session', sessionRouter);
app.use('/api/progress', sessionRouter);
app.use('/api/admin', adminRouter);
app.use('/api/profiles', profileRouter);

// Serve static files from client build (production)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// Serve uploaded images
app.use('/images', express.static(path.join(__dirname, '..', 'client', 'public', 'images')));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
