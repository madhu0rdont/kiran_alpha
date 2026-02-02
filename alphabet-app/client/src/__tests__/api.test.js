import { describe, it, expect, beforeEach, vi } from 'vitest';

let api;

beforeEach(async () => {
  vi.restoreAllMocks();
  // Re-import to get fresh module
  api = await import('../services/api.js');
});

function mockFetch(responseData, ok = true, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: 'Error',
    json: () => Promise.resolve(responseData),
  });
}

describe('startSession', () => {
  it('calls GET /api/session/start with mode and count', async () => {
    mockFetch({ session_id: 1, cards: [] });
    await api.startSession('upper', 1, 10);
    expect(fetch).toHaveBeenCalledWith(
      '/api/session/start?mode=upper&child_id=1&count=10',
      expect.objectContaining({ method: 'GET' })
    );
  });
});

describe('gradeCard', () => {
  it('calls POST /api/session/grade with body', async () => {
    mockFetch({ correct: true });
    await api.gradeCard(1, 'upper', 1, true);
    expect(fetch).toHaveBeenCalledWith(
      '/api/session/grade',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ letter_id: 1, mode: 'upper', child_id: 1, correct: true }),
      })
    );
  });
});

describe('completeSession', () => {
  it('calls POST /api/session/complete', async () => {
    mockFetch({ id: 1 });
    await api.completeSession(1, 10, 8);
    expect(fetch).toHaveBeenCalledWith(
      '/api/session/complete',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ session_id: 1, total_cards: 10, correct_count: 8 }),
      })
    );
  });
});

describe('getProgress', () => {
  it('calls GET /api/progress with mode', async () => {
    mockFetch({ counts: {} });
    await api.getProgress('lower', 1);
    expect(fetch).toHaveBeenCalledWith(
      '/api/progress?mode=lower&child_id=1',
      expect.objectContaining({ method: 'GET' })
    );
  });
});

describe('updateLetterWord', () => {
  it('calls PUT /api/admin/word/:letter', async () => {
    mockFetch({ success: true });
    await api.updateLetterWord('T', 'Tent');
    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/word/T',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ word: 'Tent' }),
      })
    );
  });
});

describe('uploadLetterImage', () => {
  it('sends FormData via POST', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    await api.uploadLetterImage('A', file);
    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/upload/A',
      expect.objectContaining({ method: 'POST' })
    );
    // Body should be FormData
    const callBody = fetch.mock.calls[0][1].body;
    expect(callBody).toBeInstanceOf(FormData);
  });
});

describe('error handling', () => {
  it('throws on non-ok response', async () => {
    mockFetch({ error: 'Bad request' }, false, 400);
    await expect(api.startSession('upper', 1)).rejects.toThrow('Bad request');
  });
});
