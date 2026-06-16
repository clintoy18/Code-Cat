import { describe, expect, it } from 'vitest';
import {
  GameEngine,
  createRepeatBlockTemplate,
  createWhileBlockTemplate,
  type IBlockTemplate,
  type IPuzzleDefinition,
} from './GameEngine';

const moveUpBlock: IBlockTemplate = { key: 'move-up', label: 'moveUp()', kind: 'MOVE', move: 'UP' };
const moveRightBlock: IBlockTemplate = { key: 'move-right', label: 'moveRight()', kind: 'MOVE', move: 'RIGHT' };
const ifDoorUpBlock: IBlockTemplate = {
  key: 'if-door-up',
  label: 'if (doorUp) moveUp()',
  kind: 'CONDITIONAL',
  condition: 'DOOR_UP',
  action: 'UP',
};
const ifPathRightBlock: IBlockTemplate = {
  key: 'if-path-right',
  label: 'if (pathRightClear) moveRight()',
  kind: 'CONDITIONAL',
  condition: 'PATH_RIGHT_CLEAR',
  action: 'RIGHT',
};

const buildPuzzle = (availableBlocks: IBlockTemplate[]): IPuzzleDefinition => ({
  id: 'loops-test',
  title: 'Loops Test',
  lesson: 'Loops',
  difficulty: 'Medium',
  parMoves: 1,
  objective: 'Test loop execution.',
  rows: 5,
  cols: 5,
  start: { row: 4, col: 0 },
  door: { row: 0, col: 4 },
  walls: [],
  availableBlocks,
});

describe('GameEngine loops', () => {
  it('executes nested repeat blocks and reaches the door', () => {
    const engine = new GameEngine();
    const puzzle = buildPuzzle([moveUpBlock, moveRightBlock, createRepeatBlockTemplate(2, [moveUpBlock])]);

    engine.loadPuzzle(puzzle);
    engine.replaceProgram([
      createRepeatBlockTemplate(2, [
        createRepeatBlockTemplate(2, [moveUpBlock]),
        createRepeatBlockTemplate(2, [moveRightBlock]),
      ]),
    ]);

    const snapshot = engine.run();

    expect(snapshot.status).toBe('success');
    expect(snapshot.didReachDoor).toBe(true);
    expect(snapshot.catPosition).toEqual({ row: 0, col: 4 });
    expect(snapshot.visited).toHaveLength(9);
  });

  it('runs a while loop with a multi-line body until the condition turns false', () => {
    const engine = new GameEngine();
    const puzzle = buildPuzzle([moveUpBlock, moveRightBlock, ifPathRightBlock, createWhileBlockTemplate('PATH_RIGHT_CLEAR', [moveRightBlock])]);

    engine.loadPuzzle(puzzle);
    engine.replaceProgram([createWhileBlockTemplate('PATH_RIGHT_CLEAR', [moveRightBlock, moveUpBlock])]);

    const snapshot = engine.run();

    expect(snapshot.status).toBe('success');
    expect(snapshot.catPosition).toEqual({ row: 0, col: 4 });
    expect(snapshot.log.some((entry) => entry.includes('looping while pathRightClear'))).toBe(true);
  });

  it('fails a while loop that makes no progress while the condition remains true', () => {
    const engine = new GameEngine();
    const puzzle = buildPuzzle([moveRightBlock, ifDoorUpBlock, ifPathRightBlock, createWhileBlockTemplate('PATH_RIGHT_CLEAR', [ifDoorUpBlock])]);

    engine.loadPuzzle(puzzle);
    engine.replaceProgram([createWhileBlockTemplate('PATH_RIGHT_CLEAR', [ifDoorUpBlock])]);

    const snapshot = engine.run();

    expect(snapshot.status).toBe('error');
    expect(snapshot.log.some((entry) => entry.includes('made no progress'))).toBe(true);
  });
});
