import express from 'express';
import cors from 'cors';
import db from './db.js';
import sessionRouter from './routes/session.js';

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

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
