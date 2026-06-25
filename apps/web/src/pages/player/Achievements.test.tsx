import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { starterPuzzles } from '@/features/game/data/starterPuzzles';
import { Achievements } from './Achievements';

vi.mock('@/hooks/useGame', () => ({
  useGame: () => ({
    puzzles: starterPuzzles,
    completedPuzzleIds: [
      'porch-parade',
      'hedge-check',
      'terrace-repeat',
      'helper-hall',
      'signal-lane',
      'perimeter-plan',
    ],
  }),
}));

describe('Achievements', () => {
  it('unlocks achievements from real completed puzzle progress', () => {
    render(
      <MemoryRouter>
        <Achievements />
      </MemoryRouter>,
    );

    expect(screen.getByText('6/7')).toBeInTheDocument();
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Route Strategist')).toBeInTheDocument();
    expect(screen.getAllByText('World Climber')).toHaveLength(2);
    expect(screen.getAllByText('Earned').length).toBeGreaterThan(0);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
