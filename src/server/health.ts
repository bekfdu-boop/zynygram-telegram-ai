import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import prisma from '../database/prisma';
import config from '../config/env';
import logger from '../utils/logger';

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
};

export default healthRoutes;

