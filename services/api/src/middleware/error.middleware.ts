import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.requestId || 'unknown';

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
      },
      requestId,
    });
    return;
  }

  logger.error({ err, path: req.path, method: req.method, requestId }, 'Unhandled request error');

  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message || 'Operation failed';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
    },
    requestId,
  });
}
