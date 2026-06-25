import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import {
  RoomLayoutEditor,
  type IRoomLayoutDraft,
} from './RoomLayoutEditor';

const defaultDraft: IRoomLayoutDraft = {
  rows: 5,
  cols: 5,
  start: { row: 4, col: 0 },
  door: { row: 0, col: 4 },
  key: null,
  walls: [],
  doorRequiresKey: false,
};

const Harness = ({ initialValue = defaultDraft }: { initialValue?: IRoomLayoutDraft }) => {
  const [value, setValue] = useState(initialValue);

  return (
    <>
      <RoomLayoutEditor value={value} onChange={setValue} />
      <output data-testid="layout-value">{JSON.stringify(value)}</output>
    </>
  );
};

const readLayout = () =>
  JSON.parse(
    screen.getByTestId('layout-value').textContent ?? '{}',
  ) as IRoomLayoutDraft;

describe('RoomLayoutEditor', () => {
  it('places tiles directly on the board and paints walls by dragging', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: /place start/i }));
    fireEvent.click(
      screen.getByRole('button', { name: /row 2 column 2 empty tile/i }),
    );

    expect(readLayout().start).toEqual({ row: 1, col: 1 });

    fireEvent.click(screen.getByRole('button', { name: /paint walls/i }));

    const firstWallTile = screen.getByRole('button', {
      name: /row 3 column 3 empty tile/i,
    });
    const secondWallTile = screen.getByRole('button', {
      name: /row 3 column 4 empty tile/i,
    });

    fireEvent.pointerDown(firstWallTile);
    fireEvent.pointerEnter(secondWallTile);
    fireEvent.pointerUp(secondWallTile);

    expect(readLayout().walls).toEqual([
      { row: 2, col: 2 },
      { row: 2, col: 3 },
    ]);

    fireEvent.click(screen.getByRole('button', { name: /place key/i }));
    fireEvent.click(
      screen.getByRole('button', { name: /row 3 column 3 wall tile/i }),
    );

    expect(readLayout().key).toEqual({ row: 2, col: 2 });
    expect(readLayout().walls).toEqual([{ row: 2, col: 3 }]);
  });

  it('normalizes tiles when the board shrinks', () => {
    render(
      <Harness
        initialValue={{
          rows: 5,
          cols: 5,
          start: { row: 4, col: 4 },
          door: { row: 0, col: 4 },
          key: { row: 4, col: 3 },
          walls: [
            { row: 4, col: 2 },
            { row: 2, col: 2 },
          ],
          doorRequiresKey: true,
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText('Rows'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText('Columns'), {
      target: { value: '2' },
    });

    expect(readLayout()).toMatchObject({
      rows: 2,
      cols: 2,
      start: { row: 1, col: 1 },
      door: { row: 0, col: 1 },
      key: null,
      walls: [],
      doorRequiresKey: true,
    });
  });
});
