import conversationRepository, {
  ConversationRepository,
} from '../database/repositories/conversation.repository';
import messageRepository, {
  MessageRepository,
} from '../database/repositories/message.repository';
import { Conversation, ConversationStatus, Message, MessageRole } from '@prisma/client';
import logger from '../utils/logger';

export class ConversationService {
  constructor(
    private convRepo: ConversationRepository = conversationRepository,
    private msgRepo: MessageRepository = messageRepository,
  ) {}

  /**
   * Retrieves or creates an active conversation for the given user
   */
  public async getOrCreateActiveConversation(userId: string): Promise<Conversation> {
    let conversation = await this.convRepo.findActiveByUserId(userId);
    if (!conversation) {
      conversation = await this.convRepo.createConversation(userId, ConversationStatus.AI_HANDLED);
      logger.info({ conversationId: conversation.id, userId }, 'New conversation initiated');
    }
    return conversation;
  }

  /**
   * Appends a message to the conversation
   */
  public async saveMessage(
    conversationId: string,
    role: MessageRole,
    content: string,
    telegramMessageId?: bigint | number | string | null,
  ): Promise<Message> {
    return this.msgRepo.createMessage({
      conversationId,
      role,
      content,
      telegramMessageId,
    });
  }

  /**
   * Retrieves recent messages for context memory
   */
  public async getRecentMessages(conversationId: string, limit = 15): Promise<Message[]> {
    return this.msgRepo.getRecentMessages(conversationId, limit);
  }

  /**
   * Updates conversation status
   */
  public async updateStatus(conversationId: string, status: ConversationStatus): Promise<Conversation> {
    return this.convRepo.updateStatus(conversationId, status);
  }

  public async setBusinessConnection(
    conversationId: string,
    businessConnectionId: string,
    businessChatId: string | number | bigint,
  ): Promise<Conversation> {
    return this.convRepo.setBusinessConnection(conversationId, businessConnectionId, businessChatId);
  }

  /**
   * Closes a conversation
   */
  public async closeConversation(conversationId: string): Promise<Conversation> {
    return this.convRepo.updateStatus(conversationId, ConversationStatus.CLOSED);
  }

  /**
   * Reopens a conversation
   */
  public async reopenConversation(conversationId: string): Promise<Conversation> {
    return this.convRepo.updateStatus(conversationId, ConversationStatus.OPEN);
  }

  /**
   * Finds a conversation by ID
   */
  public async getConversation(conversationId: string): Promise<Conversation | null> {
    return this.convRepo.findById(conversationId);
  }

  /**
   * Counts active / waiting / closed conversations
   */
  public async getConversationStats(): Promise<{
    total: number;
    open: number;
    aiHandled: number;
    waitingHuman: number;
    closed: number;
  }> {
    const [total, open, aiHandled, waitingHuman, closed] = await Promise.all([
      this.convRepo.countByStatus(),
      this.convRepo.countByStatus(ConversationStatus.OPEN),
      this.convRepo.countByStatus(ConversationStatus.AI_HANDLED),
      this.convRepo.countByStatus(ConversationStatus.WAITING_HUMAN),
      this.convRepo.countByStatus(ConversationStatus.CLOSED),
    ]);

    return { total, open, aiHandled, waitingHuman, closed };
  }

  /**
   * Retrieves recent user inquiries and conversations
   */
  public async getRecentInquiries(limit = 10) {
    return this.convRepo.getRecentInquiries(limit);
  }

  /**
   * Paged conversations with message preview for Admin Web Panel
   */
  public async getConversationsPaged(options: {
    status?: ConversationStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ conversations: any[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.status) {
      where.status = options.status;
    }
    if (options.search && options.search.trim()) {
      const term = options.search.trim();
      const isNum = /^\d+$/.test(term);
      where.OR = [
        { user: { username: { contains: term, mode: 'insensitive' } } },
        { user: { firstName: { contains: term, mode: 'insensitive' } } },
        { user: { lastName: { contains: term, mode: 'insensitive' } } },
        ...(isNum ? [{ user: { telegramId: BigInt(term) } }] : []),
      ];
    }

    const prisma = (await import('../database/prisma')).default;
    const [total, conversations] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.conversation.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              telegramId: true,
              username: true,
              firstName: true,
              lastName: true,
              isVerified: true,
              isBlocked: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      conversations: conversations.map((c) => ({
        ...c,
        user: {
          ...c.user,
          telegramId: c.user.telegramId.toString(),
        },
        lastMessage: c.messages[0]
          ? {
              ...c.messages[0],
              telegramMessageId: c.messages[0].telegramMessageId
                ? c.messages[0].telegramMessageId.toString()
                : null,
            }
          : null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves full conversation message history for Admin Web Panel
   */
  public async getConversationMessages(conversationId: string): Promise<any[]> {
    const prisma = (await import('../database/prisma')).default;
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((m) => ({
      ...m,
      telegramMessageId: m.telegramMessageId ? m.telegramMessageId.toString() : null,
    }));
  }
}

export const conversationService = new ConversationService();
export default conversationService;
