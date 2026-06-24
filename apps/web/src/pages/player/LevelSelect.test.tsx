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
  it('describes Strategy as part of the live game', () => {
    render(
      <MemoryRouter>
        <LevelSelect />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        /The live game now covers Foundations, Decisions, Loops, Functions, Variables, and Strategy/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/live \/ 0 scaffolded/i)).toBeInTheDocument();
  });
});
