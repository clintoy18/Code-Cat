import { Role } from '@shared/types/user';
import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(24),
  email: z.string().email(),
  password: z.string().min(8).max(64),
  role: z.enum([Role.STUDENT, Role.TEACHER]).default(Role.STUDENT),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64),
});
