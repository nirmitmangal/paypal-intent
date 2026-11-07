import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { sessionMiddleware } from './middleware/session';
import { requestLogger } from './middleware/logger';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes';

export function createApp(): express.Application {
  const app = express();

  // Middleware pipeline
  app.use(
    cors({
      origin: [env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      exposedHeaders: ['x-session-token', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);
  app.use(rateLimiter);
  app.use(sessionMiddleware);

  // Mount API Router
  app.use('/api', apiRoutes);

  // Root redirect/fallback
  app.get('/', (_req, res) => {
    res.json({
      name: 'PayPal Intent API',
      version: '1.0.0',
      status: 'online',
      docs: '/api/health',
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
