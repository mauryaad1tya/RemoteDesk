import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/request-id.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { apiRouter } from './routes/api.routes.js';

export function createApp(): express.Application {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: [env.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    })
  );

  // Parsing middlewares
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Request correlation tracking
  app.use(requestIdMiddleware);

  // Healthcheck endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'RemoteDesk API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // API v1 routes
  app.use('/api/v1', apiRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
