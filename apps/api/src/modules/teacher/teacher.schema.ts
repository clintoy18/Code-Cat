import { z } from 'zod';
import { objectIdSchema } from '@/lib/objectId';

export const teacherStudentParamsSchema = z.object({
  id: objectIdSchema,
});
