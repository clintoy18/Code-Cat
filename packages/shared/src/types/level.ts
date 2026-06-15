export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export interface ILevel {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  order: number;
  createdAt: string;
}
