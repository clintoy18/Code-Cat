import { CompletionStatus } from '@shared/types/progress';
import { z } from 'zod';
import { objectIdSchema } from '@/lib/objectId';

const paginationFieldSchema = z.coerce.number().int().min(1).optional();

export const createProgressSchema = z.object({
  levelId: objectIdSchema,
  puzzleId: objectIdSchema,
  status: z.nativeEnum(CompletionStatus),
  attempts: z.number().int().nonnegative(),
  timeSpent: z.number().int().nonnegative(),
});

export const createAssignmentRoomProgressSchema = z.object({
  assignmentId: objectIdSchema,
  roomKey: z.string().min(1),
  status: z.nativeEnum(CompletionStatus),
  movesUsed: z.number().int().nonnegative(),
  blocksUsed: z.number().int().nonnegative(),
  timeSpent: z.number().int().nonnegative(),
});

export const progressLevelParamsSchema = z.object({
  id: objectIdSchema,
});

export const assignmentParamsSchema = z.object({
  id: objectIdSchema,
});

export const studentAssignmentsPaginationQuerySchema = z.object({
  page: paginationFieldSchema,
  pageSize: paginationFieldSchema,
  classroomId: objectIdSchema.optional(),
});
