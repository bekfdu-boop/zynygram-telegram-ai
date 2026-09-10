import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import crypto from 'crypto';
import config from '../../config/env';
import logger from '../../utils/logger';
import getAdminHtml from './admin.html';
import verificationService from '../../services/verification';
import userService from '../../services/user';
import conversationService from '../../services/conversation';
import { bot } from '../../bot/telegram';
import prisma from '../../database/prisma';
import { MessageRole, VerificationStatus, ConversationStatus } from '@prisma/client';
import { escapeTelegramHtml } from '../../utils/text';

// Sessions are short-lived. Use a shared session store before running multiple app replicas.
const activeTokens = new Map<string, number>();
const failedLogins = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/**
 * Validates admin authentication token from Authorization or x-admin-token headers
 */
function isAuthorized(req: FastifyRequest): boolean {
  const authHeader = req.headers['authorization'];
  const tokenHeader = req.headers['x-admin-token'];

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : typeof tokenHeader === 'string'
      ? tokenHeader.trim()
      : null;

  if (!token) return false;
  const expiresAt = activeTokens.get(token);
  if (!expiresAt || expiresAt <= Date.now()) {
    activeTokens.delete(token);
    return false;
  }
  return true;
}

function passwordsMatch(candidate: string, expected: string): boolean {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(candidateBuffer, expectedBuffer);
}

