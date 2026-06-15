import type { NextFunction, Request, Response } from 'express';
import { verifyJwt } from '@/lib/jwt';
import { AppError } from './errorHandler';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 'Authentication token is required.', 401));
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const payload = verifyJwt(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };
    return next();
  } catch (_error) {
    return next(new AppError('UNAUTHORIZED', 'Authentication token is invalid or expired.', 401));
  }
};
