import type { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '@/lib/apiResponse';
import { teacherService } from './teacher.service';

export const getStudents = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.getStudents();
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const getStudentProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.getStudentProgress(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};
