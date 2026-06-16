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

const ifPathRightBlock: IBlockTemplate = {
  key: 'if-path-right',
  label: 'if (pathRightClear) moveRight()',
  kind: 'CONDITIONAL',
  condition: 'PATH_RIGHT_CLEAR',
  action: 'RIGHT',
};

const ifDoorUpBlock: IBlockTemplate = {
  key: 'if-door-up',
  label: 'if (doorUp) moveUp()',
  kind: 'CONDITIONAL',
  condition: 'DOOR_UP',
  action: 'UP',
};

const ifDoorRightBlock: IBlockTemplate = {
  key: 'if-door-right',
  label: 'if (doorRight) moveRight()',
  kind: 'CONDITIONAL',
  condition: 'DOOR_RIGHT',
  action: 'RIGHT',
};

export const decisionsWorldPuzzles: IPuzzleDefinition[] = [
  {
    id: 'hedge-check',
    title: 'Hedge Check',
    lesson: 'Conditionals',
    difficulty: 'Easy',
    parMoves: 6,
    objective: 'Climb until the opening appears, then let the conditional turn the cat right into the door.',
    rows: 5,
    cols: 3,
    start: { row: 4, col: 0 },
    door: { row: 0, col: 2 },
    walls: [
      { row: 4, col: 1 },
      { row: 3, col: 1 },
      { row: 2, col: 1 },
      { row: 1, col: 1 },
    ],
    availableBlocks: [moveUpBlock, ifPathRightBlock],
  },
  {
    id: 'door-peek',
    title: 'Door Peek',
    lesson: 'Conditionals',
    difficulty: 'Medium',
    parMoves: 5,
    objective: 'March along the hallway and use a door check only when the exit is directly above the cat.',
    rows: 4,
    cols: 5,
    start: { row: 3, col: 0 },
    door: { row: 2, col: 4 },
    walls: [
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
    ],
    availableBlocks: [moveRightBlock, ifDoorUpBlock],
  },
  {
    id: 'truthy-turn',
    title: 'Truthy Turn',
    lesson: 'Conditionals',
    difficulty: 'Hard',
    parMoves: 7,
    objective: 'Use one path check to find the ladder lane, then use a door check to step into the final room at exactly the right spot.',
    rows: 5,
    cols: 5,
    start: { row: 4, col: 0 },
    door: { row: 1, col: 4 },
    walls: [
      { row: 3, col: 0 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 2, col: 1 },
    ],
    availableBlocks: [moveUpBlock, moveRightBlock, moveLeftBlock, ifPathUpBlock, ifDoorRightBlock],
  },
];

export const decisionsWorld: ICurriculumWorld = {
  id: 'decisions',
  order: 2,
  title: 'World 2: Decisions',
  shortLabel: 'Decisions',
  focus: ['Conditionals', 'Boolean Logic'],
  description: 'Early logic puzzles that teach students to treat path and door checks as true-or-false signals before moving.',
  studentOutcome: 'Students can use simple conditionals to branch at the right time and reason about when a check should be true or false.',
  agentOwner: 'Agent Decisions',
  status: 'playable',
  currentMechanics: ['Path checks', 'Door checks', 'Conditional movement', 'True or false reasoning'],
  futureMechanics: ['Compound boolean logic', 'Loops', 'Functions', 'Variables'],
  puzzles: decisionsWorldPuzzles,
};
