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
}

export const conversationService = new ConversationService();
export default conversationService;

