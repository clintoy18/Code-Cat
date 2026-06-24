import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { starterPuzzles } from '@/features/game/data/starterPuzzles';
import { LevelSelect } from './LevelSelect';

vi.mock('@/hooks/useGame', () => ({
  useGame: () => ({
    puzzles: starterPuzzles,
    loadPuzzle: vi.fn(),
    unlockedPuzzleIds: starterPuzzles.map((puzzle) => puzzle.id),
    completedPuzzleIds: [],
  }),
}));

describe('LevelSelect', () => {
  it('prioritizes the next playable room and hides scaffolded roadmap copy', () => {
    render(
      <MemoryRouter>
        <LevelSelect />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /Recommended next room/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Playable Worlds/i)).toBeInTheDocument();
    expect(screen.getByText(/World 6: Strategy/i)).toBeInTheDocument();
    expect(screen.queryByText(/scaffolded/i)).not.toBeInTheDocument();
  });
});
