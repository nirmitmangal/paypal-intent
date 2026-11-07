import { createApp } from './app';
import { env } from './config/env';
import { getDatabase } from './db';
import { aiService } from './services/ai.service';
import { logger } from './utils/logger';

async function bootstrap() {
  logger.info('====================================================');
  logger.info('Starting PayPal Intent Backend Server...');
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info('====================================================');

  // 1. Initialize SQLite Database
  try {
    getDatabase();
    logger.info('SQLite Database ready.');
  } catch (err) {
    logger.error('Failed to initialize database:', err);
    process.exit(1);
  }

  // 2. Check Ollama AI Engine
  try {
    const aiHealth = await aiService.checkHealth();
    logger.info(`Ollama AI Status: [${aiHealth.status}] on ${aiHealth.endpoint} (Model: ${aiHealth.model})`);
  } catch (err) {
    logger.warn('Ollama AI status check failed, will retry during runtime requests:', err);
  }

  // 3. Start Express HTTP Server
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`PayPal Intent API Server listening on: http://localhost:${env.PORT}`);
    logger.info(`Health check available at: http://localhost:${env.PORT}/api/health`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    logger.info('Shutting down server gracefully...');
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap();
