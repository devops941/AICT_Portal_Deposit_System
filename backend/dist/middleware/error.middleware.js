"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const appError_1 = require("../utils/appError");
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
const errorHandler = (err, req, res, _next) => {
    let error;
    if (err instanceof appError_1.AppError) {
        error = err;
    }
    else if (err.name === 'CastError') {
        error = appError_1.AppError.badRequest(`Invalid resource identifier for field: ${err.path}`, 'INVALID_ID');
    }
    else if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'resource';
        error = appError_1.AppError.conflict(`Duplicate value entered for field: ${field}`, 'DUPLICATE_KEY');
    }
    else if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors || {}).map((el) => ({
            field: el.path,
            message: el.message,
        }));
        error = appError_1.AppError.unprocessable('Database validation error', errors);
    }
    else if (err.name === 'JsonWebTokenError') {
        error = appError_1.AppError.unauthorized('Invalid security token provided', 'INVALID_TOKEN');
    }
    else if (err.name === 'TokenExpiredError') {
        error = appError_1.AppError.unauthorized('Security token has expired', 'TOKEN_EXPIRED');
    }
    else {
        const message = env_1.env.NODE_ENV === 'production' ? 'Internal server error occurred' : err.message;
        error = appError_1.AppError.internal(message, 'INTERNAL_SERVER_ERROR');
        logger_1.logger.error('Unhandled System Exception:', {
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
        ...(env_1.env.NODE_ENV !== 'production' && { stack: err.stack }),
        timestamp: new Date().toISOString(),
    };
    res.status(statusCode).json(responsePayload);
};
exports.errorHandler = errorHandler;
