import { Difficulty } from '@shared/types/level';
import { AdminReportType } from '@shared/types/admin';
import { Role } from '@shared/types/user';
import { z } from 'zod';
import { objectIdSchema } from '@/lib/objectId';
import { createLevelSchema, levelIdParamsSchema, updateLevelSchema } from '@/modules/levels/levels.schema';

const paginationFieldSchema = z.coerce.number().int().min(1).optional();
const searchFieldSchema = z.string().trim().min(1).max(120).optional();

export const adminPaginationQuerySchema = z.object({
  page: paginationFieldSchema,
  pageSize: paginationFieldSchema,
  search: searchFieldSchema,
});

export const playerIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const userIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const announcementIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const playerProgressPaginationQuerySchema = z.object({
  page: paginationFieldSchema,
  pageSize: paginationFieldSchema,
});

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(1000),
});

export const adminUsersPaginationQuerySchema = z.object({
  page: paginationFieldSchema,
  pageSize: paginationFieldSchema,
  search: searchFieldSchema,
  role: z.nativeEnum(Role).optional(),
});

export const createUserSchema = z.object({
  username: z.string().trim().min(3).max(24),
  email: z.string().email(),
  password: z.string().min(8).max(64),
  role: z.nativeEnum(Role),
});

export const updateUserSchema = z.object({
  username: z.string().trim().min(3).max(24),
  email: z.string().email(),
  password: z.string().min(8).max(64).optional(),
  role: z.nativeEnum(Role),
});

export const updateAnnouncementSchema = createAnnouncementSchema;

export const reportPaginationQuerySchema = z.object({
  page: paginationFieldSchema,
  pageSize: paginationFieldSchema,
  search: searchFieldSchema,
  reportType: z.nativeEnum(AdminReportType).optional(),
});

export const levelPaginationQuerySchema = z.object({
  page: paginationFieldSchema,
  pageSize: paginationFieldSchema,
  search: searchFieldSchema,
  difficulty: z.nativeEnum(Difficulty).optional(),
});

export const generateReportSchema = z.object({
  reportType: z.nativeEnum(AdminReportType),
  description: z.string().trim().min(10).max(1000),
});

export { createLevelSchema, levelIdParamsSchema, updateLevelSchema };
