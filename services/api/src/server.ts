import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { runMigrations } from './database/migrate.js';
import { runSeeds } from './database/seed.js';
import { initWebSocketServer } from './websocket/server.js';
import { closeDatabase } from './database/db.js';

async function bootstrap() {
  try {
    logger.info('Starting RemoteDesk API Server...');

    // Run database migrations and seeds
    runMigrations();
    runSeeds();

    const app = createApp();
    const server = http.createServer(app);

    // Attach Socket.IO
    initWebSocketServer(server);

    server.listen(env.PORT, env.HOST, () => {
      logger.info(`RemoteDesk API listening on http://${env.HOST}:${env.PORT}`);
      logger.info(`WebSocket server active on ws://${env.HOST}:${env.PORT}`);
    });

    const shutdown = () => {
      logger.info('Received shutdown signal, closing server gracefully...');
      server.close(() => {
        closeDatabase();
        logger.info('Server closed. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logger.fatal({ error }, 'Failed to bootstrap RemoteDesk API server');
    process.exit(1);
  }
}

bootstrap();
