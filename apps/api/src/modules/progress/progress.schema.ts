import { CompletionStatus } from '@shared/types/progress';
import { z } from 'zod';
import { objectIdSchema } from '@/lib/objectId';

export const createProgressSchema = z.object({
  levelId: objectIdSchema,
  puzzleId: objectIdSchema,
  status: z.nativeEnum(CompletionStatus),
  attempts: z.number().int().nonnegative(),
  timeSpent: z.number().int().nonnegative(),
});

export const progressLevelParamsSchema = z.object({
  id: objectIdSchema,
});
