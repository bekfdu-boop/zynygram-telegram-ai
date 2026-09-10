import Fastify, { FastifyInstance } from 'fastify';
import config from '../config/env';
import logger from '../utils/logger';
import healthRoutes from './health';
import adminRoutes from './admin/admin.routes';

export function createServer(): FastifyInstance {
  const server = Fastify({
    logger: false, // We use our central Pino logger
    disableRequestLogging: true,
  });

  // Register health check endpoints
  server.register(healthRoutes);

  // Register Admin Web Panel routes
  server.register(adminRoutes);

  return server;
}

export async function startServer(server: FastifyInstance): Promise<void> {
  try {
    const address = await server.listen({
      port: config.port,
      host: '0.0.0.0',
    });
    const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL;
    if (railwayDomain) {
      logger.info(
        { adminUrl: `https://${railwayDomain}/admin`, port: config.port, address },
        '🚀 Zynygram Admin Web Panel is live on Railway',
      );
    } else {
      logger.info(
        { adminUrl: `http://localhost:${config.port}/admin`, port: config.port, address },
        'Fastify HTTP server started',
      );
    }
  } catch (error) {
    logger.error({ error }, 'Failed to start Fastify HTTP server');
    throw error;
  }
}

export async function stopServer(server: FastifyInstance): Promise<void> {
  try {
    await server.close();
    logger.info('Fastify HTTP server stopped');
  } catch (error) {
    logger.error({ error }, 'Error while stopping Fastify HTTP server');
  }
}

