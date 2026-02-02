import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../pages/Home';

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
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
});
