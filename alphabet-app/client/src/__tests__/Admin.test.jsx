import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Admin from '../pages/Admin';

vi.mock('../services/api', () => ({
  getAdminLetters: vi.fn(),
  uploadLetterImage: vi.fn(),
  deleteLetterImage: vi.fn(),
  updateLetterWord: vi.fn(),
}));

import { getAdminLetters, updateLetterWord } from '../services/api';

function makeLetter(char, index) {
  return {
    id: index + 1,
    character: char,
    case_type: 'upper',
    image_name: 'test',
    display_order: index + 1,
    has_image: 0,
    display_word: null,
  };
}

const allLetters = Array.from({ length: 26 }, (_, i) =>
  makeLetter(String.fromCharCode(65 + i), i)
);

function renderAdmin() {
  return render(
    <MemoryRouter>
      <Admin />
    </MemoryRouter>
  );
}

describe('Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    getAdminLetters.mockReturnValue(new Promise(() => {}));
    renderAdmin();
    // Spinner is a div with animate-spin class, just check no letters yet
    expect(screen.queryByText('A')).not.toBeInTheDocument();
  });

  it('renders 26 letter cards', async () => {
    getAdminLetters.mockResolvedValue(allLetters);
    renderAdmin();
    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('Z')).toBeInTheDocument();
    });
  });

  it('shows upload button for each letter', async () => {
    getAdminLetters.mockResolvedValue(allLetters);
    renderAdmin();
    await waitFor(() => {
      const uploadButtons = screen.getAllByText('Upload');
      expect(uploadButtons).toHaveLength(26);
    });
  });

  it('shows word with pencil icon for editing', async () => {
    getAdminLetters.mockResolvedValue(allLetters);
    renderAdmin();
    await waitFor(() => {
      // Words show with pencil ✎
      const editables = screen.getAllByText(/✎/);
      expect(editables.length).toBe(26);
    });
  });

  it('shows replace button when letter has image', async () => {
    const letters = [...allLetters];
    letters[0] = { ...letters[0], has_image: 1 };
    getAdminLetters.mockResolvedValue(letters);
    renderAdmin();
    await waitFor(() => {
      expect(screen.getByText('Replace')).toBeInTheDocument();
      expect(screen.getByText('Remove')).toBeInTheDocument();
    });
  });

  it('clicking word opens edit input', async () => {
    getAdminLetters.mockResolvedValue(allLetters);
    renderAdmin();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    // Click the first word (contains ✎)
    const editables = screen.getAllByText(/✎/);
    await user.click(editables[0]);

    // Should now show an input
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('editing word and pressing enter saves', async () => {
    getAdminLetters.mockResolvedValue(allLetters);
    updateLetterWord.mockResolvedValue({ success: true });
    // After save, reload returns updated data
    getAdminLetters.mockResolvedValueOnce(allLetters);
    renderAdmin();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    const editables = screen.getAllByText(/✎/);
    await user.click(editables[0]);

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'Apple{Enter}');

    expect(updateLetterWord).toHaveBeenCalledWith('A', 'Apple');
  });
});
