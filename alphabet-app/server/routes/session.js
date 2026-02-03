import { Router } from 'express';
import { getSessionCards, gradeCard, completeSession, getProgress, getProgressLetters, resetProgress, deleteSession } from '../services/sessionService.js';

const router = Router();

// GET /api/session/start?mode=upper|lower|both&child_id=1&count=10
router.get('/start', (req, res) => {
  const mode = req.query.mode || 'upper';
  const childId = parseInt(req.query.child_id, 10);
  const count = parseInt(req.query.count, 10) || 10;

  if (!['upper', 'lower', 'both'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be upper, lower, or both' });
  }
  if (!childId) {
    return res.status(400).json({ error: 'child_id is required' });
  }

  const result = getSessionCards(mode, childId, count);
  res.json(result);
});

// POST /api/session/grade { letter_id, mode, child_id, correct }
router.post('/grade', (req, res) => {
  const { letter_id, mode, child_id, correct } = req.body;

  if (!letter_id || !mode || correct === undefined || !child_id) {
    return res.status(400).json({ error: 'letter_id, mode, child_id, and correct are required' });
  }
  if (!['upper', 'lower', 'both'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be upper, lower, or both' });
  }

  const result = gradeCard(letter_id, mode, child_id, !!correct);
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

// GET /api/progress?mode=upper|lower|both&child_id=1
router.get('/', (req, res) => {
  const mode = req.query.mode || 'upper';
  const childId = parseInt(req.query.child_id, 10);

  if (!['upper', 'lower', 'both'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be upper, lower, or both' });
  }
  if (!childId) {
    return res.status(400).json({ error: 'child_id is required' });
  }

  const result = getProgress(mode, childId);
  res.json(result);
});

// GET /api/progress/letters?mode=upper|lower|both&child_id=1
router.get('/letters', (req, res) => {
  const mode = req.query.mode || 'upper';
  const childId = parseInt(req.query.child_id, 10);

  if (!['upper', 'lower', 'both'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be upper, lower, or both' });
  }
  if (!childId) {
    return res.status(400).json({ error: 'child_id is required' });
  }

  const rows = getProgressLetters(mode, childId);
  res.json(rows);
});

// POST /api/progress/reset { mode, child_id }
router.post('/reset', (req, res) => {
  const { mode, child_id } = req.body;

  if (!mode || !child_id) {
    return res.status(400).json({ error: 'mode and child_id are required' });
  }
  if (!['upper', 'lower', 'both'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be upper, lower, or both' });
  }

  resetProgress(mode, child_id);
  res.json({ success: true });
});

// DELETE /api/session/:id?child_id=1
router.delete('/:id', (req, res) => {
  const sessionId = parseInt(req.params.id, 10);
  const childId = parseInt(req.query.child_id, 10);

  if (!sessionId || !childId) {
    return res.status(400).json({ error: 'session id and child_id are required' });
  }

  const deleted = deleteSession(sessionId, childId);
  if (!deleted) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ success: true });
});

export default router;
