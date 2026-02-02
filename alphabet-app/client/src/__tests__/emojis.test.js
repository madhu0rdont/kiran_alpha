import { describe, it, expect } from 'vitest';
import { EMOJI_MAP, WORD_MAP, getImageUrl } from '../lib/emojis';

describe('EMOJI_MAP', () => {
  it('has 26 entries', () => {
    expect(Object.keys(EMOJI_MAP)).toHaveLength(26);
  });

  it('maps known keys to emojis', () => {
    expect(EMOJI_MAP.anna).toBe('👸');
    expect(EMOJI_MAP.chase).toBe('🐕');
    expect(EMOJI_MAP.nemo).toBe('🐠');
  });
});

describe('WORD_MAP', () => {
  it('has 26 entries', () => {
    expect(Object.keys(WORD_MAP)).toHaveLength(26);
  });

  it('maps known keys to display words', () => {
    expect(WORD_MAP.anna).toBe('Anna');
    expect(WORD_MAP.icecream).toBe('Ice Cream');
    expect(WORD_MAP.elsa).toBe('Queen Elsa');
  });
});

describe('getImageUrl', () => {
  it('returns correct path with uppercase letter', () => {
    expect(getImageUrl('a')).toBe('/images/letters/A.png');
    expect(getImageUrl('Z')).toBe('/images/letters/Z.png');
  });
});
