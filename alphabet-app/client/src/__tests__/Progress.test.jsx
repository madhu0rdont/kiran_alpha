import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Progress from '../pages/Progress';

vi.mock('../services/api', () => ({
  getProgress: vi.fn(),
  getProgressLetters: vi.fn(),
}));

import { getProgress, getProgressLetters } from '../services/api';

function makeProgressLetter(char, status = 'new') {
  return {
    letter_id: char.charCodeAt(0) - 64,
    character: char,
    case_type: 'upper',
    image_name: 'test',
    display_order: char.charCodeAt(0) - 64,
    has_image: 0,
    display_word: null,
    status,
    ease_factor: 2.5,
    interval_days: 1,
    repetitions: 0,
    next_review_date: null,
    last_reviewed: null,
    times_failed: 0,
    recent_fails: 0,
    introduced_date: null,
  };
}

const allLetters = Array.from({ length: 26 }, (_, i) =>
  makeProgressLetter(String.fromCharCode(65 + i))
);

const defaultSummary = {
  counts: { mastered: 5, learning: 10, new: 11, problem: 2 },
  problemLetters: [],
  recentSessions: [],
};

function renderProgress(mode = 'upper') {
  return render(
    <MemoryRouter initialEntries={[`/progress/${mode}`]}>
      <Routes>
        <Route path="/progress/:mode" element={<Progress />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    getProgress.mockReturnValue(new Promise(() => {}));
    getProgressLetters.mockReturnValue(new Promise(() => {}));
    renderProgress();
    expect(screen.queryByText('Progress')).not.toBeInTheDocument();
  });

  it('renders stats after loading', async () => {
    getProgress.mockResolvedValue(defaultSummary);
    getProgressLetters.mockResolvedValue(allLetters);
    renderProgress();
    await waitFor(() => {
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('5/26')).toBeInTheDocument(); // mastered
      expect(screen.getByText('10')).toBeInTheDocument(); // learning
    });
  });

  it('renders 26 letter buttons in grid', async () => {
    getProgress.mockResolvedValue(defaultSummary);
    getProgressLetters.mockResolvedValue(allLetters);
    renderProgress();
    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('Z')).toBeInTheDocument();
    });
  });

  it('renders 3 mode tabs', async () => {
    getProgress.mockResolvedValue(defaultSummary);
    getProgressLetters.mockResolvedValue(allLetters);
    renderProgress();
    await waitFor(() => {
      expect(screen.getByText('ABC')).toBeInTheDocument();
      expect(screen.getByText('abc')).toBeInTheDocument();
      expect(screen.getByText('ABC+abc')).toBeInTheDocument();
    });
  });

  it('shows problem letters callout when present', async () => {
    const summary = {
      ...defaultSummary,
      problemLetters: [{ letter_id: 1, character: 'A', image_name: 'anna' }],
    };
    getProgress.mockResolvedValue(summary);
    getProgressLetters.mockResolvedValue(allLetters);
    renderProgress();
    await waitFor(() => {
      expect(screen.getByText('Problem letters:')).toBeInTheDocument();
    });
  });

  it('shows recent sessions when present', async () => {
    const summary = {
      ...defaultSummary,
      recentSessions: [{
        id: 1,
        mode: 'upper',
        completed_at: '2025-01-15T10:00:00',
        total_cards: 10,
        correct_count: 8,
      }],
    };
    getProgress.mockResolvedValue(summary);
    getProgressLetters.mockResolvedValue(allLetters);
    renderProgress();
    await waitFor(() => {
      expect(screen.getByText('Recent Sessions')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('8/10')).toBeInTheDocument();
    });
  });

  it('opens letter detail modal on tap', async () => {
    const letters = [...allLetters];
    letters[0] = { ...letters[0], status: 'learning', introduced_date: '2025-01-10T10:00:00' };
    getProgress.mockResolvedValue(defaultSummary);
    getProgressLetters.mockResolvedValue(letters);
    renderProgress();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    await user.click(screen.getByText('A'));

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  it('renders home link', async () => {
    getProgress.mockResolvedValue(defaultSummary);
    getProgressLetters.mockResolvedValue(allLetters);
    renderProgress();
    await waitFor(() => {
      expect(screen.getByText(/Home/)).toBeInTheDocument();
    });
  });
});
