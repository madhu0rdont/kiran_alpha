import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Home from '../pages/Home';

vi.mock('../services/api', () => ({
  fetchProfiles: vi.fn().mockResolvedValue([
    { id: 1, name: 'Kiran', avatar: '🧒' },
  ]),
}));

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/child/1']}>
      <Routes>
        <Route path="/child/:childId" element={<Home />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Home', () => {
  it('renders the title', () => {
    renderHome();
    expect(screen.getByText('ABC Learning')).toBeInTheDocument();
  });

  it('renders 3 mode buttons', () => {
    renderHome();
    expect(screen.getByText('ABC + abc')).toBeInTheDocument();
    expect(screen.getByText('ABC')).toBeInTheDocument();
    expect(screen.getByText('abc')).toBeInTheDocument();
  });

  it('renders mode descriptions', () => {
    renderHome();
    expect(screen.getByText('Upper & lowercase')).toBeInTheDocument();
    expect(screen.getByText('Uppercase only')).toBeInTheDocument();
    expect(screen.getByText('Lowercase only')).toBeInTheDocument();
  });

  it('renders progress link', () => {
    renderHome();
    expect(screen.getByText('View Progress')).toBeInTheDocument();
  });

  it('renders admin link', () => {
    renderHome();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('renders switch child link', () => {
    renderHome();
    expect(screen.getByText('Switch Child')).toBeInTheDocument();
  });
});
