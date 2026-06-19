import { z } from 'zod';
import { objectIdSchema } from '@/lib/objectId';
import { createLevelSchema, levelIdParamsSchema, updateLevelSchema } from '@/modules/levels/levels.schema';

const reportTypes = ['PLAYER_PROGRESS', 'CONTENT_USAGE', 'ACHIEVEMENT_SUMMARY'] as const;

export const playerIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(1000),
});

export const generateReportSchema = z.object({
  reportType: z.enum(reportTypes),
  description: z.string().trim().min(10).max(1000),
});

export { createLevelSchema, levelIdParamsSchema, updateLevelSchema };
