import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { starterPuzzles } from '@/features/game/data/starterPuzzles';
import { LevelSelect } from './LevelSelect';

const mockStartOfficialSession = vi.fn();

vi.mock('@/hooks/useGame', () => ({
  useGame: () => ({
    officialPuzzles: starterPuzzles,
    loadPuzzle: vi.fn(),
    unlockedPuzzleIds: starterPuzzles.map((puzzle) => puzzle.id),
    completedPuzzleIds: [],
    startOfficialSession: mockStartOfficialSession,
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

  it('keeps classroom gameplay out of the normal gameplay page', () => {
    render(
      <MemoryRouter>
        <LevelSelect />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Normal Gameplay/i)).toBeInTheDocument();
    expect(screen.queryByText(/Classroom Gameplay/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Teacher-assigned work/i)).not.toBeInTheDocument();
  });
});
