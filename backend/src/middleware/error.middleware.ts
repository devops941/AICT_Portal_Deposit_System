import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/appError';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else if (err.name === 'CastError') {
    error = AppError.badRequest(`Invalid resource identifier for field: ${err.path}`, 'INVALID_ID');
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'resource';
    error = AppError.conflict(`Duplicate value entered for field: ${field}`, 'DUPLICATE_KEY');
  } else if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((el: any) => ({
      field: el.path,
      message: el.message,
    }));
    error = AppError.unprocessable('Database validation error', errors);
  } else if (err.name === 'JsonWebTokenError') {
    error = AppError.unauthorized('Invalid security token provided', 'INVALID_TOKEN');
  } else if (err.name === 'TokenExpiredError') {
    error = AppError.unauthorized('Security token has expired', 'TOKEN_EXPIRED');
  } else {
    // Unhandled / Unexpected internal error
    const message = env.NODE_ENV === 'production' ? 'Internal server error occurred' : err.message;
    error = AppError.internal(message, 'INTERNAL_SERVER_ERROR');
    logger.error('Unhandled System Exception:', {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    });
  }

  const statusCode = error.statusCode || 500;
  const responsePayload = {
    success: false,
    statusCode,
    message: error.message,
    errorCode: error.errorCode || 'ERROR',
    ...(error.errors ? { errors: error.errors } : {}),
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(responsePayload);
};
