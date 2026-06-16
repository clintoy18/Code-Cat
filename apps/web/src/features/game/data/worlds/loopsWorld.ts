import type { IBlockTemplate, IPuzzleDefinition } from '@/features/game/engine';
import type { ICurriculumWorld } from '../lessonRoadmap';

const moveUpBlock: IBlockTemplate = { key: 'move-up', label: 'moveUp()', kind: 'MOVE', move: 'UP' };
const moveRightBlock: IBlockTemplate = { key: 'move-right', label: 'moveRight()', kind: 'MOVE', move: 'RIGHT' };
const moveLeftBlock: IBlockTemplate = { key: 'move-left', label: 'moveLeft()', kind: 'MOVE', move: 'LEFT' };

const ifPathUpBlock: IBlockTemplate = {
  key: 'if-path-up',
  label: 'if (pathUpClear) moveUp()',
  kind: 'CONDITIONAL',
  condition: 'PATH_UP_CLEAR',
  action: 'UP',
};

const repeatBlock: IBlockTemplate = {
  key: 'repeat-loop',
  label: 'repeat(n) command',
  kind: 'LOOP',
  repeatCount: 2,
  loopBody: {
    label: 'moveUp()',
    kind: 'MOVE',
    move: 'UP',
  },
};

export const loopsWorldPuzzles: IPuzzleDefinition[] = [
  {
    id: 'terrace-repeat',
    title: 'Terrace Repeat',
    lesson: 'Loops',
    difficulty: 'Easy',
    parMoves: 4,
    objective: 'Use repeat blocks to climb four tiles, then sprint four tiles to the exit without copying each step by hand.',
    rows: 5,
    cols: 5,
    start: { row: 4, col: 0 },
    door: { row: 0, col: 4 },
    walls: [],
    availableBlocks: [moveUpBlock, moveRightBlock, repeatBlock],
  },
  {
    id: 'checkpoint-climb',
    title: 'Checkpoint Climb',
    lesson: 'Loops',
    difficulty: 'Medium',
    parMoves: 6,
    objective: 'Repeat a safe climb, then turn across the top lane. This is the first room built around looped movement.',
    rows: 6,
    cols: 5,
    start: { row: 5, col: 0 },
    door: { row: 0, col: 4 },
    walls: [
      { row: 5, col: 1 },
      { row: 4, col: 1 },
      { row: 3, col: 1 },
      { row: 2, col: 1 },
    ],
    availableBlocks: [moveUpBlock, moveRightBlock, repeatBlock],
  },
  {
    id: 'guarded-rhythm',
    title: 'Guarded Rhythm',
    lesson: 'Loops',
    difficulty: 'Medium',
    parMoves: 6,
    objective: 'Repeat a conditional climb until the cat reaches the top lane, then finish the route with direct movement.',
    rows: 5,
    cols: 5,
    start: { row: 4, col: 1 },
    door: { row: 0, col: 4 },
    walls: [
      { row: 4, col: 2 },
      { row: 3, col: 2 },
      { row: 2, col: 2 },
      { row: 1, col: 2 },
    ],
    availableBlocks: [moveRightBlock, moveLeftBlock, ifPathUpBlock, repeatBlock],
  },
];

export const loopsWorld: ICurriculumWorld = {
  id: 'loops',
  order: 3,
  title: 'World 3: Loops',
  shortLabel: 'Loops',
  focus: ['Loops'],
  description: 'Students stop copy-pasting moves and start expressing repetition as a single instruction.',
  studentOutcome: 'Learners can use repeat blocks to compress repeated movement and understand why loops reduce route noise.',
  agentOwner: 'Agent Loops',
  status: 'playable',
  currentMechanics: ['repeat(n) single-command loops', 'Loop-aware code mode', 'Repeated movement patterns'],
  futureMechanics: ['Multi-line loop bodies', 'while(condition)', 'Nested loops'],
  puzzles: loopsWorldPuzzles,
};
