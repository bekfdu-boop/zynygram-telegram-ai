import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import prisma from '../database/prisma';
import config from '../config/env';
import logger from '../utils/logger';
import { bot } from '../bot/telegram';
import diagnostics from '../utils/diagnostics';

export const healthRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Simple liveness probe
  server.get('/health', async (_req, reply) => {
    return reply.status(200).send({ status: 'ok' });
  });

  // Comprehensive readiness probe (DB connection and AI config checks)
  server.get('/ready', async (_req, reply) => {
    const checks: Record<string, { status: 'healthy' | 'unhealthy'; message?: string }> = {};

    // 1. Database connection check
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'healthy' };
    } catch (dbError) {
      logger.error({ error: dbError }, 'Readiness check failed for database');
      checks.database = {
        status: 'unhealthy',
        message: dbError instanceof Error ? dbError.message : 'Database query failed',
      };
    }

    // 2. AI Configuration check
    if (config.ai.apiKey && config.ai.baseUrl && config.ai.model) {
      checks.ai = { status: 'healthy' };
    } else {
      checks.ai = {
        status: 'unhealthy',
        message: 'AI configuration missing required fields',
      };
    }

    const isAllHealthy = Object.values(checks).every((c) => c.status === 'healthy');
    const statusCode = isAllHealthy ? 200 : 503;

    return reply.status(statusCode).send({
      status: isAllHealthy ? 'ready' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    });
  });

  // Diagnostic endpoint for Telegram Bot & Business inspection
  server.get('/diagnostics', async (_req, reply) => {
    let telegramStatus: Record<string, unknown> = {};
    try {
      const me = await bot.telegram.getMe();
      const webhook = await bot.telegram.getWebhookInfo();
      telegramStatus = {
        status: 'ok',
        bot: {
          id: me.id,
          username: me.username,
          canConnectToBusiness: (me as unknown as { can_connect_to_business?: boolean }).can_connect_to_business ?? true,
        },
        webhook,
      };
    } catch (err) {
      telegramStatus = {
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      };
    }

    let dbStatus: Record<string, unknown> = {};
    try {
      const userCount = await prisma.user.count();
      const convCount = await prisma.conversation.count();
      const latestConv = await prisma.conversation.findFirst({
        orderBy: { updatedAt: 'desc' },
        include: { messages: { take: 2, orderBy: { createdAt: 'desc' } } },
      });
      dbStatus = {
        status: 'ok',
        userCount,
        convCount,
        latestConversationId: latestConv?.id,
        latestStatus: latestConv?.status,
        latestBusinessConnectionId: latestConv?.businessConnectionId,
        latestMessages: latestConv?.messages.map((m) => ({
          role: m.role,
          content: m.content.substring(0, 100),
          createdAt: m.createdAt,
        })),
      };
    } catch (dbErr) {
      dbStatus = {
        status: 'error',
        error: dbErr instanceof Error ? dbErr.message : String(dbErr),
      };
    }

    return reply.send({
      serverTime: new Date().toISOString(),
      telegram: telegramStatus,
      businessConnections: diagnostics.getConnections(),
      recentEvents: diagnostics.getRecentEvents(),
      database: dbStatus,
      config: {
        nodeEnv: config.nodeEnv,
        adminCount: config.adminIds.length,
        hasSupportGroup: !!config.supportGroupId,
        aiModel: config.ai.model,
        aiBaseUrl: config.ai.baseUrl,
      },
    });
  });
};

export default healthRoutes;

