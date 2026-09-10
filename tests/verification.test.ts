import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerificationService, PRIMARY_ADMIN_TELEGRAM_ID, VERIFICATION_APPROVED_USER_MESSAGE, VERIFICATION_REJECTED_USER_MESSAGE } from '../src/services/verification';
import { UserService } from '../src/services/user';
import prisma from '../src/database/prisma';
import { VerificationStatus, User } from '@prisma/client';
import { Telegraf } from 'telegraf';

vi.mock('../src/database/prisma', () => {
  return {
    default: {
      verificationRequest: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
      user: {
        update: vi.fn(),
      },
    },
  };
});

describe('VerificationService', () => {
  let mockUser: User;
  let userService: UserService;
  let verificationService: VerificationService;
  let mockBot: Telegraf;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUser = {
      id: 'usr-ver-123',
      telegramId: BigInt(8191294446),
      username: 'testadmin',
      firstName: 'Test',
      lastName: 'Admin',
      language: 'uz',
      isBlocked: false,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userService = {
      getOrCreateUser: vi.fn().mockResolvedValue(mockUser),
    } as unknown as UserService;

    verificationService = new VerificationService(userService);

    mockBot = {
      telegram: {
        sendMessage: vi.fn().mockResolvedValue({ message_id: 999 }),
        sendPhoto: vi.fn().mockResolvedValue({ message_id: 1000 }),
      },
    } as unknown as Telegraf;

    verificationService.setBot(mockBot);
  });

  it('should submit verification request and notify primary admin 8191294446', async () => {
    const mockRequest = {
      id: 'req-001',
      userId: mockUser.id,
      status: VerificationStatus.PENDING,
      proofText: 'https://t.me/Zynygram_media/2 reels qildim',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: mockUser,
    };

    vi.mocked(prisma.verificationRequest.create).mockResolvedValue(mockRequest as any);

    const result = await verificationService.submitVerificationRequest({
      telegramId: mockUser.telegramId,
      username: mockUser.username,
      firstName: mockUser.firstName,
      proofText: 'https://t.me/Zynygram_media/2 reels qildim',
    });

    expect(result.success).toBe(true);
    expect(result.requestId).toBe('req-001');
    expect(prisma.verificationRequest.create).toHaveBeenCalled();
    expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
      PRIMARY_ADMIN_TELEGRAM_ID,
      expect.stringContaining('YANGI TASDIQLASH NISHONI SO‘ROVI'),
      expect.anything(),
    );
  });

  it('should submit photo verification request and send photo to admin', async () => {
    const mockPhotoRequest = {
      id: 'req-photo-001',
      userId: mockUser.id,
      status: VerificationStatus.PENDING,
      proofText: 'Story qildim\n[Photo: agy_file_id_123]',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: mockUser,
    };

    vi.mocked(prisma.verificationRequest.create).mockResolvedValue(mockPhotoRequest as any);

    const result = await verificationService.submitVerificationRequest({
      telegramId: mockUser.telegramId,
      username: mockUser.username,
      firstName: mockUser.firstName,
      proofText: 'Story qildim',
      photoFileId: 'agy_file_id_123',
    });

    expect(result.success).toBe(true);
    expect(mockBot.telegram.sendPhoto).toHaveBeenCalledWith(
      PRIMARY_ADMIN_TELEGRAM_ID,
      'agy_file_id_123',
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });

  it('should approve verification request, mark user verified, and notify user', async () => {
    const mockRequest = {
      id: 'req-001',
      userId: mockUser.id,
      status: VerificationStatus.PENDING,
      proofText: 'proof link',
      user: mockUser,
    };

    vi.mocked(prisma.verificationRequest.findUnique).mockResolvedValue(mockRequest as any);
    vi.mocked(prisma.verificationRequest.update).mockResolvedValue({
      ...mockRequest,
      status: VerificationStatus.APPROVED,
    } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockUser,
      isVerified: true,
    } as any);

    const result = await verificationService.approveRequest('req-001', '8191294446');

    expect(result.success).toBe(true);
    expect(prisma.verificationRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-001' },
      data: { status: VerificationStatus.APPROVED },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { isVerified: true },
    });
    expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
      mockUser.telegramId.toString(),
      VERIFICATION_APPROVED_USER_MESSAGE,
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });

  it('should reject verification request and notify user', async () => {
    const mockRequest = {
      id: 'req-001',
      userId: mockUser.id,
      status: VerificationStatus.PENDING,
      proofText: 'invalid proof',
      user: mockUser,
    };

    vi.mocked(prisma.verificationRequest.findUnique).mockResolvedValue(mockRequest as any);
    vi.mocked(prisma.verificationRequest.update).mockResolvedValue({
      ...mockRequest,
      status: VerificationStatus.REJECTED,
    } as any);

    const result = await verificationService.rejectRequest('req-001', '8191294446');

    expect(result.success).toBe(true);
    expect(prisma.verificationRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-001' },
      data: { status: VerificationStatus.REJECTED },
    });
    expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
      mockUser.telegramId.toString(),
      VERIFICATION_REJECTED_USER_MESSAGE,
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });

  it('should return verification statistics correctly', async () => {
    vi.mocked(prisma.verificationRequest.count)
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(3) // pending
      .mockResolvedValueOnce(5) // approved
      .mockResolvedValueOnce(2); // rejected

    const stats = await verificationService.getVerificationStats();

    expect(stats).toEqual({
      total: 10,
      pending: 3,
      approved: 5,
      rejected: 2,
    });
  });

  it('should return pending requests with user information', async () => {
    const mockPending = [
      {
        id: 'req-pending-1',
        userId: mockUser.id,
        status: VerificationStatus.PENDING,
        proofText: 'https://t.me/zynygram/21 kanalimda ulashdim',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          telegramId: mockUser.telegramId,
          username: mockUser.username,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
      },
    ];

    vi.mocked(prisma.verificationRequest.findMany).mockResolvedValue(mockPending as any);

    const pending = await verificationService.getPendingRequests(5);

    expect(pending.length).toBe(1);
    expect(pending[0].proofText).toContain('kanalimda ulashdim');
    expect(prisma.verificationRequest.findMany).toHaveBeenCalledWith({
      where: { status: VerificationStatus.PENDING },
      include: {
        user: {
          select: { telegramId: true, username: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  });
});

