import type { IBlockTemplate, IPuzzleDefinition } from '@/features/game/engine';
import type { ICurriculumWorld } from '../lessonRoadmap';

const moveUpBlock: IBlockTemplate = { key: 'move-up', label: 'moveUp()', kind: 'MOVE', move: 'UP' };
const moveRightBlock: IBlockTemplate = { key: 'move-right', label: 'moveRight()', kind: 'MOVE', move: 'RIGHT' };
const moveDownBlock: IBlockTemplate = { key: 'move-down', label: 'moveDown()', kind: 'MOVE', move: 'DOWN' };
const moveLeftBlock: IBlockTemplate = { key: 'move-left', label: 'moveLeft()', kind: 'MOVE', move: 'LEFT' };

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

const ifPathLeftBlock: IBlockTemplate = {
  key: 'if-path-left',
  label: 'if (pathLeftClear) moveLeft()',
  kind: 'CONDITIONAL',
  condition: 'PATH_LEFT_CLEAR',
  action: 'LEFT',
};

const ifDoorUpBlock: IBlockTemplate = {
  key: 'if-door-up',
  label: 'if (doorUp) moveUp()',
  kind: 'CONDITIONAL',
  condition: 'DOOR_UP',
  action: 'UP',
};

export const strategyWorldPuzzles: IPuzzleDefinition[] = [
  {
    id: 'perimeter-plan',
    title: 'Perimeter Plan',
    lesson: 'Strategy',
    difficulty: 'Hard',
    parMoves: 11,
    objective: 'This future capstone room asks learners to compare whole-board routes and commit to the strongest plan.',
    rows: 6,
    cols: 7,
    start: { row: 5, col: 0 },
    door: { row: 0, col: 6 },
    walls: [
      { row: 4, col: 1 },
      { row: 4, col: 2 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
      { row: 4, col: 5 },
      { row: 3, col: 1 },
      { row: 3, col: 5 },
      { row: 2, col: 1 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 2, col: 5 },
      { row: 1, col: 1 },
      { row: 1, col: 5 },
    ],
    availableBlocks: [moveUpBlock, moveRightBlock, moveDownBlock, moveLeftBlock],
  },
  {
    id: 'switchback-budget',
    title: 'Switchback Budget',
    lesson: 'Strategy',
    difficulty: 'Hard',
    parMoves: 10,
    objective: 'Students will eventually break this maze into subgoals and compare route budgets rather than guessing turns.',
    rows: 6,
    cols: 6,
    start: { row: 5, col: 1 },
    door: { row: 0, col: 4 },
    walls: [
      { row: 5, col: 0 },
      { row: 5, col: 2 },
      { row: 4, col: 0 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
      { row: 3, col: 0 },
      { row: 3, col: 1 },
      { row: 3, col: 4 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 4 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 5 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ],
    availableBlocks: [moveUpBlock, moveRightBlock, moveLeftBlock, ifPathUpBlock, ifPathRightBlock, ifPathLeftBlock, ifDoorUpBlock],
  },
  {
    id: 'false-shortcut',
    title: 'False Shortcut',
    lesson: 'Strategy',
    difficulty: 'Hard',
    parMoves: 10,
    objective: 'This roadmap room is built to teach that the nearest-looking opening is not always the best algorithmic choice.',
    rows: 6,
    cols: 7,
    start: { row: 5, col: 0 },
    door: { row: 0, col: 5 },
    walls: [
      { row: 5, col: 1 },
      { row: 4, col: 1 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 5 },
      { row: 2, col: 6 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 1, col: 6 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
    ],
    availableBlocks: [moveUpBlock, moveRightBlock, ifPathUpBlock, ifPathRightBlock, ifDoorUpBlock],
  },
];

export const strategyWorld: ICurriculumWorld = {
  id: 'strategy',
  order: 6,
  title: 'World 6: Strategy',
  shortLabel: 'Strategy',
  focus: ['Strategy'],
  description: 'Students combine all earlier concepts and start thinking about optimization, alternatives, and algorithmic choices.',
  studentOutcome: 'Learners compare routes, reason about tradeoffs, and prepare for search and pathfinding lessons.',
  agentOwner: 'Agent Strategy',
  status: 'scaffolded',
  currentMechanics: ['Par targets', 'Condition checks'],
  futureMechanics: ['Collectibles', 'Enemy patrols', 'Shortest-path challenges'],
  puzzles: strategyWorldPuzzles,
};
