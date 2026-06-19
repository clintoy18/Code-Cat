import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createRepeatBlockTemplate,
  createWhileBlockTemplate,
  type IBlockTemplate,
  type IProgramBlock,
} from '@/features/game/engine';
import { Gameplay } from './Gameplay';

const mockReplaceProgram = vi.fn();
const mockRunProgram = vi.fn();

const moveUpBlock: IBlockTemplate = {
  key: 'move-up',
  label: 'moveUp()',
  kind: 'MOVE',
  move: 'UP',
};
const moveRightBlock: IBlockTemplate = {
  key: 'move-right',
  label: 'moveRight()',
  kind: 'MOVE',
  move: 'RIGHT',
};
const ifPathUpBlock: IBlockTemplate = {
  key: 'if-path-up',
  label: 'if (pathUpClear) moveUp()',
  kind: 'CONDITIONAL',
  condition: 'PATH_UP_CLEAR',
  action: 'UP',
};

const puzzle = {
  id: 'echo-ramp',
  title: 'Echo Ramp',
  lesson: 'Loops' as const,
  difficulty: 'Hard' as const,
  parMoves: 1,
  objective:
    'Nest repeat blocks so one outer plan reuses the same climb-and-cross pattern twice to reach the exit.',
  rows: 5,
  cols: 5,
  start: { row: 4, col: 0 },
  door: { row: 0, col: 4 },
  walls: [],
  availableBlocks: [
    moveUpBlock,
    moveRightBlock,
    ifPathUpBlock,
    createRepeatBlockTemplate(2, [moveUpBlock]),
    createWhileBlockTemplate('PATH_UP_CLEAR', [moveUpBlock]),
  ],
};

let mockGameState: ReturnType<typeof buildGameState>;

function buildGameState(program: IProgramBlock[]) {
  return {
    puzzles: [puzzle],
    activePuzzleId: puzzle.id,
    completedPuzzleIds: [],
    unlockedPuzzleIds: [puzzle.id],
    latestCompletedPuzzleId: null,
    puzzle,
    program,
    catPosition: puzzle.start,
    visited: [puzzle.start],
    roomState: { hasKey: false },
    status: 'ready' as const,
    log: ['Puzzle loaded'],
    loadPuzzle: vi.fn(),
    replaceProgram: mockReplaceProgram,
    clearProgram: vi.fn(),
    runProgram: mockRunProgram,
    resetPuzzle: vi.fn(),
  };
}

vi.mock('@/hooks/useGame', () => ({
  useGame: () => mockGameState,
}));

vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: (selector: (state: { volume: number }) => number) =>
    selector({ volume: 0.6 }),
}));

vi.mock('@/features/game/audio/gameAudio', () => ({
  gameAudio: {
    prime: vi.fn(),
    playStep: vi.fn(),
    playSuccess: vi.fn(),
    playError: vi.fn(),
  },
}));

vi.mock('@/components/game', () => ({
  Cat: () => <div>Cat</div>,
  Grid: () => <div>Grid</div>,
}));

describe('Gameplay loop editor', () => {
  beforeEach(() => {
    mockReplaceProgram.mockReset();
    mockRunProgram.mockReset();
    mockReplaceProgram.mockImplementation((nextProgram: IProgramBlock[]) => {
      mockGameState.program = nextProgram;
    });
    mockRunProgram.mockReturnValue({
      puzzle,
      program: [],
      catPosition: puzzle.start,
      visited: [puzzle.start],
      roomState: { hasKey: false },
      status: 'ready',
      log: ['Puzzle loaded'],
      stepIndex: 0,
      didReachDoor: false,
    });
    mockGameState = buildGameState([
      {
        ...createRepeatBlockTemplate(2, [
          moveUpBlock,
          createWhileBlockTemplate('PATH_UP_CLEAR', [moveRightBlock]),
        ]),
        id: 'block-0',
      },
    ]);
  });

  it('shows the latest clicked block in the route preview', async () => {
    const user = userEvent.setup();

    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    mockGameState = buildGameState([]);

    render(
      <MemoryRouter>
        <Gameplay />
      </MemoryRouter>,
    );

    expect(
      screen.getByText('Click a block to build the route.'),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /moveUp\(\)/i })[0]);

    expect(mockReplaceProgram).toHaveBeenCalledTimes(1);
    const latestAddedLabel = screen.getByText('Latest added');

    expect(latestAddedLabel.nextElementSibling).toHaveTextContent('moveUp()');
  });

  it('adds a block when a palette button is dropped into the route builder', () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    mockGameState = buildGameState([]);

    const { container } = render(
      <MemoryRouter>
        <Gameplay />
      </MemoryRouter>,
    );

    const dragSource = screen.getAllByRole('button', {
      name: /moveUp\(\)/i,
    })[0];
    const dropZone = container.querySelector('.gameplay-focus__terminalStack');

    expect(dropZone).not.toBeNull();

    const dataTransfer = {
      data: new Map<string, string>(),
      dropEffect: 'move',
      effectAllowed: 'all',
      setData(type: string, value: string) {
        this.data.set(type, value);
      },
      getData(type: string) {
        return this.data.get(type) ?? '';
      },
    };

    fireEvent.dragStart(dragSource, { dataTransfer });
    fireEvent.dragEnter(dropZone as HTMLElement, { dataTransfer });
    fireEvent.dragOver(dropZone as HTMLElement, { dataTransfer });
    fireEvent.drop(dropZone as HTMLElement, { dataTransfer });

    expect(mockReplaceProgram).toHaveBeenCalledTimes(1);
    expect(mockReplaceProgram.mock.calls[0][0][0].label).toBe('moveUp()');
    expect(
      screen.getByText('Latest added').nextElementSibling,
    ).toHaveTextContent('moveUp()');
  });

  it('renders nested loop lines and loop controls in block mode', () => {
    render(
      <MemoryRouter>
        <Gameplay />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('repeat(2) {').length).toBeGreaterThan(0);
    expect(screen.getByText('while (pathUpClear) {')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add Repeat' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add While' }),
    ).toBeInTheDocument();
  });

  it('adds a nested repeat block to the selected loop body', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Gameplay />
      </MemoryRouter>,
    );

    await user.click(screen.getAllByRole('button', { name: 'add inside' })[0]);
    await user.click(screen.getByRole('button', { name: 'Add Repeat' }));

    expect(mockReplaceProgram).toHaveBeenCalledTimes(1);
    expect(mockReplaceProgram.mock.calls[0][0][0].kind).toBe('REPEAT');
    expect(mockReplaceProgram.mock.calls[0][0][0].loopBody[2].kind).toBe(
      'REPEAT',
    );
  });
});
