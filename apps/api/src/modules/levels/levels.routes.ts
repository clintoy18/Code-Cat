import { Router } from 'express';
import { validate } from '@/middleware/validate';
import { getLevel, getLevelPuzzles, getLevels } from './levels.controller';
import { levelIdParamsSchema } from './levels.schema';

export const levelsRouter = Router();

levelsRouter.get('/', getLevels);
levelsRouter.get('/:id', validate({ params: levelIdParamsSchema }), getLevel);
levelsRouter.get('/:id/puzzles', validate({ params: levelIdParamsSchema }), getLevelPuzzles);
