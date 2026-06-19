import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@shared/types/user';
import { AppError } from './errorHandler';

export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('UNAUTHORIZED', 'Authentication is required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('FORBIDDEN', 'You do not have permission to access this resource.', 403));
    }

    return next();
  };
