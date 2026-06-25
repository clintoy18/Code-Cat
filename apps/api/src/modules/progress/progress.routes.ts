import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { validate } from '@/middleware/validate';
import {
  createAssignmentRoomProgress,
  createProgress,
  getMyAssignmentById,
  getMyAssignments,
  getMyLevelProgress,
  getMyProgress,
} from './progress.controller';
import {
  assignmentParamsSchema,
  createAssignmentRoomProgressSchema,
  createProgressSchema,
  progressLevelParamsSchema,
} from './progress.schema';

export const progressRouter = Router();

progressRouter.use(authenticate);
progressRouter.post('/', validate({ body: createProgressSchema }), createProgress);
progressRouter.post('/rooms', validate({ body: createAssignmentRoomProgressSchema }), createAssignmentRoomProgress);
progressRouter.get('/me', getMyProgress);
progressRouter.get('/assignments/me', getMyAssignments);
progressRouter.get('/assignments/me/:id', validate({ params: assignmentParamsSchema }), getMyAssignmentById);
progressRouter.get('/me/level/:id', validate({ params: progressLevelParamsSchema }), getMyLevelProgress);
