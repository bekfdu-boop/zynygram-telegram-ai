import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerChatAutomationHandlers } from '../src/bot/automation';
import { registerBotHandlers } from '../src/bot/handlers';
import prisma from '../src/database/prisma';
import config from '../src/config/env';

vi.mock('../src/database/prisma', () => {
  return {
    default: {
      user: {
        findFirst: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      verificationRequest: {
        count: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      conversation: {
        count: vi.fn(),
      },
    },
  };
});

describe('Telegram Features (Sticker Auto-reply & Admin Management)', () => {
  let mockBot: any;
  let registeredMiddlewares: any[] = [];
  let registeredCommands: Record<string, Function> = {};
  let registeredHears: Array<{ pattern: any; handler: Function }> = [];
  let registeredOn: Array<{ filter: any; handler: Function }> = [];
  let registeredActions: Array<{ pattern: RegExp; handler: Function }> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    registeredMiddlewares = [];
    registeredCommands = {};
    registeredHears = [];
    registeredOn = [];
    registeredActions = [];

    mockBot = {
      use: vi.fn((fn) => registeredMiddlewares.push(fn)),
      command: vi.fn((cmd, handler) => {
        if (Array.isArray(cmd)) {
          cmd.forEach((c) => {
            registeredCommands[c] = handler;
          });
        } else {
          registeredCommands[cmd] = handler;
        }
      }),
      hears: vi.fn((pattern, handler) => {
        registeredHears.push({ pattern, handler });
      }),
      on: vi.fn((filter, handler) => {
        registeredOn.push({ filter, handler });
      }),
      action: vi.fn((pattern, handler) => {
        registeredActions.push({ pattern, handler });
      }),
      telegram: {
        callApi: vi.fn().mockResolvedValue({ message_id: 101 }),
        sendMessage: vi.fn().mockResolvedValue({ message_id: 102 }),
      },
    };
  });

  describe('Sticker Automation in Business Chat', () => {
    it('should immediately respond with automated greeting when a customer sends a sticker in business chat', async () => {
      registerChatAutomationHandlers(mockBot);

      expect(registeredMiddlewares.length).toBeGreaterThan(0);
      const businessMiddleware = registeredMiddlewares[0];

      const stickerUpdate = {
        update: {
          business_message: {
            business_connection_id: 'bconn_test_123',
            message_id: 999,
            chat: { id: 777123 },
            from: { id: 777123, username: 'customer_user', first_name: 'Customer' },
            sticker: { file_id: 'stk_123', emoji: '👋' },
          },
        },
        telegram: {
          callApi: vi.fn().mockResolvedValue({ message_id: 105 }),
        },
      };

      const next = vi.fn();
      await businessMiddleware(stickerUpdate as any, next);

      expect(stickerUpdate.telegram.callApi).toHaveBeenCalledWith('sendMessage', {
        chat_id: 777123,
        text: expect.stringContaining('Assalomu alaykum! 👋✨'),
        parse_mode: 'HTML',
        business_connection_id: 'bconn_test_123',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Sticker Handler in Direct Bot Chat', () => {
    it('should respond warmly when user sends a sticker in bot chat', async () => {
      registerBotHandlers(mockBot);

      const stickerHandlerObj = registeredOn.find((entry) => {
        return typeof entry.filter === 'function' && entry.filter.name === 'sticker';
      }) || registeredOn[1]; // Typically registered on index

      const ctx = {
        from: { id: 12345, username: 'tester', first_name: 'Tester' },
        message: {
          sticker: { file_id: 'stk_abc', emoji: '😊' },
        },
        reply: vi.fn().mockResolvedValue({ message_id: 501 }),
      };

      // Find the handler that handles sticker
      let handlerFound = false;
      for (const entry of registeredOn) {
        try {
          await entry.handler(ctx);
          if (ctx.reply.mock.calls.length > 0) {
            expect(ctx.reply).toHaveBeenCalledWith(
              expect.stringContaining('Assalomu alaykum! 😊✨'),
              expect.objectContaining({ parse_mode: 'HTML' }),
            );
            handlerFound = true;
            break;
          }
        } catch {}
      }
      expect(handlerFound).toBe(true);
    });
  });

  describe('Admin Natural Language Lookup and Stats', () => {
    it('should search and return user card when admin asks about a user', async () => {
      const adminId = config.adminIds[0] || '8191294446';
      registerBotHandlers(mockBot);

      const mockFoundUser = {
        id: 'usr-1',
        telegramId: BigInt(99887766),
        username: 'nodirbek',
        firstName: 'Nodir',
        lastName: 'Karimov',
        language: 'uz',
        isVerified: true,
        isBlocked: false,
        createdAt: new Date('2026-01-01'),
        conversations: [],
        verificationRequests: [
          {
            id: 'v-1',
            status: 'APPROVED',
            proofText: 'Story qildim',
            createdAt: new Date('2026-01-02'),
          },
        ],
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockFoundUser as any);

      // Find the text message handler
      const textHandlerEntry = registeredOn.find(
        (entry) => typeof entry.filter === 'function' && entry.filter.name === 'text',
      ) || registeredOn[registeredOn.length - 1];

      const ctx = {
        from: { id: Number(adminId) },
        message: { text: '@nodirbek haqida ma’lumot ber' },
        reply: vi.fn().mockResolvedValue({ message_id: 201 }),
      };

      await textHandlerEntry.handler(ctx);

      expect(prisma.user.findFirst).toHaveBeenCalled();
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('FOYDALANUVCHI MA’LUMOTLARI'),
        expect.objectContaining({
          parse_mode: 'HTML',
          reply_markup: expect.objectContaining({ inline_keyboard: expect.any(Array) }),
        }),
      );
    });

    it('should return executive system report when admin asks for general statistics', async () => {
      const adminId = config.adminIds[0] || '8191294446';
      registerBotHandlers(mockBot);

      vi.mocked(prisma.user.count).mockResolvedValue(50);
      vi.mocked(prisma.verificationRequest.count).mockResolvedValue(10);
      vi.mocked(prisma.conversation.count).mockResolvedValue(5);

      const textHandlerEntry = registeredOn.find(
        (entry) => typeof entry.filter === 'function' && entry.filter.name === 'text',
      ) || registeredOn[registeredOn.length - 1];

      const ctx = {
        from: { id: Number(adminId) },
        message: { text: 'umumiy hisobotni ko‘rsat' },
        reply: vi.fn().mockResolvedValue({ message_id: 202 }),
      };

      await textHandlerEntry.handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('ZYNYGRAM UMUMIY TIZIM HISOBOTI'),
        expect.objectContaining({ parse_mode: 'HTML' }),
      );
    });
  });
});
