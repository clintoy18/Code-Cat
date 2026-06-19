import type { IBlockTemplate, IPuzzleDefinition } from '@/features/game/engine';
import type { ICurriculumWorld } from '../lessonRoadmap';

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
const moveLeftBlock: IBlockTemplate = {
  key: 'move-left',
  label: 'moveLeft()',
  kind: 'MOVE',
  move: 'LEFT',
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

export const stateWorldPuzzles: IPuzzleDefinition[] = [
  {
    id: 'signal-lane',
    title: 'Signal Lane',
    lesson: 'Variables',
    difficulty: 'Medium',
    parMoves: 7,
    objective:
      'Collect the key first, then use a hasKey check for the final door move.',
    rows: 5,
    cols: 5,
    start: { row: 4, col: 0 },
    key: { row: 4, col: 2 },
    door: { row: 1, col: 4 },
    doorRequiresKey: true,
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
    availableBlocks: [moveUpBlock, moveRightBlock, ifHasKeyRightBlock],
    requiredConcepts: ['STATE_CONDITION'],
  },
  {
    id: 'checkpoint-cache',
    title: 'Checkpoint Cache',
    lesson: 'Variables',
    difficulty: 'Hard',
    parMoves: 10,
    objective:
      'Detour for the key, then rely on hasKey before the last climb into the locked door.',
    rows: 6,
    cols: 6,
    start: { row: 5, col: 1 },
    key: { row: 4, col: 4 },
    door: { row: 0, col: 4 },
    doorRequiresKey: true,
    walls: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 0, col: 5 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 1, col: 5 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 2, col: 5 },
      { row: 3, col: 0 },
      { row: 3, col: 5 },
      { row: 4, col: 0 },
      { row: 4, col: 2 },
      { row: 4, col: 5 },
      { row: 5, col: 0 },
      { row: 5, col: 2 },
      { row: 5, col: 3 },
      { row: 5, col: 4 },
      { row: 5, col: 5 },
    ],
    availableBlocks: [
      moveUpBlock,
      moveRightBlock,
      moveDownBlock,
      ifHasKeyUpBlock,
    ],
    requiredConcepts: ['STATE_CONDITION'],
  },
];

export const stateWorldFuturePuzzles: IPuzzleDefinition[] = [
  {
    id: 'memory-ribbon',
    title: 'Memory Ribbon',
    lesson: 'Variables',
    difficulty: 'Hard',
    parMoves: 11,
    objective:
      'This follow-up room is reserved for richer state work like switches, multiple flags, or longer guarded routes.',
    rows: 6,
    cols: 7,
    start: { row: 5, col: 2 },
    key: { row: 3, col: 5 },
    door: { row: 0, col: 5 },
    doorRequiresKey: true,
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
    availableBlocks: [
      moveUpBlock,
      moveRightBlock,
      moveLeftBlock,
      ifHasKeyRightBlock,
      ifHasKeyUpBlock,
    ],
    requiredConcepts: ['STATE_CONDITION'],
  },
];

export const stateWorld: ICurriculumWorld = {
  id: 'state',
  order: 5,
  title: 'World 5: Variables & State',
  shortLabel: 'State',
  focus: ['Variables'],
  description:
    'Students move from pure routing to remembering whether something changed in the room.',
  studentOutcome:
    'Learners understand that collecting a key can change which moves are valid next.',
  agentOwner: 'Agent State',
  status: 'playable',
  currentMechanics: ['Key collection', 'Locked doors', 'hasKey conditions'],
  futureMechanics: ['Multiple flags', 'Switch states', 'Flags like bridgeOpen'],
  puzzles: stateWorldPuzzles,
};
