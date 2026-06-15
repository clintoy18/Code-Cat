import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject, ZodTypeAny } from 'zod';

type RequestSchemas = {
  body?: ZodTypeAny;
  params?: AnyZodObject;
  query?: AnyZodObject;
};

export const validate =
  (schemas: RequestSchemas) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
