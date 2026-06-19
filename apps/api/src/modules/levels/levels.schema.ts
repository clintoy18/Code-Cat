import { Difficulty } from '@shared/types/level';
import { PuzzleType } from '@shared/types/puzzle';
import { z } from 'zod';
import { objectIdSchema } from '@/lib/objectId';

export const levelIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const createLevelSchema = z.object({
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(500),
  difficulty: z.nativeEnum(Difficulty),
  order: z.number().int().positive(),
  puzzles: z
    .array(
      z.object({
        description: z.string().trim().min(10),
        expectedOutput: z.string().trim().min(1),
        hint: z.string().trim().min(1).nullable().optional(),
        type: z.nativeEnum(PuzzleType),
        order: z.number().int().positive(),
      }),
    )
    .default([]),
});

export const updateLevelSchema = createLevelSchema.partial();
