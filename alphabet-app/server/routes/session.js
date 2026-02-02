import { Router } from 'express';
import { getSessionCards, gradeCard, completeSession, getProgress } from '../services/sessionService.js';

const router = Router();

// GET /api/session/start?mode=upper|lower|both&count=10
router.get('/start', (req, res) => {
  const mode = req.query.mode || 'upper';
  const count = parseInt(req.query.count, 10) || 10;

  if (!['upper', 'lower', 'both'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be upper, lower, or both' });
  }

  const result = getSessionCards(mode, count);
  res.json(result);
});

// POST /api/session/grade { letter_id, mode, correct }
router.post('/grade', (req, res) => {
  const { letter_id, mode, correct } = req.body;

  if (!letter_id || !mode || correct === undefined) {
    return res.status(400).json({ error: 'letter_id, mode, and correct are required' });
  }
  if (!['upper', 'lower', 'both'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be upper, lower, or both' });
  }

  const result = gradeCard(letter_id, mode, !!correct);
  res.json(result);
});

// POST /api/session/complete { session_id, total_cards, correct_count }
router.post('/complete', (req, res) => {
  const { session_id, total_cards, correct_count } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' });
  }

  const session = completeSession(session_id, total_cards || 0, correct_count || 0);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(session);
});

// GET /api/progress?mode=upper|lower|both
router.get('/', (req, res) => {
  const mode = req.query.mode || 'upper';

  if (!['upper', 'lower', 'both'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be upper, lower, or both' });
  }

  const result = getProgress(mode);
  res.json(result);
});

export default router;
