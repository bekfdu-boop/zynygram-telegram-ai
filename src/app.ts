import config from './config/env';
import logger from './utils/logger';
import { loadKnowledgeBase } from './ai/knowledge';
import { prisma } from './database/prisma';
import { startBot, stopBot } from './bot/telegram';
import { createServer, startServer, stopServer } from './server/server';

async function bootstrap(): Promise<void> {
  logger.info({ nodeEnv: config.nodeEnv }, 'Starting Zynygram Telegram AI Support system...');

  // 1. Load Knowledge Base
  try {
    await loadKnowledgeBase();
  } catch (err) {
    logger.error({ error: err }, 'Failed to initialize knowledge base; continuing with empty base');
  }

  // 2. Connect & Verify Database
  try {
    await prisma.$connect();
    logger.info('Database connection established successfully');

    // Automatically apply migrations if needed
    try {
      const { execSync } = await import('child_process');
      logger.info('Applying database migrations...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      logger.info('Database migrations verified and up to date');
    } catch (migErr) {
      logger.warn({ error: migErr }, 'Prisma migrate deploy via execSync failed, continuing with existing schema');
    }
  } catch (dbErr) {
    logger.error({ error: dbErr }, 'Unable to connect to PostgreSQL database');
    if (config.isProduction) {
      process.exit(1);
    }
  }

  // 3. Start Fastify HTTP Server
  const server = createServer();
  await startServer(server);

  // 4. Start Telegram Bot
  try {
    await startBot();
  } catch (botErr) {
    logger.error({ error: botErr }, 'Failed to start Telegram Bot');
    if (config.isProduction) {
      process.exit(1);
    }
  }

  logger.info('🚀 Zynygram Telegram AI Support system is fully operational');

  // 5. Setup Graceful Shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal, terminating gracefully...');

    try {
      stopBot(`Received ${signal}`);
      await stopServer(server);
      await prisma.$disconnect();
      logger.info('All services shut down cleanly');
      process.exit(0);
    } catch (shutdownErr) {
      logger.error({ error: shutdownErr }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled Promise Rejection caught');
  });

  process.on('uncaughtException', (error) => {
    logger.error({ error }, 'Uncaught Exception caught');
  });
}

bootstrap().catch((error) => {
  logger.fatal({ error }, 'Fatal error during application bootstrap');
  process.exit(1);
});

