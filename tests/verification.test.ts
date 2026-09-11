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
        findFirst: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
      user: {
        update: vi.fn(),
        findUnique: vi.fn(),
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
    vi.mocked(prisma.verificationRequest.findFirst).mockResolvedValue(null);

    mockUser = {
      id: 'usr-ver-123',
      telegramId: BigInt(987654321),
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
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
        callApi: vi.fn().mockResolvedValue({ message_id: 1001 }),
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

  it('should reject verification request without sending message to user', async () => {
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
    expect(mockBot.telegram.sendMessage).not.toHaveBeenCalled();
    expect(mockBot.telegram.callApi).not.toHaveBeenCalled();
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

  it('should route approval message to customer via business_connection_id in business chat', async () => {
    const mockBizRequest = {
      id: 'req-biz-001',
      userId: mockUser.id,
      status: VerificationStatus.PENDING,
      proofText: 'Reels qildim\n[BusinessChat: b_conn_123:987654321]',
      user: mockUser,
    };

    vi.mocked(prisma.verificationRequest.findUnique).mockResolvedValue(mockBizRequest as any);
    vi.mocked(prisma.verificationRequest.update).mockResolvedValue({
      ...mockBizRequest,
      status: VerificationStatus.APPROVED,
    } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockUser,
      isVerified: true,
    } as any);

    const result = await verificationService.approveRequest('req-biz-001', '8191294446');

    expect(result.success).toBe(true);
    expect(mockBot.telegram.callApi).toHaveBeenCalledWith('sendMessage', {
      chat_id: '987654321',
      text: VERIFICATION_APPROVED_USER_MESSAGE,
      parse_mode: 'HTML',
      business_connection_id: 'b_conn_123',
    });
    expect(mockBot.telegram.sendMessage).not.toHaveBeenCalled();
  });

  it('should not route rejection message to customer even via business_connection_id in business chat', async () => {
    const mockBizRequest = {
      id: 'req-biz-002',
      userId: mockUser.id,
      status: VerificationStatus.PENDING,
      proofText: 'Noto‘g‘ri havola\n[BusinessChat: b_conn_123:987654321]',
      user: mockUser,
    };

    vi.mocked(prisma.verificationRequest.findUnique).mockResolvedValue(mockBizRequest as any);
    vi.mocked(prisma.verificationRequest.update).mockResolvedValue({
      ...mockBizRequest,
      status: VerificationStatus.REJECTED,
    } as any);

    const result = await verificationService.rejectRequest('req-biz-002', '8191294446');

    expect(result.success).toBe(true);
    expect(mockBot.telegram.callApi).not.toHaveBeenCalled();
    expect(mockBot.telegram.sendMessage).not.toHaveBeenCalled();
  });

  it('should never send congratulatory message to admin when admin account is approved', async () => {
    const adminUser = {
      ...mockUser,
      telegramId: BigInt(8191294446),
    };
    const mockAdminRequest = {
      id: 'req-admin-001',
      userId: adminUser.id,
      status: VerificationStatus.PENDING,
      proofText: 'Test proof',
      user: adminUser,
    };

    vi.mocked(prisma.verificationRequest.findUnique).mockResolvedValue(mockAdminRequest as any);
    vi.mocked(prisma.verificationRequest.update).mockResolvedValue({
      ...mockAdminRequest,
      status: VerificationStatus.APPROVED,
    } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...adminUser,
      isVerified: true,
    } as any);

    const result = await verificationService.approveRequest('req-admin-001', '8191294446');

    expect(result.success).toBe(true);
    expect(mockBot.telegram.sendMessage).not.toHaveBeenCalled();
  });

  it('should reject duplicate verification request when user already has a pending request', async () => {
    const existingPending = {
      id: 'req-prev-001',
      userId: mockUser.id,
      status: VerificationStatus.PENDING,
      proofText: 'avvalgi isbot',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.verificationRequest.findFirst).mockResolvedValue(existingPending as any);

    const result = await verificationService.submitVerificationRequest({
      telegramId: mockUser.telegramId,
      username: mockUser.username,
      firstName: mockUser.firstName,
      proofText: 'ikkinchi marta yuborishga urinish',
    });

    expect(result.success).toBe(false);
    expect(result.alreadySubmitted).toBe(true);
    expect(result.userMessage).toContain('allaqachon qabul qilingan va ko‘rib chiqilmoqda');
    expect(prisma.verificationRequest.create).not.toHaveBeenCalled();
    expect(mockBot.telegram.sendMessage).not.toHaveBeenCalled();
    expect(mockBot.telegram.sendPhoto).not.toHaveBeenCalled();
  });

  it('should reject duplicate verification request when user was previously rejected (only 1 request per person)', async () => {
    const existingRejected = {
      id: 'req-prev-002',
      userId: mockUser.id,
      status: VerificationStatus.REJECTED,
      proofText: 'rad etilgan ariza',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.verificationRequest.findFirst).mockResolvedValue(existingRejected as any);

    const result = await verificationService.submitVerificationRequest({
      telegramId: mockUser.telegramId,
      username: mockUser.username,
      firstName: mockUser.firstName,
      proofText: 'qaytadan yuborish',
    });

    expect(result.success).toBe(false);
    expect(result.alreadySubmitted).toBe(true);
    expect(result.userMessage).toContain('faqat bir marta qabul qilinadi');
    expect(prisma.verificationRequest.create).not.toHaveBeenCalled();
    expect(mockBot.telegram.sendMessage).not.toHaveBeenCalled();
  });

  it('should reject duplicate verification request when user is already verified', async () => {
    const verifiedUser = {
      ...mockUser,
      isVerified: true,
    };
    vi.mocked(userService.getOrCreateUser).mockResolvedValue(verifiedUser as any);

    const result = await verificationService.submitVerificationRequest({
      telegramId: verifiedUser.telegramId,
      username: verifiedUser.username,
      firstName: verifiedUser.firstName,
      proofText: 'tasdiqlangan foydalanuvchidan yangi ariza',
    });

    expect(result.success).toBe(false);
    expect(result.alreadySubmitted).toBe(true);
    expect(result.userMessage).toContain('allaqachon tasdiqlangan');
    expect(prisma.verificationRequest.create).not.toHaveBeenCalled();
    expect(mockBot.telegram.sendMessage).not.toHaveBeenCalled();
  });

  it('should return correct verification status with getUserVerificationStatus', async () => {
    userService.findByTelegramId = vi.fn().mockResolvedValue(mockUser);
    vi.mocked(prisma.verificationRequest.findFirst).mockResolvedValue({
      id: 'req-status-001',
      userId: mockUser.id,
      status: VerificationStatus.PENDING,
    } as any);

    const statusCheck = await verificationService.getUserVerificationStatus(mockUser.telegramId);

    expect(statusCheck.hasRequest).toBe(true);
    expect(statusCheck.status).toBe(VerificationStatus.PENDING);
    expect(statusCheck.message).toContain('Arizangiz ko‘rib chiqilmoqda');
  });
});

