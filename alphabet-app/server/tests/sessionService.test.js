import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, removeTestDb } from './setup.js';

let dbPath;
let getSessionCards, gradeCard, completeSession, getProgress;
let db;

beforeAll(async () => {
  dbPath = createTestDb();
  process.env.TEST_DB_PATH = dbPath;

  // Dynamic import so db.js picks up TEST_DB_PATH
  const service = await import('../services/sessionService.js');
  getSessionCards = service.getSessionCards;
  gradeCard = service.gradeCard;
  completeSession = service.completeSession;
  getProgress = service.getProgress;

  const dbMod = await import('../db.js');
  db = dbMod.default;
});

afterAll(() => {
  db.close();
  removeTestDb(dbPath);
  delete process.env.TEST_DB_PATH;
});

describe('getSessionCards', () => {
  it('returns a session_id and cards array', () => {
    const result = getSessionCards('upper');
    expect(result).toHaveProperty('session_id');
    expect(result).toHaveProperty('cards');
    expect(Array.isArray(result.cards)).toBe(true);
  });

  it('returns at least 10 cards for first session', () => {
    const result = getSessionCards('upper');
    expect(result.cards.length).toBeGreaterThanOrEqual(10);
  });

  it('first session cards include new letters', () => {
    const result = getSessionCards('lower');
    const newCards = result.cards.filter(c => c.is_new);
    expect(newCards.length).toBeGreaterThan(0);
  });

  it('cards have required fields', () => {
    const result = getSessionCards('upper');
    const card = result.cards[0];
    expect(card).toHaveProperty('letter_id');
    expect(card).toHaveProperty('character');
    expect(card).toHaveProperty('case_type');
    expect(card).toHaveProperty('image_name');
    expect(card).toHaveProperty('has_image');
    expect(card).toHaveProperty('is_new');
    expect(card).toHaveProperty('is_problem');
  });

  it('cards include display_word field', () => {
    const result = getSessionCards('upper');
    const card = result.cards[0];
    expect(card).toHaveProperty('display_word');
  });

  it('cards are shuffled (not always in display_order)', () => {
    // Run multiple times and check if order varies
    const orders = [];
    for (let i = 0; i < 5; i++) {
      const result = getSessionCards('both');
      orders.push(result.cards.map(c => c.letter_id).join(','));
    }
    const unique = new Set(orders);
    // With 10+ cards shuffled, extremely unlikely all 5 are identical
    expect(unique.size).toBeGreaterThan(1);
  });
});

describe('gradeCard', () => {
  let card;

  beforeAll(() => {
    // Get a card to grade
    const result = getSessionCards('upper');
    card = result.cards[0];
  });

  it('correct answer increases repetitions', () => {
    const result = gradeCard(card.letter_id, 'upper', true);
    expect(result.correct).toBe(true);
    expect(result.repetitions).toBeGreaterThanOrEqual(1);
    expect(result.status).toMatch(/learning|mastered/);
  });

  it('correct answer sets interval to 1 day on first rep', () => {
    // Get a fresh new letter
    const session = getSessionCards('both');
    const newCard = session.cards.find(c => c.is_new);
    if (!newCard) return; // skip if none new
    const result = gradeCard(newCard.letter_id, 'both', true);
    expect(result.interval_days).toBe(1);
  });

  it('wrong answer resets repetitions to 0', () => {
    const session = getSessionCards('lower');
    const c = session.cards[0];
    // Grade correct first to set reps
    gradeCard(c.letter_id, 'lower', true);
    // Then wrong
    const result = gradeCard(c.letter_id, 'lower', false);
    expect(result.repetitions).toBe(0);
    expect(result.interval_days).toBe(1);
    expect(result.correct).toBe(false);
  });

  it('wrong answer decreases ease factor', () => {
    const session = getSessionCards('both');
    const c = session.cards[1];
    const r1 = gradeCard(c.letter_id, 'both', true);
    const easeBefore = r1.ease_factor;
    const r2 = gradeCard(c.letter_id, 'both', false);
    expect(r2.ease_factor).toBeLessThan(easeBefore);
  });

  it('ease factor does not go below 1.3', () => {
    const session = getSessionCards('both');
    const c = session.cards[2];
    // Grade wrong many times
    for (let i = 0; i < 20; i++) {
      gradeCard(c.letter_id, 'both', false);
    }
    const result = gradeCard(c.letter_id, 'both', false);
    expect(result.ease_factor).toBeGreaterThanOrEqual(1.3);
  });
});

describe('completeSession', () => {
  it('marks session as complete', () => {
    const session = getSessionCards('upper');
    const result = completeSession(session.session_id, 10, 8);
    expect(result).toHaveProperty('completed_at');
    expect(result.completed_at).not.toBeNull();
    expect(result.total_cards).toBe(10);
    expect(result.correct_count).toBe(8);
  });
});

describe('getProgress', () => {
  it('returns counts, problemLetters, and recentSessions', () => {
    const result = getProgress('upper');
    expect(result).toHaveProperty('counts');
    expect(result).toHaveProperty('problemLetters');
    expect(result).toHaveProperty('recentSessions');
    expect(result.counts).toHaveProperty('mastered');
    expect(result.counts).toHaveProperty('learning');
    expect(result.counts).toHaveProperty('new');
  });
});
