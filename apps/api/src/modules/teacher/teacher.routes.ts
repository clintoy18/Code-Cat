import { Router } from 'express';
import { Role } from '@shared/types/user';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { getStudentProgress, getStudents } from './teacher.controller';
import { teacherStudentParamsSchema } from './teacher.schema';

export const teacherRouter = Router();

teacherRouter.use(authenticate, authorize(Role.TEACHER, Role.ADMIN));
teacherRouter.get('/students', getStudents);
teacherRouter.get('/students/:id/progress', validate({ params: teacherStudentParamsSchema }), getStudentProgress);
