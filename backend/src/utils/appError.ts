export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: 'fail' | 'error';
  public readonly isOperational: boolean;
  public readonly errorCode?: string;
  public readonly errors?: unknown[];

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    errors?: unknown[]
  ) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errorCode = errorCode;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errorCode: string = 'BAD_REQUEST', errors?: unknown[]): AppError {
    return new AppError(message, 400, errorCode, errors);
  }

  static unauthorized(message: string = 'Unauthorized access', errorCode: string = 'UNAUTHORIZED'): AppError {
    return new AppError(message, 401, errorCode);
  }

  static forbidden(message: string = 'Forbidden resource access', errorCode: string = 'FORBIDDEN'): AppError {
    return new AppError(message, 403, errorCode);
  }

  static notFound(message: string = 'Requested resource not found', errorCode: string = 'NOT_FOUND'): AppError {
    return new AppError(message, 404, errorCode);
  }

  static conflict(message: string = 'Resource conflict detected', errorCode: string = 'CONFLICT'): AppError {
    return new AppError(message, 409, errorCode);
  }

  static unprocessable(message: string = 'Validation failed', errors?: unknown[]): AppError {
    return new AppError(message, 422, 'UNPROCESSABLE_ENTITY', errors);
  }

  static internal(message: string = 'Internal server error', errorCode: string = 'INTERNAL_ERROR'): AppError {
    return new AppError(message, 500, errorCode);
  }
}
