import type { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '@/lib/apiResponse';
import { AppError } from '@/middleware/errorHandler';
import { progressService } from './progress.service';

export const createProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication is required.', 401);
    }

    const result = await progressService.saveProgress(req.user.id, req.body);
    return sendSuccess(res, result, 201, 'Progress saved.');
  } catch (error) {
    return next(error);
  }
};

export const getMyProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication is required.', 401);
    }

    const result = await progressService.getMyProgress(req.user.id);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const getMyLevelProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication is required.', 401);
    }

    const result = await progressService.getMyLevelProgress(req.user.id, req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};
