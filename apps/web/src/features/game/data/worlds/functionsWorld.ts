import type { ICurriculumWorld } from '@/features/game/data/lessonRoadmap';
import {
  createFunctionCallBlockTemplate,
  createFunctionDefinitionBlockTemplate,
  type IPuzzleDefinition,
} from '@/features/game/engine';

export const functionsWorldPuzzles: IPuzzleDefinition[] = [
  {
    id: 'helper-hall',
    title: 'Helper Hall',
    lesson: 'Functions',
    difficulty: 'Medium',
    parMoves: 7,
    objective:
      'Define climbStep() once, then call it to climb the repeating staircase without rewriting the same route.',
    rows: 6,
    cols: 6,
    start: { row: 5, col: 0 },
    door: { row: 1, col: 4 },
    walls: [
      { row: 5, col: 1 },
      { row: 3, col: 0 },
      { row: 4, col: 2 },
      { row: 2, col: 1 },
      { row: 3, col: 3 },
      { row: 1, col: 2 },
      { row: 2, col: 4 },
    ],
    availableBlocks: [
      { key: 'move-up', label: 'moveUp()', kind: 'MOVE', move: 'UP' },
      { key: 'move-right', label: 'moveRight()', kind: 'MOVE', move: 'RIGHT' },
      createFunctionDefinitionBlockTemplate('climbStep'),
      createFunctionCallBlockTemplate('climbStep'),
    ],
    requiredConcepts: ['FUNCTION_DEFINITION', 'FUNCTION_CALL'],
  },
  {
    id: 'reuse-ridge',
    title: 'Reuse Ridge',
    lesson: 'Functions',
    difficulty: 'Hard',
    parMoves: 9,
    objective:
      'Build ridgeHop() and call it across each stair-step ridge before finishing the final sprint to the door.',
    rows: 7,
    cols: 7,
    start: { row: 6, col: 0 },
    door: { row: 0, col: 6 },
    walls: [
      { row: 6, col: 1 },
      { row: 4, col: 0 },
      { row: 5, col: 2 },
      { row: 4, col: 2 },
      { row: 2, col: 1 },
      { row: 3, col: 3 },
      { row: 2, col: 3 },
      { row: 0, col: 2 },
      { row: 1, col: 4 },
    ],
    availableBlocks: [
      { key: 'move-up', label: 'moveUp()', kind: 'MOVE', move: 'UP' },
      { key: 'move-right', label: 'moveRight()', kind: 'MOVE', move: 'RIGHT' },
      createFunctionDefinitionBlockTemplate('ridgeHop'),
      createFunctionCallBlockTemplate('ridgeHop'),
    ],
    requiredConcepts: ['FUNCTION_DEFINITION', 'FUNCTION_CALL'],
  },
];

export const functionsWorld: ICurriculumWorld = {
  id: 'functions',
  order: 4,
  title: 'World 4: Functions',
  shortLabel: 'Functions',
  focus: ['Functions'],
  description:
    'Students begin bundling repeated solutions into named helpers they can reuse across rooms.',
  studentOutcome:
    'Learners understand that a named helper can represent a trusted route pattern and reduce clutter.',
  agentOwner: 'Agent Functions',
  status: 'playable',
  currentMechanics: [
    'Custom helper definitions',
    'Helper calls',
    'Pattern reuse',
  ],
  futureMechanics: ['Parameter slots', 'Reusable command trays'],
  puzzles: [...functionsWorldPuzzles],
};
