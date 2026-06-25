import { Difficulty } from '@shared/types/level';
import type {
  AssignmentTargetType,
  RoomLifecycleStatus} from '@shared/types/teacher';
import {
  type IClassroom,
  type IClassroomAssignment,
  type IPosition,
  type IRoomManifestItem,
  type IStudentAssignmentRoomProgress,
  type ITeacherRoomDefinition,
  type ITeacherRoomVersion,
  type TeacherRoomSource,
} from '@shared/types/teacher';
import type { CompletionStatus } from '@shared/types/progress';
import { AppError } from '@/middleware/errorHandler';

type ClassroomRecord = {
  id: string;
  teacherId: string;
  name: string;
  description: string;
  isPrivate: boolean;
  requiresApproval: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    enrollments: number;
    assignments: number;
  };
};

type RoomVersionRecord = {
  id: string;
  teacherId: string;
  versionGroupId: string;
  versionNumber: number;
  title: string;
  description: string;
  lessonTag: string;
  objective: string;
  difficulty: Difficulty | `${Difficulty}`;
  parMoves: number;
  codeBudget: number;
  lifecycleStatus: RoomLifecycleStatus | `${RoomLifecycleStatus}`;
  definition: unknown;
  isLatest: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type AssignmentRecord = {
  id: string;
  classroomId: string;
  teacherId: string;
  targetType: AssignmentTargetType | `${AssignmentTargetType}`;
  title: string;
  description: string | null;
  startAt: Date;
  dueAt: Date | null;
  officialWorldId: string | null;
  officialPuzzleId: string | null;
  customRoomVersionId: string | null;
  roomManifest: unknown;
  createdAt: Date;
  updatedAt: Date;
};

type AssignmentProgressRecord = {
  id: string;
  assignmentId: string;
  classroomId: string;
  studentId: string;
  roomKey: string;
  roomTitle: string;
  roomSource: string;
  status: CompletionStatus | `${CompletionStatus}`;
  attempts: number;
  failures: number;
  totalTimeSpent: number;
  latestMovesUsed: number | null;
  bestMovesUsed: number | null;
  latestBlocksUsed: number | null;
  bestBlocksUsed: number | null;
  latestScore: number | null;
  bestScore: number | null;
  latestLetterGrade: string | null;
  bestLetterGrade: string | null;
  lastPlayedAt: Date | null;
  solvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const difficultyMap: Record<Difficulty, ITeacherRoomVersion['difficulty']> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

const inverseDifficultyMap: Record<ITeacherRoomVersion['difficulty'], Difficulty> = {
  Easy: Difficulty.EASY,
  Medium: Difficulty.MEDIUM,
  Hard: Difficulty.HARD,
};

export const toPrismaDifficulty = (difficulty: ITeacherRoomVersion['difficulty']): Difficulty =>
  inverseDifficultyMap[difficulty];

export const fromPrismaDifficulty = (
  difficulty: Difficulty | 'EASY' | 'MEDIUM' | 'HARD',
): ITeacherRoomVersion['difficulty'] => difficultyMap[difficulty as Difficulty];

export const toLetterGrade = (score: number | null) => {
  if (score === null) {
    return null;
  }

  if (score >= 90) {
    return 'A';
  }

  if (score >= 80) {
    return 'B';
  }

  if (score >= 70) {
    return 'C';
  }

  if (score >= 60) {
    return 'D';
  }

  return 'F';
};

export const averageScores = (scores: number[]) => {
  if (!scores.length) {
    return null;
  }

  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
};

export const calculateRoomScore = (input: {
  didComplete: boolean;
  movesUsed: number;
  parMoves: number;
  blocksUsed: number;
  codeBudget: number;
  failuresBeforeSuccess: number;
}) => {
  if (!input.didComplete) {
    return {
      score: 0,
      letterGrade: 'F',
    };
  }

  const completionScore = 40;
  const efficiencyScore = Math.round(
    25 * Math.min(1, input.parMoves / Math.max(1, input.movesUsed)),
  );
  const codeQualityScore = Math.round(
    25 * Math.min(1, input.codeBudget / Math.max(1, input.blocksUsed)),
  );
  const attemptPenaltyScore = Math.max(0, 10 - Math.min(input.failuresBeforeSuccess, 5) * 2);
  const score = Math.min(100, completionScore + efficiencyScore + codeQualityScore + attemptPenaltyScore);

  return {
    score,
    letterGrade: toLetterGrade(score) ?? 'F',
  };
};

const stringifyDate = (value: Date | null) => value?.toISOString() ?? null;

export const formatClassroom = (classroom: ClassroomRecord): IClassroom => ({
  id: classroom.id,
  teacherId: classroom.teacherId,
  name: classroom.name,
  description: classroom.description,
  isPrivate: classroom.isPrivate,
  requiresApproval: classroom.requiresApproval,
  createdAt: classroom.createdAt.toISOString(),
  updatedAt: classroom.updatedAt.toISOString(),
  enrollmentCount: classroom._count?.enrollments,
  assignmentCount: classroom._count?.assignments,
});

export const parseRoomDefinition = (definition: unknown): ITeacherRoomDefinition =>
  definition as ITeacherRoomDefinition;

export const formatRoomVersion = (roomVersion: RoomVersionRecord): ITeacherRoomVersion => ({
  id: roomVersion.id,
  teacherId: roomVersion.teacherId,
  versionGroupId: roomVersion.versionGroupId,
  versionNumber: roomVersion.versionNumber,
  title: roomVersion.title,
  description: roomVersion.description,
  lessonTag: roomVersion.lessonTag as ITeacherRoomVersion['lessonTag'],
  objective: roomVersion.objective,
  difficulty: fromPrismaDifficulty(roomVersion.difficulty),
  parMoves: roomVersion.parMoves,
  codeBudget: roomVersion.codeBudget,
  lifecycleStatus: roomVersion.lifecycleStatus as RoomLifecycleStatus,
  definition: parseRoomDefinition(roomVersion.definition),
  isLatest: roomVersion.isLatest,
  publishedAt: stringifyDate(roomVersion.publishedAt),
  createdAt: roomVersion.createdAt.toISOString(),
  updatedAt: roomVersion.updatedAt.toISOString(),
});

export const parseRoomManifest = (roomManifest: unknown): IRoomManifestItem[] =>
  roomManifest as IRoomManifestItem[];

export const formatAssignment = (assignment: AssignmentRecord): IClassroomAssignment => ({
  id: assignment.id,
  classroomId: assignment.classroomId,
  teacherId: assignment.teacherId,
  targetType: assignment.targetType as AssignmentTargetType,
  title: assignment.title,
  description: assignment.description,
  startAt: assignment.startAt.toISOString(),
  dueAt: stringifyDate(assignment.dueAt),
  officialWorldId: assignment.officialWorldId,
  officialPuzzleId: assignment.officialPuzzleId,
  customRoomVersionId: assignment.customRoomVersionId,
  roomManifest: parseRoomManifest(assignment.roomManifest),
  createdAt: assignment.createdAt.toISOString(),
  updatedAt: assignment.updatedAt.toISOString(),
});

export const formatAssignmentProgress = (
  progress: AssignmentProgressRecord,
): IStudentAssignmentRoomProgress => ({
  id: progress.id,
  assignmentId: progress.assignmentId,
  classroomId: progress.classroomId,
  studentId: progress.studentId,
  roomKey: progress.roomKey,
  roomTitle: progress.roomTitle,
  roomSource: progress.roomSource as TeacherRoomSource,
  status: progress.status as CompletionStatus,
  attempts: progress.attempts,
  failures: progress.failures,
  totalTimeSpent: progress.totalTimeSpent,
  latestMovesUsed: progress.latestMovesUsed,
  bestMovesUsed: progress.bestMovesUsed,
  latestBlocksUsed: progress.latestBlocksUsed,
  bestBlocksUsed: progress.bestBlocksUsed,
  latestScore: progress.latestScore,
  bestScore: progress.bestScore,
  latestLetterGrade: progress.latestLetterGrade,
  bestLetterGrade: progress.bestLetterGrade,
  lastPlayedAt: stringifyDate(progress.lastPlayedAt),
  solvedAt: stringifyDate(progress.solvedAt),
  createdAt: progress.createdAt.toISOString(),
  updatedAt: progress.updatedAt.toISOString(),
});

export const buildManifestFromCustomRoom = (roomVersion: ITeacherRoomVersion): IRoomManifestItem => ({
  roomKey: roomVersion.id,
  title: roomVersion.title,
  objective: roomVersion.objective,
  lesson: roomVersion.lessonTag,
  difficulty: roomVersion.difficulty,
  parMoves: roomVersion.parMoves,
  codeBudget: roomVersion.codeBudget,
  sourceType: 'CUSTOM_ROOM',
  customRoomVersionId: roomVersion.id,
});

const assertPositionInBounds = (position: IPosition, rows: number, cols: number, label: string) => {
  if (position.row < 0 || position.row >= rows || position.col < 0 || position.col >= cols) {
    throw new AppError('BAD_REQUEST', `${label} must stay within the grid bounds.`, 400);
  }
};

export const validateRoomDefinition = (definition: ITeacherRoomDefinition) => {
  assertPositionInBounds(definition.start, definition.rows, definition.cols, 'Start tile');
  assertPositionInBounds(definition.door, definition.rows, definition.cols, 'Door tile');

  if (definition.key) {
    assertPositionInBounds(definition.key, definition.rows, definition.cols, 'Key tile');
  }

  const seenWalls = new Set<string>();

  definition.walls.forEach((wall) => {
    assertPositionInBounds(wall, definition.rows, definition.cols, 'Wall tile');

    const wallKey = `${wall.row}:${wall.col}`;

    if (seenWalls.has(wallKey)) {
      throw new AppError('BAD_REQUEST', 'Wall coordinates must be unique.', 400);
    }

    seenWalls.add(wallKey);
  });

  const reservedTiles = [
    `${definition.start.row}:${definition.start.col}`,
    `${definition.door.row}:${definition.door.col}`,
    ...(definition.key ? [`${definition.key.row}:${definition.key.col}`] : []),
  ];

  if (reservedTiles.length !== new Set(reservedTiles).size) {
    throw new AppError('BAD_REQUEST', 'Start, door, and key tiles must not overlap.', 400);
  }

  reservedTiles.forEach((tileKey) => {
    if (seenWalls.has(tileKey)) {
      throw new AppError('BAD_REQUEST', 'Walls cannot overlap the start, door, or key tiles.', 400);
    }
  });

  if (!definition.availableBlocks.length) {
    throw new AppError('BAD_REQUEST', 'At least one available block is required.', 400);
  }
};
