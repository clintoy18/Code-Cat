import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { getMyAchievements } from './achievements.controller';

export const achievementsRouter = Router();

achievementsRouter.use(authenticate);
achievementsRouter.get('/me', getMyAchievements);
