import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipRequestMap = new Map<string, RateLimitRecord>();

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

export const createRateLimiter = (options: RateLimiterOptions) => {
  const { windowMs, maxRequests, message = 'Too many requests. Please slow down.' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
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
      return next(
        new AppError(message, 429, 'RATE_LIMIT_EXCEEDED')
      );
    }

    next();
  };
};

export const loginRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 60, // 60 requests per 5 min window
  message: 'Too many authentication attempts from this IP. Please try again after 5 minutes.',
});
