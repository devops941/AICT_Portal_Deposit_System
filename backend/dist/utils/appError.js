"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    status;
    isOperational;
    errorCode;
    errors;
    constructor(message, statusCode = 500, errorCode, errors) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.errorCode = errorCode;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
    static badRequest(message, errorCode = 'BAD_REQUEST', errors) {
        return new AppError(message, 400, errorCode, errors);
    }
    static unauthorized(message = 'Unauthorized access', errorCode = 'UNAUTHORIZED') {
        return new AppError(message, 401, errorCode);
    }
    static forbidden(message = 'Forbidden resource access', errorCode = 'FORBIDDEN') {
        return new AppError(message, 403, errorCode);
    }
    static notFound(message = 'Requested resource not found', errorCode = 'NOT_FOUND') {
        return new AppError(message, 404, errorCode);
    }
    static conflict(message = 'Resource conflict detected', errorCode = 'CONFLICT') {
        return new AppError(message, 409, errorCode);
    }
    static unprocessable(message = 'Validation failed', errors) {
        return new AppError(message, 422, 'UNPROCESSABLE_ENTITY', errors);
    }
    static internal(message = 'Internal server error', errorCode = 'INTERNAL_ERROR') {
        return new AppError(message, 500, errorCode);
    }
}
exports.AppError = AppError;