export const adminRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // -------------------------------------------------------------
  // 1. Single Page Application Web Dashboard
  // -------------------------------------------------------------
  server.get('/admin', async (_req, reply) => {
    return reply.type('text/html; charset=utf-8').send(getAdminHtml());
  });

  // -------------------------------------------------------------
  // 2. Authentication Endpoints
  // -------------------------------------------------------------
  server.post<{ Body: { password?: string } }>('/api/admin/login', async (req, reply) => {
    const { password } = req.body || {};
    const now = Date.now();
    const attempt = failedLogins.get(req.ip);
    if (attempt && attempt.resetAt > now && attempt.count >= MAX_LOGIN_ATTEMPTS) {
      return reply.status(429).send({ error: 'Too many login attempts. Try again later.' });
    }

    if (!config.adminPassword) {
      logger.error('Admin panel login attempted without ADMIN_PANEL_PASSWORD configured');
      return reply.status(503).send({ error: 'Admin panel is not configured' });
    }

    if (!password || !passwordsMatch(password, config.adminPassword)) {
      const current = attempt && attempt.resetAt > now ? attempt : { count: 0, resetAt: now + LOGIN_WINDOW_MS };
      failedLogins.set(req.ip, { ...current, count: current.count + 1 });
      logger.warn({ ip: req.ip }, 'Failed admin web login attempt');
      return reply.status(401).send({ error: 'Parol noto‘g‘ri kiritildi' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    activeTokens.set(token, now + config.adminSessionTtlMs);
    failedLogins.delete(req.ip);

    logger.info({ ip: req.ip }, 'Admin logged into web dashboard successfully');
    return reply.status(200).send({ success: true, token });
  });

  server.get('/api/admin/auth/check', async (req, reply) => {
    if (!isAuthorized(req)) {
      return reply.status(401).send({ authenticated: false });
    }
    return reply.status(200).send({ authenticated: true });
  });

  // -------------------------------------------------------------
  // 3. Protected Dashboard Statistics Endpoint
  // -------------------------------------------------------------
  server.get('/api/admin/stats', async (req, reply) => {
    if (!isAuthorized(req)) {
      return reply.status(401).send({ error: 'Ruxsat etilmagan' });
    }

    const [userCount, vStats, convStats, recentV, recentU] = await Promise.all([
      userService.getUserCount(),
      verificationService.getVerificationStats(),
      conversationService.getConversationStats(),
      verificationService.getRequestsPaged({ limit: 5, status: VerificationStatus.PENDING }),
      userService.getRecentUsers(5),
    ]);

    return reply.send({
      users: { total: userCount },
      verification: vStats,
      conversations: convStats,
      recentVerifications: recentV.requests,
      recentUsers: recentU.map((u) => ({
        ...u,
        telegramId: u.telegramId.toString(),
      })),
    });
  });

  // -------------------------------------------------------------
  // 4. Verification Requests Management
  // -------------------------------------------------------------
  server.get<{
    Querystring: {
      status?: string;
      search?: string;
      page?: string;
      limit?: string;
    };
  }>('/api/admin/verifications', async (req, reply) => {
    if (!isAuthorized(req)) {
      return reply.status(401).send({ error: 'Ruxsat etilmagan' });
    }

    const { status, search, page, limit } = req.query;

    const parsedStatus =
      status && Object.values(VerificationStatus).includes(status as VerificationStatus)
        ? (status as VerificationStatus)
        : undefined;

    const result = await verificationService.getRequestsPaged({
      status: parsedStatus,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });

    return reply.send(result);
  });

  server.post<{ Params: { id: string } }>('/api/admin/verifications/:id/approve', async (req, reply) => {
    if (!isAuthorized(req)) {
      return reply.status(401).send({ error: 'Ruxsat etilmagan' });
    }

    const { id } = req.params;
    const result = await verificationService.approveRequest(id, 'web-admin');

    if (result.success) {
      logger.info({ requestId: id }, 'Admin approved verification request via Web Dashboard');
      return reply.send({ success: true });
    }

    return reply.status(400).send({ error: 'Arizani tasdiqlab bo‘lmadi yoki u allaqachon ko‘rib chiqilgan' });
  });

  server.post<{ Params: { id: string } }>('/api/admin/verifications/:id/reject', async (req, reply) => {
    if (!isAuthorized(req)) {
      return reply.status(401).send({ error: 'Ruxsat etilmagan' });
    }

    const { id } = req.params;
    const result = await verificationService.rejectRequest(id, 'web-admin');

    if (result.success) {
      logger.info({ requestId: id }, 'Admin rejected verification request via Web Dashboard');
      return reply.send({ success: true });
    }

    return reply.status(400).send({ error: 'Arizani rad etib bo‘lmadi yoki u topilmadi' });
  });

  // Photo Proxy / Redirect for Telegram Screenshots
  server.get<{ Params: { fileId: string } }>('/api/admin/photo/:fileId', async (req, reply) => {
    if (!isAuthorized(req)) {
      return reply.status(401).send({ error: 'Ruxsat etilmagan' });
    }

    const { fileId } = req.params;
    try {
      const link = await bot.telegram.getFileLink(fileId);
      return reply.redirect(link.href);
    } catch (err) {
      logger.error({ error: err, fileId }, 'Failed to resolve Telegram photo file link');
      return reply.status(404).send({ error: 'Rasm topilmadi' });
    }
  });

  // -------------------------------------------------------------
  // 5. Users Management
  // -------------------------------------------------------------
  server.get<{
    Querystring: {
      search?: string;
      page?: string;
      limit?: string;
      isVerified?: string;
      isBlocked?: string;
    };
  }>('/api/admin/users', async (req, reply) => {
    if (!isAuthorized(req)) {
      return reply.status(401).send({ error: 'Ruxsat etilmagan' });
    }

    const { search, page, limit, isVerified, isBlocked } = req.query;

    const result = await userService.getUsersPaged({
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      isVerified: isVerified !== undefined ? isVerified === 'true' : undefined,
      isBlocked: isBlocked !== undefined ? isBlocked === 'true' : undefined,
    });

    return reply.send(result);
  });

  server.post<{ Params: { telegramId: string }; Body: { isBlocked: boolean } }>(
    '/api/admin/users/:telegramId/toggle-block',
    async (req, reply) => {
      if (!isAuthorized(req)) {
        return reply.status(401).send({ error: 'Ruxsat etilmagan' });
      }

      const { telegramId } = req.params;
      const { isBlocked } = req.body || {};

      try {
        await userService.setBlocked(telegramId, !!isBlocked);
        return reply.send({ success: true, isBlocked });
      } catch (err) {
        logger.error({ error: err, telegramId }, 'Failed to toggle user block status');
        return reply.status(400).send({ error: 'Foydalanuvchi holatini o‘zgartirib bo‘lmadi' });
      }
    },
  );

  server.post<{ Params: { telegramId: string }; Body: { isVerified: boolean } }>(
    '/api/admin/users/:telegramId/toggle-verify',
    async (req, reply) => {
      if (!isAuthorized(req)) {
        return reply.status(401).send({ error: 'Ruxsat etilmagan' });
      }

      const { telegramId } = req.params;
      const { isVerified } = req.body || {};

      try {
        await userService.setVerified(telegramId, !!isVerified);
        return reply.send({ success: true, isVerified });
      } catch (err) {
        logger.error({ error: err, telegramId }, 'Failed to toggle user verify status');
        return reply.status(400).send({ error: 'Nishon holatini o‘zgartirib bo‘lmadi' });
      }
    },
  );

  // -------------------------------------------------------------
  // 6. Conversations & Support Chat Management
  // -------------------------------------------------------------
  server.get<{
    Querystring: {
      status?: string;
      search?: string;
      page?: string;
      limit?: string;
    };
  }>('/api/admin/conversations', async (req, reply) => {
    if (!isAuthorized(req)) {
      return reply.status(401).send({ error: 'Ruxsat etilmagan' });
    }

    const { status, search, page, limit } = req.query;

    const parsedStatus =
      status && Object.values(ConversationStatus).includes(status as ConversationStatus)
        ? (status as ConversationStatus)
        : undefined;

    const result = await conversationService.getConversationsPaged({
      status: parsedStatus,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 30,
    });

    return reply.send(result);
  });

  server.get<{ Params: { id: string } }>('/api/admin/conversations/:id/messages', async (req, reply) => {
    if (!isAuthorized(req)) {
      return reply.status(401).send({ error: 'Ruxsat etilmagan' });
    }

    const { id } = req.params;
    const messages = await conversationService.getConversationMessages(id);
    return reply.send(messages);
  });

  server.post<{ Params: { id: string }; Body: { message?: string } }>(
    '/api/admin/conversations/:id/reply',
    async (req, reply) => {
      if (!isAuthorized(req)) {
        return reply.status(401).send({ error: 'Ruxsat etilmagan' });
      }

      const { id } = req.params;
      const { message } = req.body || {};

      if (!message || !message.trim()) {
        return reply.status(400).send({ error: 'Xabar matni bo‘sh bo‘lishi mumkin emas' });
      }

      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id },
          include: { user: true },
        });

        if (!conversation) {
          return reply.status(404).send({ error: 'Suhbat topilmadi' });
        }

        const userTelegramId = conversation.user.telegramId.toString();
        const formattedReply = `👨‍💻 <b>Zynygram Mutaxassisi:</b>\n\n${escapeTelegramHtml(message.trim())}`;

        // Business conversations must be answered with their original connection context.
        if (conversation.businessConnectionId && conversation.businessChatId) {
          await bot.telegram.callApi('sendMessage', {
            chat_id: conversation.businessChatId.toString(),
            text: formattedReply,
            parse_mode: 'HTML',
            business_connection_id: conversation.businessConnectionId,
          } as never);
        } else {
          await bot.telegram.sendMessage(userTelegramId, formattedReply, { parse_mode: 'HTML' });
        }

        // Save to message history
        await conversationService.saveMessage(id, MessageRole.ADMIN, message.trim());

        // Update conversation to open
        await conversationService.updateStatus(id, ConversationStatus.OPEN);

        logger.info({ conversationId: id, userTelegramId }, 'Operator reply sent via Web Dashboard');
        return reply.send({ success: true });
      } catch (err) {
        logger.error({ error: err, conversationId: id }, 'Failed to deliver operator reply to user');
        return reply.status(500).send({ error: 'Xabarni foydalanuvchiga yetkazib bo‘lmadi' });
      }
    },
  );

  server.post<{ Params: { id: string } }>('/api/admin/conversations/:id/close', async (req, reply) => {
    if (!isAuthorized(req)) {
      return reply.status(401).send({ error: 'Ruxsat etilmagan' });
    }

    const { id } = req.params;
    try {
      await conversationService.closeConversation(id);
      return reply.send({ success: true });
    } catch {
      return reply.status(400).send({ error: 'Suhbatni yopib bo‘lmadi' });
    }
  });

  logger.info('Admin Web Panel endpoints registered at /admin and /api/admin/*');
};

export default adminRoutes;
