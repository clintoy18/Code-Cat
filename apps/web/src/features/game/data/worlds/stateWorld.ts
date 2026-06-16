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

const ifDoorRightBlock: IBlockTemplate = {
  key: 'if-door-right',
  label: 'if (doorRight) moveRight()',
  kind: 'CONDITIONAL',
  condition: 'DOOR_RIGHT',
  action: 'RIGHT',
};

const ifDoorUpBlock: IBlockTemplate = {
  key: 'if-door-up',
  label: 'if (doorUp) moveUp()',
  kind: 'CONDITIONAL',
  condition: 'DOOR_UP',
  action: 'UP',
};

export const stateWorldPuzzles: IPuzzleDefinition[] = [
  {
    id: 'signal-lane',
    title: 'Signal Lane',
    lesson: 'Variables',
    difficulty: 'Medium',
    parMoves: 8,
    objective: 'This roadmap room stands in for future hasKey or signal flags by forcing careful checkpoint-style decisions.',
    rows: 5,
    cols: 5,
    start: { row: 4, col: 0 },
    door: { row: 0, col: 4 },
    walls: [
      { row: 4, col: 1 },
      { row: 3, col: 1 },
      { row: 3, col: 3 },
      { row: 2, col: 3 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 3 },
    ],
    availableBlocks: [moveUpBlock, moveRightBlock, ifPathUpBlock, ifPathRightBlock],
  },
  {
    id: 'checkpoint-cache',
    title: 'Checkpoint Cache',
    lesson: 'Variables',
    difficulty: 'Hard',
    parMoves: 9,
    objective: 'Treat each bend like a stored checkpoint while the roadmap waits for true variable support.',
    rows: 6,
    cols: 6,
    start: { row: 5, col: 1 },
    door: { row: 0, col: 4 },
    walls: [
      { row: 5, col: 0 },
      { row: 5, col: 2 },
      { row: 4, col: 0 },
      { row: 4, col: 3 },
      { row: 3, col: 0 },
      { row: 3, col: 1 },
      { row: 3, col: 3 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 5 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 1, col: 5 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ],
    availableBlocks: [moveUpBlock, moveRightBlock, ifPathUpBlock, ifPathRightBlock, ifDoorUpBlock],
  },
  {
    id: 'memory-ribbon',
    title: 'Memory Ribbon',
    lesson: 'Variables',
    difficulty: 'Hard',
    parMoves: 10,
    objective: 'This layout is built for future state flags, but today it previews that thinking through guarded turns and door checks.',
    rows: 6,
    cols: 7,
    start: { row: 5, col: 2 },
    door: { row: 0, col: 5 },
    walls: [
      { row: 5, col: 1 },
      { row: 5, col: 3 },
      { row: 4, col: 1 },
      { row: 4, col: 4 },
      { row: 4, col: 5 },
      { row: 3, col: 1 },
      { row: 3, col: 4 },
      { row: 2, col: 1 },
      { row: 2, col: 5 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 1, col: 6 },
      { row: 0, col: 1 },
      { row: 0, col: 3 },
    ],
    availableBlocks: [moveUpBlock, moveRightBlock, moveLeftBlock, ifPathUpBlock, ifPathRightBlock, ifDoorRightBlock],
  },
];

export const stateWorld: ICurriculumWorld = {
  id: 'state',
  order: 5,
  title: 'World 5: Variables & State',
  shortLabel: 'State',
  focus: ['Variables'],
  description: 'Students move from pure routing to remembering whether something changed in the room.',
  studentOutcome: 'Learners understand that the cat may need to react differently after collecting an item or flipping a switch.',
  agentOwner: 'Agent State',
  status: 'scaffolded',
  currentMechanics: ['Route planning', 'Conditional checks'],
  futureMechanics: ['Keys', 'Switch states', 'Flags like hasKey or bridgeOpen'],
  puzzles: stateWorldPuzzles,
};
