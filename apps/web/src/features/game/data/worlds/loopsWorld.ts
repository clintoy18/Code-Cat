import type { ICurriculumWorld } from '@/features/game/data/lessonRoadmap';

export const loopsWorldPuzzles = [
  {
    id: 'stair-repeat',
    title: 'Stair Repeat',
    lesson: 'Loops',
    difficulty: 'Medium',
    parMoves: 8,
    objective: 'This board is designed for a future repeat block because the cat climbs the same stair pattern three times.',
    rows: 6,
    cols: 6,
    start: { row: 5, col: 0 },
    door: { row: 0, col: 5 },
    walls: [
      { row: 5, col: 2 },
      { row: 4, col: 2 },
      { row: 3, col: 4 },
      { row: 2, col: 4 },
    ],
    availableBlocks: [
      { key: 'move-up', label: 'moveUp()', kind: 'MOVE', move: 'UP' },
      { key: 'move-right', label: 'moveRight()', kind: 'MOVE', move: 'RIGHT' },
      { key: 'move-left', label: 'moveLeft()', kind: 'MOVE', move: 'LEFT' },
    ],
  },
  {
    id: 'frozen-march',
    title: 'Frozen March',
    lesson: 'Loops',
    difficulty: 'Medium',
    parMoves: 10,
    objective: 'The room repeats the same four-step lane, making it a natural candidate for repeat(n).',
    rows: 6,
    cols: 7,
    start: { row: 5, col: 0 },
    door: { row: 0, col: 6 },
    walls: [
      { row: 4, col: 1 },
      { row: 4, col: 3 },
      { row: 4, col: 5 },
      { row: 2, col: 2 },
      { row: 2, col: 4 },
    ],
    availableBlocks: [
      { key: 'move-up', label: 'moveUp()', kind: 'MOVE', move: 'UP' },
      { key: 'move-right', label: 'moveRight()', kind: 'MOVE', move: 'RIGHT' },
      { key: 'move-left', label: 'moveLeft()', kind: 'MOVE', move: 'LEFT' },
    ],
  },
] as const;

export const loopsWorld: ICurriculumWorld = {
  id: 'loops',
  order: 3,
  title: 'World 3: Loops',
  shortLabel: 'Loops',
  focus: ['Loops'],
  description: 'Students start recognizing repeated path segments and learn when a loop can replace copied commands.',
  studentOutcome: 'Learners identify patterns and prepare to express repetition as a compact instruction.',
  agentOwner: 'Agent Loops',
  status: 'scaffolded',
  currentMechanics: ['Patterned boards', 'Move counting'],
  futureMechanics: ['repeat(n)', 'while(condition)', 'Loop trace view'],
  puzzles: [...loopsWorldPuzzles],
};
