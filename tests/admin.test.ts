import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server/server';
import config from '../src/config/env';
import prisma from '../src/database/prisma';
import { FastifyInstance } from 'fastify';
import { VerificationStatus } from '@prisma/client';

vi.mock('../src/database/prisma', () => {
  return {
    default: {
      user: {
        count: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      verificationRequest: {
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      conversation: {
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      message: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      $queryRaw: vi.fn().mockResolvedValue([{ '1': 1 }]),
    },
  };
});

vi.mock('../src/bot/telegram', () => {
  return {
    bot: {
      telegram: {
        sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
        getFileLink: vi.fn().mockResolvedValue(new URL('https://api.telegram.org/file/bot123/photos/test.jpg')),
      },
    },
  };
});

describe('Admin Web Panel API', () => {
  let server: FastifyInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    server = createServer();
  });

  it('should serve HTML single page application at GET /admin', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/admin',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.payload).toContain('Zynygram Admin Panel');
    expect(response.payload).toContain('Boshqaruv');
  });

  it('should reject login with wrong password', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { password: 'wrong-password' },
    });

    expect(response.statusCode).toBe(401);
    const data = JSON.parse(response.payload);
    expect(data.error).toContain('Parol noto‘g‘ri');
  });

  it('should login successfully with valid password and return session token', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { password: config.adminPassword },
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.payload);
    expect(data.success).toBe(true);
    expect(typeof data.token).toBe('string');
    expect(data.token.length).toBeGreaterThan(10);
  });

  it('should verify authentication with valid token and reject without token', async () => {
    // 1. Without token -> 401
    const unauth = await server.inject({
      method: 'GET',
      url: '/api/admin/auth/check',
    });
    expect(unauth.statusCode).toBe(401);

    // 2. Login to get token
    const loginRes = await server.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { password: config.adminPassword },
    });
    const { token } = JSON.parse(loginRes.payload);

    // 3. With token -> 200
    const authRes = await server.inject({
      method: 'GET',
      url: '/api/admin/auth/check',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(authRes.statusCode).toBe(200);
    expect(JSON.parse(authRes.payload)).toEqual({ authenticated: true });
  });

  it('should return dashboard statistics at GET /api/admin/stats', async () => {
    const loginRes = await server.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { password: config.adminPassword },
    });
    const { token } = JSON.parse(loginRes.payload);

    vi.mocked(prisma.user.count).mockResolvedValue(42);
    vi.mocked(prisma.verificationRequest.count).mockResolvedValue(10);
    vi.mocked(prisma.conversation.count).mockResolvedValue(5);
    vi.mocked(prisma.verificationRequest.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    const res = await server.inject({
      method: 'GET',
      url: '/api/admin/stats',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(data.users.total).toBe(42);
    expect(data.verification).toBeDefined();
    expect(data.conversations).toBeDefined();
  });

  it('should return paged verification requests at GET /api/admin/verifications', async () => {
    const loginRes = await server.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { password: config.adminPassword },
    });
    const { token } = JSON.parse(loginRes.payload);

    const mockItem = {
      id: 'v-123',
      userId: 'usr-1',
      status: VerificationStatus.PENDING,
      proofText: 'https://t.me/Zynygram_media/2 nik: @john_doe\n[Photo: agy_file_id]',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 'usr-1',
        telegramId: BigInt(12345678),
        username: 'john_doe',
        firstName: 'John',
        lastName: 'Doe',
        isVerified: false,
        isBlocked: false,
      },
    };

    vi.mocked(prisma.verificationRequest.count).mockResolvedValue(1);
    vi.mocked(prisma.verificationRequest.findMany).mockResolvedValue([mockItem as any]);

    const res = await server.inject({
      method: 'GET',
      url: '/api/admin/verifications?page=1&limit=10&status=PENDING',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(data.total).toBe(1);
    expect(data.requests.length).toBe(1);
    expect(data.requests[0].photoFileId).toBe('agy_file_id');
    expect(data.requests[0].zynygramUsername).toBe('john_doe');
    expect(data.requests[0].user.telegramId).toBe('12345678');
  });

  it('should return paged users at GET /api/admin/users', async () => {
    const loginRes = await server.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { password: config.adminPassword },
    });
    const { token } = JSON.parse(loginRes.payload);

    const mockUser = {
      id: 'usr-2',
      telegramId: BigInt(87654321),
      username: 'jane_doe',
      firstName: 'Jane',
      lastName: null,
      language: 'uz',
      isBlocked: false,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        conversations: 2,
        verificationRequests: 1,
      },
    };

    vi.mocked(prisma.user.count).mockResolvedValue(1);
    vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser as any]);

    const res = await server.inject({
      method: 'GET',
      url: '/api/admin/users?search=jane',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(data.total).toBe(1);
    expect(data.users[0].telegramId).toBe('87654321');
    expect(data.users[0].isVerified).toBe(true);
  });

  it('should toggle user verification status', async () => {
    const loginRes = await server.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { password: config.adminPassword },
    });
    const { token } = JSON.parse(loginRes.payload);

    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 'usr-2',
      telegramId: BigInt(87654321),
      isVerified: true,
    } as any);

    const res = await server.inject({
      method: 'POST',
      url: '/api/admin/users/87654321/toggle-verify',
      headers: { authorization: `Bearer ${token}` },
      payload: { isVerified: true },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload)).toEqual({ success: true, isVerified: true });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { telegramId: BigInt(87654321) },
      data: { isVerified: true },
    });
  });

  it('should toggle user block status', async () => {
    const loginRes = await server.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { password: config.adminPassword },
    });
    const { token } = JSON.parse(loginRes.payload);

    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 'usr-2',
      telegramId: BigInt(87654321),
      isBlocked: true,
    } as any);

    const res = await server.inject({
      method: 'POST',
      url: '/api/admin/users/87654321/toggle-block',
      headers: { authorization: `Bearer ${token}` },
      payload: { isBlocked: true },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload)).toEqual({ success: true, isBlocked: true });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { telegramId: BigInt(87654321) },
      data: { isBlocked: true },
    });
  });
});
