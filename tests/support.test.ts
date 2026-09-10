import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupportService } from '../src/services/support';
import { UserService } from '../src/services/user';
import { ConversationService } from '../src/services/conversation';
import { EscalationService } from '../src/services/escalation';
import { ModerationService } from '../src/services/moderation';
import { IAIClient } from '../src/ai/client';
import { ConversationStatus, MessageRole, User, Conversation } from '@prisma/client';
import { isAuthorizedAdmin } from '../src/bot/middleware';
import config from '../src/config/env';

describe('Support System & Flow', () => {
  let mockUser: User;
  let mockConversation: Conversation;
  let userService: UserService;
  let conversationService: ConversationService;
  let escalationService: EscalationService;
  let moderationService: ModerationService;
  let mockAIClient: IAIClient;
  let supportService: SupportService;

  beforeEach(() => {
    mockUser = {
      id: 'usr-123',
      telegramId: BigInt(123456789),
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      language: 'uz',
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockConversation = {
      id: 'conv-456',
      userId: 'usr-123',
      status: ConversationStatus.AI_HANDLED,
      assignedTo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userService = {
      getOrCreateUser: vi.fn().mockResolvedValue(mockUser),
      isUserBlocked: vi.fn().mockResolvedValue(false),
      setBlocked: vi.fn(),
      findByTelegramId: vi.fn().mockResolvedValue(mockUser),
      getUserCount: vi.fn().mockResolvedValue(1),
      getRecentUsers: vi.fn().mockResolvedValue([mockUser]),
    } as unknown as UserService;

    conversationService = {
      getOrCreateActiveConversation: vi.fn().mockResolvedValue(mockConversation),
      saveMessage: vi.fn().mockResolvedValue({
        id: 'msg-1',
        conversationId: mockConversation.id,
        role: MessageRole.USER,
        content: 'test',
        telegramMessageId: BigInt(1),
        createdAt: new Date(),
      }),
      getRecentMessages: vi.fn().mockResolvedValue([]),
      updateStatus: vi.fn().mockImplementation((id, status) => {
        mockConversation.status = status;
        return Promise.resolve(mockConversation);
      }),
      closeConversation: vi.fn(),
      reopenConversation: vi.fn(),
      getConversation: vi.fn().mockResolvedValue(mockConversation),
      getConversationStats: vi.fn().mockResolvedValue({
        total: 1,
        open: 0,
        aiHandled: 1,
        waitingHuman: 0,
        closed: 0,
      }),
    } as unknown as ConversationService;

    escalationService = {
      escalateToHuman: vi.fn().mockResolvedValue({
        success: true,
        userMessage: 'Albatta. Masalangiz operatorimizga yuborildi. Iltimos, biroz kuting.',
      }),
      setBot: vi.fn(),
    } as unknown as EscalationService;

    moderationService = new ModerationService();

    mockAIClient = {
      generateResponse: vi.fn().mockResolvedValue('Zynygram ilovasida rasm generatsiya qilish mumkin.'),
    };

    supportService = new SupportService(
      userService,
      conversationService,
      escalationService,
      moderationService,
      mockAIClient,
    );
  });

  it('should process normal user inquiries via AI pipeline', async () => {
    const result = await supportService.handleUserMessage({
      telegramId: 123456789,
      username: 'testuser',
      text: 'Zynygram-da rasm yaratish qanday ishlaydi?',
    });

    expect(result.escalatedToHuman).toBe(false);
    expect(result.replyText).toContain('Zynygram');
    expect(conversationService.saveMessage).toHaveBeenCalledWith(
      mockConversation.id,
      MessageRole.USER,
      expect.any(String),
      undefined,
    );
    expect(conversationService.saveMessage).toHaveBeenCalledWith(
      mockConversation.id,
      MessageRole.ASSISTANT,
      expect.any(String),
    );
  });

  it('should prevent AI response and notify if user is blocked', async () => {
    mockUser.isBlocked = true;

    const result = await supportService.handleUserMessage({
      telegramId: 123456789,
      text: 'Menga yordam bering',
    });

    expect(result.replyText).toContain('bloklangan');
    expect(mockAIClient.generateResponse).not.toHaveBeenCalled();
  });

  it('should trigger human escalation when user requests an operator', async () => {
    const result = await supportService.handleUserMessage({
      telegramId: 123456789,
      text: 'Menga zudlik bilan jonli operator kerak',
    });

    expect(result.escalatedToHuman).toBe(true);
    expect(result.status).toBe(ConversationStatus.WAITING_HUMAN);
    expect(escalationService.escalateToHuman).toHaveBeenCalled();
    expect(result.replyText).toContain('operatorimizga yuborildi');
  });

  it('should not call AI if conversation is already waiting for human', async () => {
    mockConversation.status = ConversationStatus.WAITING_HUMAN;

    const result = await supportService.handleUserMessage({
      telegramId: 123456789,
      text: 'Qachon javob berasizlar?',
    });

    expect(result.escalatedToHuman).toBe(true);
    expect(result.status).toBe(ConversationStatus.WAITING_HUMAN);
    expect(mockAIClient.generateResponse).not.toHaveBeenCalled();
    expect(result.replyText).toContain('operator navbatida');
  });

  it('should provide safe fallback when AI service encounters an unexpected error', async () => {
    mockAIClient.generateResponse = vi.fn().mockRejectedValue(new Error('AI provider 500 error'));

    const result = await supportService.handleUserMessage({
      telegramId: 123456789,
      text: 'Oddiy savol',
    });

    expect(result.replyText).toContain('texnik nosozlik yuz berdi');
    expect(result.replyText).toContain('/human');
  });

  describe('Admin Authorization', () => {
    it('should authorize Telegram IDs present in ADMIN_TELEGRAM_IDS', () => {
      const mockAdminId = '999888777';
      // Temporarily add to config.adminIds
      (config.adminIds as string[]).push(mockAdminId);

      const mockCtx = {
        from: { id: 999888777 },
      };

      expect(isAuthorizedAdmin(mockCtx as never)).toBe(true);
    });

    it('should reject Telegram IDs not present in ADMIN_TELEGRAM_IDS', () => {
      const mockCtx = {
        from: { id: 111111111 },
      };

      expect(isAuthorizedAdmin(mockCtx as never)).toBe(false);
    });
  });
});

