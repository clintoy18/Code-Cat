import type { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '@/lib/apiResponse';
import { AppError } from '@/middleware/errorHandler';
import { achievementsService } from './achievements.service';

export const getMyAchievements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication is required.', 401);
    }

    const result = await achievementsService.getMyAchievements(req.user.id);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};
