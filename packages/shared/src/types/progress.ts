export enum CompletionStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface IPlayerProgress {
  id: string;
  userId: string;
  levelId: string;
  puzzleId: string;
  status: CompletionStatus;
  attempts: number;
  timeSpent: number;
  lastUpdated: string;
}
