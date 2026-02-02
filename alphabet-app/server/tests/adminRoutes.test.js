import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, removeTestDb } from './setup.js';

let dbPath;
let app;
let db;

// Minimal HTTP request helper using Node fetch against Express
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

let server;

beforeAll(async () => {
  dbPath = createTestDb();
  process.env.TEST_DB_PATH = dbPath;

  // Import app modules after setting env
  const express = (await import('express')).default;
  const adminRouter = (await import('../routes/admin.js')).default;
  db = (await import('../db.js')).default;

  app = express();
  app.use(express.json());
  app.use('/api/admin', adminRouter);

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

describe('GET /api/admin/letters', () => {
  it('returns 26 uppercase letters', async () => {
    const { status, data } = await request('GET', '/api/admin/letters');
    expect(status).toBe(200);
    expect(data).toHaveLength(26);
    expect(data[0].character).toBe('A');
    expect(data[25].character).toBe('Z');
  });

  it('each letter has required fields', async () => {
    const { data } = await request('GET', '/api/admin/letters');
    const letter = data[0];
    expect(letter).toHaveProperty('id');
    expect(letter).toHaveProperty('character');
    expect(letter).toHaveProperty('case_type', 'upper');
    expect(letter).toHaveProperty('image_name');
    expect(letter).toHaveProperty('display_order');
    expect(letter).toHaveProperty('has_image');
    expect(letter).toHaveProperty('display_word');
  });
});

describe('PUT /api/admin/word/:letter', () => {
  it('updates display_word for a letter', async () => {
    const { status, data } = await request('PUT', '/api/admin/word/T', { word: 'Tent' });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.display_word).toBe('Tent');

    // Verify in DB — both upper and lower updated
    const upper = db.prepare("SELECT display_word FROM letters WHERE character = 'T'").get();
    const lower = db.prepare("SELECT display_word FROM letters WHERE character = 't'").get();
    expect(upper.display_word).toBe('Tent');
    expect(lower.display_word).toBe('Tent');
  });

  it('resets to null with empty string', async () => {
    const { status, data } = await request('PUT', '/api/admin/word/T', { word: '' });
    expect(status).toBe(200);
    expect(data.display_word).toBeNull();

    const row = db.prepare("SELECT display_word FROM letters WHERE character = 'T'").get();
    expect(row.display_word).toBeNull();
  });

  it('trims whitespace', async () => {
    const { data } = await request('PUT', '/api/admin/word/A', { word: '  Apple  ' });
    expect(data.display_word).toBe('Apple');
  });
});

describe('DELETE /api/admin/image/:letter', () => {
  it('resets has_image flag', async () => {
    // Set has_image first
    db.prepare("UPDATE letters SET has_image = 1 WHERE character = 'B'").run();

    const { status, data } = await request('DELETE', '/api/admin/image/B');
    expect(status).toBe(200);
    expect(data.success).toBe(true);

    const row = db.prepare("SELECT has_image FROM letters WHERE character = 'B'").get();
    expect(row.has_image).toBe(0);
  });
});
