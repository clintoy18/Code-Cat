import type { CompletionStatus } from '@prisma/client';
import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';

export const progressService = {
  async saveProgress(userId: string, payload: {
    levelId: string;
    puzzleId: string;
    status: CompletionStatus;
    attempts: number;
    timeSpent: number;
  }) {
    return prisma.playerProgress.upsert({
      where: {
        userId_levelId_puzzleId: {
          userId,
          levelId: payload.levelId,
          puzzleId: payload.puzzleId,
        },
      },
      update: {
        status: payload.status,
        attempts: payload.attempts,
        timeSpent: payload.timeSpent,
      },
      create: {
        userId,
        levelId: payload.levelId,
        puzzleId: payload.puzzleId,
        status: payload.status,
        attempts: payload.attempts,
        timeSpent: payload.timeSpent,
      },
    });
  },

  async getMyProgress(userId: string) {
    return prisma.playerProgress.findMany({
      where: { userId },
      orderBy: { lastUpdated: 'desc' },
    });
  },

  async getMyLevelProgress(userId: string, levelId: string) {
    const entries = await prisma.playerProgress.findMany({
      where: { userId, levelId },
      orderBy: { lastUpdated: 'desc' },
    });

    if (!entries.length) {
      throw new AppError('NOT_FOUND', 'No progress found for this level.', 404);
    }

    return entries;
  },
};
