import type { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '@/lib/apiResponse';
import { AppError } from '@/middleware/errorHandler';
import { settingsService } from './settings.service';

export const getMySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication is required.', 401);
    }

    const result = await settingsService.getMySettings(req.user.id);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const updateMySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication is required.', 401);
    }

    const result = await settingsService.updateMySettings(req.user.id, req.body);
    return sendSuccess(res, result, 200, 'Settings updated.');
  } catch (error) {
    return next(error);
  }
};
