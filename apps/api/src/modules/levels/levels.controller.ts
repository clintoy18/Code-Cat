import type { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '@/lib/apiResponse';
import { levelsService } from './levels.service';

export const getLevels = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await levelsService.getLevels();
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const getLevel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await levelsService.getLevelById(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const getLevelPuzzles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await levelsService.getLevelPuzzles(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};
