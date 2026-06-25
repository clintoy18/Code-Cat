import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { starterPuzzles } from '@/features/game/data/starterPuzzles';
import { MainMenu } from './MainMenu';

vi.mock('@/hooks/useGame', () => ({
  useGame: () => ({
    puzzles: starterPuzzles,
    unlockedPuzzleIds: starterPuzzles.map((puzzle) => puzzle.id),
    completedPuzzleIds: [starterPuzzles[0].id, starterPuzzles[1].id],
  }),
}));

describe('MainMenu', () => {
  it('reflects the live student curriculum and progress summary', () => {
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /Mission control for every playable room/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Strategy World/i)).toBeInTheDocument();
    expect(
      screen.getByText(/2 of 15 playable rooms completed across 6 live worlds/i),
    ).toBeInTheDocument();
  });
});
