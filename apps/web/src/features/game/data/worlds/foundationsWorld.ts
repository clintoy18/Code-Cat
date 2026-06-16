import type { IBlockTemplate, IPuzzleDefinition } from '@/features/game/engine';

import type { ICurriculumWorld } from '../lessonRoadmap';

const movementBlocks: IBlockTemplate[] = [
  { key: 'move-up', label: 'moveUp()', kind: 'MOVE', move: 'UP' },
  { key: 'move-right', label: 'moveRight()', kind: 'MOVE', move: 'RIGHT' },
  { key: 'move-down', label: 'moveDown()', kind: 'MOVE', move: 'DOWN' },
  { key: 'move-left', label: 'moveLeft()', kind: 'MOVE', move: 'LEFT' },
];

export const foundationsWorldPuzzles: IPuzzleDefinition[] = [
  {
    id: 'porch-parade',
    title: 'Porch Parade',
    lesson: 'Sequencing',
    difficulty: 'Easy',
    parMoves: 4,
    objective: 'Sequence four moveRight() calls to pad straight across the porch and into the door.',
    rows: 5,
    cols: 5,
    start: { row: 4, col: 0 },
    door: { row: 4, col: 4 },
    walls: [],
    availableBlocks: movementBlocks,
  },
  {
    id: 'lantern-turn',
    title: 'Lantern Turn',
    lesson: 'Sequencing',
    difficulty: 'Easy',
    parMoves: 7,
    objective: 'Read the full route first, then guide the cat through one clean turn around the stacked lanterns.',
    rows: 5,
    cols: 5,
    start: { row: 4, col: 0 },
    door: { row: 0, col: 3 },
    walls: [
      { row: 3, col: 0 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 1, col: 1 },
    ],
    availableBlocks: movementBlocks,
  },
  {
    id: 'warehouse-sprint',
    title: 'Warehouse Sprint',
    lesson: 'Sequencing',
    difficulty: 'Hard',
    parMoves: 9,
    objective: 'Choose the clean outside lane and avoid wasting moves in the cluttered middle of the warehouse.',
    rows: 6,
    cols: 5,
    start: { row: 5, col: 0 },
    door: { row: 0, col: 4 },
    walls: [
      { row: 4, col: 0 },
      { row: 4, col: 1 },
      { row: 4, col: 2 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 1, col: 3 },
    ],
    availableBlocks: movementBlocks,
  },
];

export const foundationsWorld: ICurriculumWorld = {
  id: 'foundations',
  order: 1,
  title: 'World 1: Foundations',
  shortLabel: 'Foundations',
  focus: ['Sequencing', 'Efficiency'],
  description: 'A short three-room movement arc that teaches ordered commands, clean turns, and route discipline.',
  studentOutcome: 'Students can read a cat-grid, write an ordered solution, and choose a cleaner route instead of wandering through extra tiles.',
  agentOwner: 'Agent Foundations',
  status: 'playable',
  currentMechanics: ['Movement blocks', 'Grid navigation', 'Wall avoidance', 'Par move goals'],
  futureMechanics: ['Conditionals', 'Boolean checks', 'Loops', 'Functions'],
  puzzles: foundationsWorldPuzzles,
};
