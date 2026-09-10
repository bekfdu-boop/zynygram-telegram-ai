import config from './config/env';
import logger from './utils/logger';
import { loadKnowledgeBase } from './ai/knowledge';
import { prisma } from './database/prisma';
import { startBot, stopBot } from './bot/telegram';
import { createServer, startServer, stopServer } from './server/server';

async function bootstrap(): Promise<void> {
  logger.info({ nodeEnv: config.nodeEnv }, 'Starting Zynygram Telegram AI Support system...');

  if (config.isGeneratedAdminPassword) {
    logger.warn('════════════════════════════════════════════════════════════════════════════');
    logger.warn(`🔐 ADMIN PANEL TEMPORARY PASSWORD: ${config.adminPassword}`);
    logger.warn('ℹ️  Tip: Set ADMIN_PANEL_PASSWORD in Railway variables for a permanent password.');
    logger.warn('════════════════════════════════════════════════════════════════════════════');
  } else {
    logger.info('Admin panel authentication configured with custom password');
  }

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
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  logger.fatal(
    { err: error, error: errorMessage, stack: errorStack },
    `Fatal error during application bootstrap: ${errorMessage}`,
  );
  process.exit(1);
});
