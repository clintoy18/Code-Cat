import type { ICurriculumWorld } from '@/features/game/data/lessonRoadmap';

export const functionsWorldPuzzles = [
  {
    id: 'helper-hall',
    title: 'Helper Hall',
    lesson: 'Functions',
    difficulty: 'Medium',
    parMoves: 8,
    objective: 'This room repeats the same side hall twice and is intended for a future helper like goToDoorway().',
    rows: 6,
    cols: 6,
    start: { row: 5, col: 1 },
    door: { row: 0, col: 4 },
    walls: [
      { row: 4, col: 2 },
      { row: 3, col: 2 },
      { row: 2, col: 4 },
      { row: 1, col: 1 },
    ],
    availableBlocks: [
      { key: 'move-up', label: 'moveUp()', kind: 'MOVE', move: 'UP' },
      { key: 'move-right', label: 'moveRight()', kind: 'MOVE', move: 'RIGHT' },
      { key: 'move-left', label: 'moveLeft()', kind: 'MOVE', move: 'LEFT' },
    ],
  },
  {
    id: 'reuse-ridge',
    title: 'Reuse Ridge',
    lesson: 'Functions',
    difficulty: 'Hard',
    parMoves: 9,
    objective: 'Students will eventually define a reusable route helper to cross both ridges with less repeated code.',
    rows: 7,
    cols: 7,
    start: { row: 6, col: 0 },
    door: { row: 0, col: 6 },
    walls: [
      { row: 5, col: 1 },
      { row: 4, col: 1 },
      { row: 3, col: 3 },
      { row: 2, col: 3 },
      { row: 1, col: 5 },
    ],
    availableBlocks: [
      { key: 'move-up', label: 'moveUp()', kind: 'MOVE', move: 'UP' },
      { key: 'move-right', label: 'moveRight()', kind: 'MOVE', move: 'RIGHT' },
      { key: 'move-left', label: 'moveLeft()', kind: 'MOVE', move: 'LEFT' },
      {
        key: 'if-path-right',
        label: 'if (pathRightClear) moveRight()',
        kind: 'CONDITIONAL',
        condition: 'PATH_RIGHT_CLEAR',
        action: 'RIGHT',
      },
    ],
  },
] as const;

export const functionsWorld: ICurriculumWorld = {
  id: 'functions',
  order: 4,
  title: 'World 4: Functions',
  shortLabel: 'Functions',
  focus: ['Functions'],
  description: 'Students begin bundling repeated solutions into named helpers they can reuse across rooms.',
  studentOutcome: 'Learners understand that a named helper can represent a trusted route pattern and reduce clutter.',
  agentOwner: 'Agent Functions',
  status: 'scaffolded',
  currentMechanics: ['Pattern recognition', 'Named route prompts'],
  futureMechanics: ['Custom helper definitions', 'Parameter slots', 'Reusable command trays'],
  puzzles: [...functionsWorldPuzzles],
};
