import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/appError';

interface RequestValidationSchema {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validateRequest = (schema: RequestValidationSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = (await schema.query.parseAsync(req.query)) as any;
      }
      if (schema.params) {
        req.params = (await schema.params.parseAsync(req.params)) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        return next(
          AppError.unprocessable('Validation failed on incoming request parameters', formattedErrors)
        );
      }
      next(error);
    }
  };
};

export const validate = (schema: ZodSchema) => validateRequest({ body: schema });
