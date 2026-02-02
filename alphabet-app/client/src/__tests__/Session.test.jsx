import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Session from '../pages/Session';

// Mock the API
vi.mock('../services/api', () => ({
  startSession: vi.fn(),
  gradeCard: vi.fn(),
}));

// Mock sounds
vi.mock('../lib/sounds', () => ({
  playCorrect: vi.fn(),
  playWrong: vi.fn(),
}));

// Mock speech
vi.mock('../lib/speech', () => ({
  speakLetterAndWord: vi.fn(),
}));

import { startSession } from '../services/api';

function renderSession(mode = 'upper') {
  return render(
    <MemoryRouter initialEntries={[`/child/1/session/${mode}`]}>
      <Routes>
        <Route path="/child/:childId/session/:mode" element={<Session muted={true} setMuted={() => {}} />} />
        <Route path="/child/:childId/complete/:mode" element={<div>Complete</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    startSession.mockReturnValue(new Promise(() => {})); // never resolves
    renderSession();
    expect(screen.getByText('Loading cards...')).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    startSession.mockRejectedValue(new Error('fail'));
    renderSession();
    await waitFor(() => {
      expect(screen.getByText(/Could not connect/)).toBeInTheDocument();
    });
  });

  it('shows "all caught up" when no cards returned', async () => {
    startSession.mockResolvedValue({ session_id: 1, cards: [] });
    renderSession();
    await waitFor(() => {
      expect(screen.getByText('All caught up!')).toBeInTheDocument();
    });
  });

  it('renders a card with letter and word', async () => {
    startSession.mockResolvedValue({
      session_id: 1,
      cards: [
        {
          letter_id: 1,
          character: 'A',
          case_type: 'upper',
          image_name: 'anna',
          has_image: false,
          display_word: null,
          is_new: true,
          is_problem: false,
        },
      ],
    });
    renderSession();
    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('Anna')).toBeInTheDocument();
    });
  });

  it('uses display_word when provided', async () => {
    startSession.mockResolvedValue({
      session_id: 1,
      cards: [
        {
          letter_id: 1,
          character: 'T',
          case_type: 'upper',
          image_name: 'thomas',
          has_image: false,
          display_word: 'Tent',
          is_new: false,
          is_problem: false,
        },
      ],
    });
    renderSession();
    await waitFor(() => {
      expect(screen.getByText('Tent')).toBeInTheDocument();
    });
    // Should NOT show "Thomas"
    expect(screen.queryByText('Thomas')).not.toBeInTheDocument();
  });

  it('shows new letter badge', async () => {
    startSession.mockResolvedValue({
      session_id: 1,
      cards: [
        {
          letter_id: 1,
          character: 'B',
          case_type: 'upper',
          image_name: 'bam',
          has_image: false,
          display_word: null,
          is_new: true,
          is_problem: false,
        },
      ],
    });
    renderSession();
    await waitFor(() => {
      expect(screen.getByText(/New Letter/)).toBeInTheDocument();
    });
  });

  it('renders grade buttons', async () => {
    startSession.mockResolvedValue({
      session_id: 1,
      cards: [
        {
          letter_id: 1,
          character: 'C',
          case_type: 'upper',
          image_name: 'chase',
          has_image: false,
          display_word: null,
          is_new: false,
          is_problem: false,
        },
      ],
    });
    renderSession();
    await waitFor(() => {
      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByText('✗')).toBeInTheDocument();
    });
  });
});
