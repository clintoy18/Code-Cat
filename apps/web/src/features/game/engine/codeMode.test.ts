import { describe, expect, it } from 'vitest';
import {
  createRepeatBlockTemplate,
  createWhileBlockTemplate,
  serializeProgramToCode,
  type IBlockTemplate,
  type IProgramBlock,
  type IPuzzleDefinition,
} from './index';
import { parseProgramCode } from './codeMode';

const moveUpBlock: IBlockTemplate = { key: 'move-up', label: 'moveUp()', kind: 'MOVE', move: 'UP' };
const moveRightBlock: IBlockTemplate = { key: 'move-right', label: 'moveRight()', kind: 'MOVE', move: 'RIGHT' };
const ifPathRightBlock: IBlockTemplate = {
  key: 'if-path-right',
  label: 'if (pathRightClear) moveRight()',
  kind: 'CONDITIONAL',
  condition: 'PATH_RIGHT_CLEAR',
  action: 'RIGHT',
};

const puzzle: IPuzzleDefinition = {
  id: 'loops-parser',
  title: 'Loops Parser',
  lesson: 'Loops',
  difficulty: 'Medium',
  parMoves: 1,
  objective: 'Test loop parsing.',
  rows: 5,
  cols: 5,
  start: { row: 4, col: 0 },
  door: { row: 0, col: 4 },
  walls: [],
  availableBlocks: [
    moveUpBlock,
    moveRightBlock,
    ifPathRightBlock,
    createRepeatBlockTemplate(2, [moveUpBlock]),
    createWhileBlockTemplate('PATH_RIGHT_CLEAR', [moveRightBlock]),
  ],
};

describe('code mode loops', () => {
  it('parses nested repeat and while blocks from multiline code', () => {
    const parseResult = parseProgramCode(
      `repeat(2) {
  moveUp()
  while (pathRightClear) {
    moveRight()
  }
}`,
      puzzle,
    );

    expect(parseResult.success).toBe(true);
    expect(parseResult.blocks).toHaveLength(1);
    expect(parseResult.blocks[0].kind).toBe('REPEAT');
    expect(parseResult.blocks[0].kind === 'REPEAT' && parseResult.blocks[0].loopBody[1]?.kind).toBe('WHILE');
  });

  it('serializes and reparses nested loop structures', () => {
    const program = [
      {
        ...createRepeatBlockTemplate(2, [moveUpBlock, createWhileBlockTemplate('PATH_RIGHT_CLEAR', [moveRightBlock])]),
        id: 'block-0',
      },
    ] satisfies IProgramBlock[];

    const serialized = serializeProgramToCode(program);
    const parseResult = parseProgramCode(serialized, puzzle);

    expect(parseResult.success).toBe(true);
    expect(parseResult.blocks).toEqual(program.map(({ id: _id, ...block }) => block));
  });

  it('rejects malformed loop bodies', () => {
    const parseResult = parseProgramCode(
      `while (pathRightClear) {
  moveRight()`,
      puzzle,
    );

    expect(parseResult.success).toBe(false);
    expect(parseResult.errors.some((entry) => entry.includes('Missing closing brace'))).toBe(true);
  });
});
