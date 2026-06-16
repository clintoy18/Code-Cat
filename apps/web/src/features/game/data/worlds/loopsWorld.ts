import type { IBlockTemplate, IPuzzleDefinition } from '@/features/game/engine';
import { createRepeatBlockTemplate, createWhileBlockTemplate } from '@/features/game/engine';
import type { ICurriculumWorld } from '../lessonRoadmap';

const moveUpBlock: IBlockTemplate = { key: 'move-up', label: 'moveUp()', kind: 'MOVE', move: 'UP' };
const moveRightBlock: IBlockTemplate = { key: 'move-right', label: 'moveRight()', kind: 'MOVE', move: 'RIGHT' };

const ifPathUpBlock: IBlockTemplate = {
  key: 'if-path-up',
  label: 'if (pathUpClear) moveUp()',
  kind: 'CONDITIONAL',
  condition: 'PATH_UP_CLEAR',
  action: 'UP',
};

const ifPathRightBlock: IBlockTemplate = {
  key: 'if-path-right',
  label: 'if (pathRightClear) moveRight()',
  kind: 'CONDITIONAL',
  condition: 'PATH_RIGHT_CLEAR',
  action: 'RIGHT',
};

const repeatTemplate = createRepeatBlockTemplate(2, [moveUpBlock]);
const whileTemplate = createWhileBlockTemplate('PATH_UP_CLEAR', [moveUpBlock]);

export const loopsWorldPuzzles: IPuzzleDefinition[] = [
  {
    id: 'terrace-repeat',
    title: 'Terrace Repeat',
    lesson: 'Loops',
    difficulty: 'Easy',
    parMoves: 2,
    objective: 'Build two multi-line repeat blocks so the cat climbs the terrace and then slides across the top lane without eight separate commands.',
    rows: 5,
    cols: 5,
    start: { row: 4, col: 0 },
    door: { row: 0, col: 4 },
    walls: [],
    availableBlocks: [moveUpBlock, moveRightBlock, repeatTemplate],
  },
  {
    id: 'switchback-scan',
    title: 'Switchback Scan',
    lesson: 'Loops',
    difficulty: 'Medium',
    parMoves: 1,
    objective: 'Use a while loop with a multi-step body to keep advancing while the right lane stays open.',
    rows: 5,
    cols: 5,
    start: { row: 4, col: 0 },
    door: { row: 0, col: 4 },
    walls: [],
    availableBlocks: [moveUpBlock, moveRightBlock, ifPathRightBlock, whileTemplate],
  },
  {
    id: 'echo-ramp',
    title: 'Echo Ramp',
    lesson: 'Loops',
    difficulty: 'Hard',
    parMoves: 1,
    objective: 'Nest repeat blocks so one outer plan reuses the same climb-and-cross pattern twice to reach the exit.',
    rows: 5,
    cols: 5,
    start: { row: 4, col: 0 },
    door: { row: 0, col: 4 },
    walls: [],
    availableBlocks: [moveUpBlock, moveRightBlock, ifPathUpBlock, repeatTemplate, whileTemplate],
  },
];

export const loopsWorld: ICurriculumWorld = {
  id: 'loops',
  order: 3,
  title: 'World 3: Loops',
  shortLabel: 'Loops',
  focus: ['Loops'],
  description: 'Students graduate from flat repetition to structured loop bodies, condition-driven repetition, and nested control flow.',
  studentOutcome: 'Learners can write multi-step repeat blocks, reason about while-loop exit conditions, and read nested loop structures without losing the route.',
  agentOwner: 'Agent Loops',
  status: 'playable',
  currentMechanics: ['Multi-line repeat bodies', 'while(condition) loops', 'Nested loops', 'Loop-aware code mode'],
  futureMechanics: ['Loop optimization challenges', 'Helper extraction into functions', 'State-aware loop exits'],
  puzzles: loopsWorldPuzzles,
};
