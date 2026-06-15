export enum PuzzleType {
  SEQUENCING = 'SEQUENCING',
  LOOP = 'LOOP',
  CONDITIONAL = 'CONDITIONAL',
}

export interface IPuzzle {
  id: string;
  levelId: string;
  description: string;
  expectedOutput: string;
  hint: string | null;
  type: PuzzleType;
  order: number;
}
