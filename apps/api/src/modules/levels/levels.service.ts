import type { Difficulty, PuzzleType } from '@prisma/client';
import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';

interface ILevelPayload {
  name: string;
  description: string;
  difficulty: Difficulty;
  order: number;
  puzzles?: Array<{
    description: string;
    expectedOutput: string;
    hint?: string | null;
    type: PuzzleType;
    order: number;
  }>;
}

const levelSelection = {
  id: true,
  name: true,
  description: true,
  difficulty: true,
  order: true,
  createdAt: true,
} as const;

const puzzleSelection = {
  id: true,
  levelId: true,
  description: true,
  expectedOutput: true,
  hint: true,
  type: true,
  order: true,
} as const;

const formatLevel = (level: {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  order: number;
  createdAt: Date;
}) => ({
  ...level,
  createdAt: level.createdAt.toISOString(),
});

export const levelsService = {
  async getLevels() {
    const levels = await prisma.level.findMany({
      orderBy: { order: 'asc' },
      select: levelSelection,
    });

    return levels.map(formatLevel);
  },

  async getLevelById(id: string) {
    const level = await prisma.level.findUnique({
      where: { id },
      select: {
        ...levelSelection,
        puzzles: {
          orderBy: { order: 'asc' },
          select: puzzleSelection,
        },
      },
    });

    if (!level) {
      throw new AppError('NOT_FOUND', 'Level not found.', 404);
    }

    return {
      ...formatLevel(level),
      puzzles: level.puzzles,
    };
  },

  async getLevelPuzzles(id: string) {
    const level = await prisma.level.findUnique({
      where: { id },
      select: {
        id: true,
        puzzles: {
          orderBy: { order: 'asc' },
          select: puzzleSelection,
        },
      },
    });

    if (!level) {
      throw new AppError('NOT_FOUND', 'Level not found.', 404);
    }

    return level.puzzles;
  },

  async createLevel(payload: ILevelPayload) {
    const level = await prisma.level.create({
      data: {
        name: payload.name,
        description: payload.description,
        difficulty: payload.difficulty,
        order: payload.order,
        puzzles: payload.puzzles?.length
          ? {
              create: payload.puzzles.map((puzzle) => ({
                description: puzzle.description,
                expectedOutput: puzzle.expectedOutput,
                hint: puzzle.hint ?? null,
                type: puzzle.type,
                order: puzzle.order,
              })),
            }
          : undefined,
      },
      select: {
        ...levelSelection,
        puzzles: {
          orderBy: { order: 'asc' },
          select: puzzleSelection,
        },
      },
    });

    return {
      ...formatLevel(level),
      puzzles: level.puzzles,
    };
  },

  async updateLevel(id: string, payload: Partial<ILevelPayload>) {
    const existing = await prisma.level.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new AppError('NOT_FOUND', 'Level not found.', 404);
    }

    if (payload.puzzles) {
      await prisma.puzzle.deleteMany({
        where: { levelId: id },
      });
    }

    const level = await prisma.level.update({
      where: { id },
      data: {
        name: payload.name,
        description: payload.description,
        difficulty: payload.difficulty,
        order: payload.order,
        puzzles: payload.puzzles
          ? {
              create: payload.puzzles.map((puzzle) => ({
                description: puzzle.description,
                expectedOutput: puzzle.expectedOutput,
                hint: puzzle.hint ?? null,
                type: puzzle.type,
                order: puzzle.order,
              })),
            }
          : undefined,
      },
      select: {
        ...levelSelection,
        puzzles: {
          orderBy: { order: 'asc' },
          select: puzzleSelection,
        },
      },
    });

    return {
      ...formatLevel(level),
      puzzles: level.puzzles,
    };
  },

  async deleteLevel(id: string) {
    const existing = await prisma.level.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new AppError('NOT_FOUND', 'Level not found.', 404);
    }

    await prisma.level.delete({
      where: { id },
    });

    return {
      deleted: true,
      id,
    };
  },
};
