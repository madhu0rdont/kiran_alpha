import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SessionComplete from '../pages/SessionComplete';

vi.mock('../services/api', () => ({
  completeSession: vi.fn().mockResolvedValue({}),
}));

vi.mock('../lib/sounds', () => ({
  playCelebration: vi.fn(),
}));

function renderComplete(state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/complete/upper', state }]}>
      <Routes>
        <Route path="/complete/:mode" element={<SessionComplete muted={true} />} />
        <Route path="/session/:mode" element={<div>Session</div>} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SessionComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows fallback when no state', () => {
    renderComplete(null);
    expect(screen.getByText('No session data found.')).toBeInTheDocument();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });

  it('displays score', () => {
    renderComplete({
      sessionId: 1,
      totalShown: 10,
      correctCount: 8,
      results: [],
      cards: [],
    });
    expect(screen.getByText('8 / 10')).toBeInTheDocument();
    expect(screen.getByText('80% correct')).toBeInTheDocument();
  });

  it('shows "Great Job!" heading', () => {
    renderComplete({
      sessionId: 1,
      totalShown: 10,
      correctCount: 10,
      results: [],
      cards: [],
    });
    expect(screen.getByText('Great Job!')).toBeInTheDocument();
  });

  it('shows new letters learned', () => {
    renderComplete({
      sessionId: 1,
      totalShown: 10,
      correctCount: 8,
      results: [],
      cards: [
        { letter_id: 1, character: 'A', image_name: 'anna', is_new: true },
        { letter_id: 2, character: 'B', image_name: 'bam', is_new: true },
        { letter_id: 3, character: 'C', image_name: 'chase', is_new: false },
      ],
    });
    expect(screen.getByText('New letters learned today')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('shows problem letters from wrong answers', () => {
    renderComplete({
      sessionId: 1,
      totalShown: 10,
      correctCount: 8,
      results: [
        { letter_id: 5, character: 'E', image_name: 'elmo', correct: false },
        { letter_id: 6, character: 'F', image_name: 'fuli', correct: true },
      ],
      cards: [],
    });
    expect(screen.getByText('Keep practicing')).toBeInTheDocument();
    expect(screen.getByText('E')).toBeInTheDocument();
  });

  it('renders Play Again and Go Home buttons', () => {
    renderComplete({
      sessionId: 1,
      totalShown: 10,
      correctCount: 10,
      results: [],
      cards: [],
    });
    expect(screen.getByText('Play Again')).toBeInTheDocument();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });

  it('handles 0 cards without crashing', () => {
    renderComplete({
      sessionId: 1,
      totalShown: 0,
      correctCount: 0,
      results: [],
      cards: [],
    });
    expect(screen.getByText('0 / 0')).toBeInTheDocument();
    expect(screen.getByText('0% correct')).toBeInTheDocument();
  });
});
