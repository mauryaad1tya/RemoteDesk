import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const hits = new Map<string, RateLimitRecord>();

export function createRateLimiter(windowMs: number = env.RATE_LIMIT_WINDOW_MS, max: number = env.RATE_LIMIT_MAX_REQUESTS) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = hits.get(ip);

    if (!record || now > record.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    record.count++;
    if (record.count > max) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
        requestId: req.requestId,
      });
      return;
    }

    next();
  };
}
