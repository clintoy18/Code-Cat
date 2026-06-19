import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { IPuzzleDefinition, IRoomState } from '@/features/game/engine';
import { Grid } from './Grid';

const puzzle: IPuzzleDefinition = {
  id: 'grid-state-test',
  title: 'Grid State Test',
  lesson: 'Variables',
  difficulty: 'Easy',
  parMoves: 1,
  objective: 'Verify key and locked-door visuals.',
  rows: 3,
  cols: 3,
  start: { row: 2, col: 0 },
  key: { row: 2, col: 1 },
  door: { row: 0, col: 2 },
  doorRequiresKey: true,
  walls: [],
  availableBlocks: [],
};

const renderGrid = (roomState: IRoomState) =>
  render(
    <Grid
      puzzle={puzzle}
      catPosition={puzzle.start}
      visited={[puzzle.start]}
      roomState={roomState}
      status="ready"
    />,
  );

describe('Grid state visuals', () => {
  it('shows the key chip and locked door before the key is collected', () => {
    renderGrid({ hasKey: false });

    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.getByText(/Key:/i).parentElement).toHaveTextContent(
      'Key: Missing',
    );
    expect(screen.getByLabelText(/locked door/i)).toBeInTheDocument();
  });

  it('shows the unlocked exit after the key is collected', () => {
    renderGrid({ hasKey: true });

    expect(screen.getByText('Exit')).toBeInTheDocument();
    expect(screen.getByText(/Key:/i).parentElement).toHaveTextContent(
      'Key: Collected',
    );
    expect(screen.queryByLabelText(/locked door/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/door/i)).toBeInTheDocument();
  });
});
