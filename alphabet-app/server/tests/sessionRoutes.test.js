import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, removeTestDb } from './setup.js';

let dbPath;
let server;
let db;

async function request(method, path, body) {
  const opts = { method, headers: {} };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`http://127.0.0.1:${server.address().port}${path}`, opts);
  const data = await res.json();
  return { status: res.status, data };
}

beforeAll(async () => {
  dbPath = createTestDb();
  process.env.TEST_DB_PATH = dbPath;

  const express = (await import('express')).default;
  const sessionRouter = (await import('../routes/session.js')).default;
  db = (await import('../db.js')).default;

  const app = express();
  app.use(express.json());
  app.use('/api/session', sessionRouter);
  app.use('/api/progress', sessionRouter);

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
  removeTestDb(dbPath);
  delete process.env.TEST_DB_PATH;
});

describe('GET /api/session/start', () => {
  it('returns session_id and cards', async () => {
    const { status, data } = await request('GET', '/api/session/start?mode=upper');
    expect(status).toBe(200);
    expect(data).toHaveProperty('session_id');
    expect(data).toHaveProperty('cards');
    expect(data.cards.length).toBeGreaterThanOrEqual(10);
  });

  it('rejects invalid mode', async () => {
    const { status } = await request('GET', '/api/session/start?mode=invalid');
    expect(status).toBe(400);
  });

  it('defaults to upper mode', async () => {
    const { data } = await request('GET', '/api/session/start');
    expect(data.cards[0].case_type).toBe('upper');
  });
});

describe('POST /api/session/grade', () => {
  it('grades a card correctly', async () => {
    const session = await request('GET', '/api/session/start?mode=upper');
    const card = session.data.cards[0];

    const { status, data } = await request('POST', '/api/session/grade', {
      letter_id: card.letter_id,
      mode: 'upper',
      correct: true,
    });
    expect(status).toBe(200);
    expect(data.correct).toBe(true);
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('ease_factor');
  });

  it('validates required fields', async () => {
    const { status } = await request('POST', '/api/session/grade', {});
    expect(status).toBe(400);
  });

  it('rejects invalid mode', async () => {
    const { status } = await request('POST', '/api/session/grade', {
      letter_id: 1,
      mode: 'bad',
      correct: true,
    });
    expect(status).toBe(400);
  });
});

describe('POST /api/session/complete', () => {
  it('completes a session', async () => {
    const session = await request('GET', '/api/session/start?mode=upper');
    const { status, data } = await request('POST', '/api/session/complete', {
      session_id: session.data.session_id,
      total_cards: 10,
      correct_count: 7,
    });
    expect(status).toBe(200);
    expect(data.completed_at).not.toBeNull();
    expect(data.total_cards).toBe(10);
    expect(data.correct_count).toBe(7);
  });

  it('requires session_id', async () => {
    const { status } = await request('POST', '/api/session/complete', {});
    expect(status).toBe(400);
  });
});

describe('GET /api/progress', () => {
  it('returns progress summary', async () => {
    const { status, data } = await request('GET', '/api/progress?mode=upper');
    expect(status).toBe(200);
    expect(data).toHaveProperty('counts');
    expect(data).toHaveProperty('problemLetters');
    expect(data).toHaveProperty('recentSessions');
  });
});

describe('GET /api/progress/letters', () => {
  it('returns per-letter progress with display_word', async () => {
    const { status, data } = await request('GET', '/api/progress/letters?mode=upper');
    expect(status).toBe(200);
    expect(data.length).toBe(26);
    expect(data[0]).toHaveProperty('character');
    expect(data[0]).toHaveProperty('display_word');
    expect(data[0]).toHaveProperty('has_image');
  });
});
