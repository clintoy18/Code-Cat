import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { validate } from '@/middleware/validate';
import { createProgress, getMyLevelProgress, getMyProgress } from './progress.controller';
import { createProgressSchema, progressLevelParamsSchema } from './progress.schema';

export const progressRouter = Router();

progressRouter.use(authenticate);
progressRouter.post('/', validate({ body: createProgressSchema }), createProgress);
progressRouter.get('/me', getMyProgress);
progressRouter.get('/me/level/:id', validate({ params: progressLevelParamsSchema }), getMyLevelProgress);
