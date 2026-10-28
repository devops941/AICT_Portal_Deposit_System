"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginRateLimiter = exports.createRateLimiter = void 0;
const appError_1 = require("../utils/appError");
const ipRequestMap = new Map();
const createRateLimiter = (options) => {
    const { windowMs, maxRequests, message = 'Too many requests. Please slow down.' } = options;
    return (req, res, next) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
        const now = Date.now();
        const record = ipRequestMap.get(ip);
        if (!record || now > record.resetAt) {
            ipRequestMap.set(ip, {
                count: 1,
                resetAt: now + windowMs,
            });
            return next();
        }
        record.count += 1;
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));
        if (record.count > maxRequests) {
            const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
            res.setHeader('Retry-After', retryAfterSec);
            return next(new appError_1.AppError(message, 429, 'RATE_LIMIT_EXCEEDED'));
        }
        next();
    };
};
exports.createRateLimiter = createRateLimiter;
exports.loginRateLimiter = (0, exports.createRateLimiter)({
    windowMs: 5 * 60 * 1000,
    maxRequests: 60,
    message: 'Too many authentication attempts from this IP. Please try again after 5 minutes.',
});
