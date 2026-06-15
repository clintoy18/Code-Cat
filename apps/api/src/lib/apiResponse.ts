import type { Response } from 'express';

export interface IApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface IApiSuccessBody<T> {
  success: true;
  data: T;
  message?: string;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string,
) => res.status(statusCode).json({
  success: true,
  data,
  ...(message ? { message } : {}),
} satisfies IApiSuccessBody<T>);
