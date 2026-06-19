import { describe, expect, it } from 'vitest';
import { stateWorldPuzzles } from '@/features/game/data/worlds/stateWorld';
import {
  GameEngine,
  createFunctionCallBlockTemplate,
  createFunctionDefinitionBlockTemplate,
  createRepeatBlockTemplate,
  createWhileBlockTemplate,
  type IBlockTemplate,
  type IPuzzleDefinition,
} from './GameEngine';

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
const moveDownBlock: IBlockTemplate = {
  key: 'move-down',
  label: 'moveDown()',
  kind: 'MOVE',
  move: 'DOWN',
};
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
const ifHasKeyRightBlock: IBlockTemplate = {
  key: 'if-has-key-right',
  label: 'if (hasKey) moveRight()',
  kind: 'CONDITIONAL',
  condition: 'HAS_KEY',
  action: 'RIGHT',
};
const ifHasKeyUpBlock: IBlockTemplate = {
  key: 'if-has-key-up',
  label: 'if (hasKey) moveUp()',
  kind: 'CONDITIONAL',
  condition: 'HAS_KEY',
  action: 'UP',
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
    const puzzle = buildPuzzle([
      moveUpBlock,
      moveRightBlock,
      createRepeatBlockTemplate(2, [moveUpBlock]),
    ]);

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
    const puzzle = buildPuzzle([
      moveUpBlock,
      moveRightBlock,
      ifPathRightBlock,
      createWhileBlockTemplate('PATH_RIGHT_CLEAR', [moveRightBlock]),
    ]);

    engine.loadPuzzle(puzzle);
    engine.replaceProgram([
      createWhileBlockTemplate('PATH_RIGHT_CLEAR', [
        moveRightBlock,
        moveUpBlock,
      ]),
    ]);

    const snapshot = engine.run();

    expect(snapshot.status).toBe('success');
    expect(snapshot.catPosition).toEqual({ row: 0, col: 4 });
    expect(
      snapshot.log.some((entry) =>
        entry.includes('looping while pathRightClear'),
      ),
    ).toBe(true);
  });

  it('fails a while loop that makes no progress while the condition remains true', () => {
    const engine = new GameEngine();
    const puzzle = buildPuzzle([
      moveRightBlock,
      ifDoorUpBlock,
      ifPathRightBlock,
      createWhileBlockTemplate('PATH_RIGHT_CLEAR', [ifDoorUpBlock]),
    ]);

    engine.loadPuzzle(puzzle);
    engine.replaceProgram([
      createWhileBlockTemplate('PATH_RIGHT_CLEAR', [ifDoorUpBlock]),
    ]);

    const snapshot = engine.run();

    expect(snapshot.status).toBe('error');
    expect(
      snapshot.log.some((entry) => entry.includes('made no progress')),
    ).toBe(true);
  });

  it('executes a user-defined helper and reaches the door', () => {
    const engine = new GameEngine();
    const puzzle = buildPuzzle([
      moveUpBlock,
      moveRightBlock,
      createFunctionDefinitionBlockTemplate('climbStep'),
      createFunctionCallBlockTemplate('climbStep'),
    ]);

    engine.loadPuzzle({
      ...puzzle,
      id: 'functions-test',
      title: 'Functions Test',
      lesson: 'Functions',
      start: { row: 4, col: 0 },
      door: { row: 0, col: 4 },
      requiredConcepts: ['FUNCTION_DEFINITION', 'FUNCTION_CALL'],
    });
    engine.replaceProgram([
      createFunctionDefinitionBlockTemplate('climbStep', [
        moveUpBlock,
        moveRightBlock,
      ]),
      createFunctionCallBlockTemplate('climbStep'),
      createFunctionCallBlockTemplate('climbStep'),
      createFunctionCallBlockTemplate('climbStep'),
      createFunctionCallBlockTemplate('climbStep'),
    ]);

    const snapshot = engine.run();

    expect(snapshot.status).toBe('success');
    expect(snapshot.catPosition).toEqual({ row: 0, col: 4 });
    expect(
      snapshot.log.some((entry) =>
        entry.includes('calling helper climbStep()'),
      ),
    ).toBe(true);
  });

  it('collects a key, satisfies the state requirement, and unlocks the door', () => {
    const engine = new GameEngine();
    const puzzle = buildPuzzle([
      moveUpBlock,
      moveRightBlock,
      ifHasKeyRightBlock,
    ]);

    engine.loadPuzzle({
      ...puzzle,
      id: 'state-test',
      title: 'State Test',
      lesson: 'Variables',
      key: { row: 4, col: 2 },
      door: { row: 1, col: 4 },
      doorRequiresKey: true,
      requiredConcepts: ['STATE_CONDITION'],
      walls: [
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 2, col: 0 },
        { row: 2, col: 1 },
        { row: 2, col: 4 },
        { row: 3, col: 0 },
        { row: 3, col: 1 },
        { row: 3, col: 3 },
        { row: 3, col: 4 },
        { row: 4, col: 3 },
        { row: 4, col: 4 },
      ],
    });
    engine.replaceProgram([
      moveRightBlock,
      moveRightBlock,
      moveUpBlock,
      moveUpBlock,
      moveRightBlock,
      moveUpBlock,
      ifHasKeyRightBlock,
    ]);

    const snapshot = engine.run();

    expect(snapshot.status).toBe('success');
    expect(snapshot.roomState.hasKey).toBe(true);
    expect(snapshot.catPosition).toEqual({ row: 1, col: 4 });
    expect(snapshot.log).toContain('Key collected.');
  });

  it('fails when trying to enter a locked door before the key is collected', () => {
    const engine = new GameEngine();
    const puzzle = buildPuzzle([
      moveUpBlock,
      moveRightBlock,
      moveDownBlock,
      ifHasKeyUpBlock,
    ]);

    engine.loadPuzzle({
      ...puzzle,
      id: 'locked-door-test',
      title: 'Locked Door Test',
      lesson: 'Variables',
      rows: 2,
      cols: 3,
      start: { row: 1, col: 0 },
      key: { row: 0, col: 2 },
      door: { row: 1, col: 1 },
      doorRequiresKey: true,
      walls: [],
    });
    engine.replaceProgram([moveRightBlock]);

    const snapshot = engine.run();

    expect(snapshot.status).toBe('error');
    expect(
      snapshot.log.some((entry) =>
        entry.includes('the exit door is locked until the key is collected'),
      ),
    ).toBe(true);
  });

  it('rejects a state puzzle solution that only includes dead hasKey code', () => {
    const engine = new GameEngine();
    const puzzle = stateWorldPuzzles.find(
      (entry) => entry.id === 'signal-lane',
    );

    expect(puzzle).toBeDefined();

    engine.loadPuzzle(puzzle!);
    engine.replaceProgram([
      ifHasKeyRightBlock,
      moveRightBlock,
      moveRightBlock,
      moveUpBlock,
      moveUpBlock,
      moveRightBlock,
      moveUpBlock,
      moveRightBlock,
    ]);

    const snapshot = engine.run();

    expect(snapshot.status).toBe('error');
    expect(
      snapshot.log.some((entry) =>
        entry.includes('hasKey check to control a real move'),
      ),
    ).toBe(true);
  });

  it('solves the authored checkpoint-cache puzzle with a meaningful hasKey move', () => {
    const engine = new GameEngine();
    const puzzle = stateWorldPuzzles.find(
      (entry) => entry.id === 'checkpoint-cache',
    );

    expect(puzzle).toBeDefined();

    engine.loadPuzzle(puzzle!);
    engine.replaceProgram([
      moveUpBlock,
      moveUpBlock,
      moveRightBlock,
      moveRightBlock,
      moveDownBlock,
      moveRightBlock,
      moveUpBlock,
      moveUpBlock,
      moveUpBlock,
      ifHasKeyUpBlock,
    ]);

    const snapshot = engine.run();

    expect(snapshot.status).toBe('success');
    expect(snapshot.roomState.hasKey).toBe(true);
    expect(snapshot.didReachDoor).toBe(true);
  });
});
