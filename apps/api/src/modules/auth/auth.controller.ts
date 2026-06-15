import type { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '@/lib/apiResponse';
import { AppError } from '@/middleware/errorHandler';
import { authService } from './auth.service';

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, result, 201, 'User registered successfully.');
  } catch (error) {
    return next(error);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, 200, 'Login successful.');
  } catch (error) {
    return next(error);
  }
};

export const logoutUser = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.logout();
    return sendSuccess(res, result, 200, 'Logout successful.');
  } catch (error) {
    return next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication is required.', 401);
    }

    const result = await authService.getCurrentUser(req.user.id);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};
