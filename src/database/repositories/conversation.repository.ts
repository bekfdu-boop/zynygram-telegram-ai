import prisma from '../prisma';
import { Conversation, ConversationStatus } from '@prisma/client';

export class ConversationRepository {
  /**
   * Finds the latest active (non-closed) conversation for a user
   */
  public async findActiveByUserId(userId: string): Promise<Conversation | null> {
    return prisma.conversation.findFirst({
      where: {
        userId,
        status: {
          not: ConversationStatus.CLOSED,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Finds a conversation by its ID
   */
  public async findById(id: string): Promise<Conversation | null> {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  /**
   * Creates a new conversation
   */
  public async createConversation(
    userId: string,
    status: ConversationStatus = ConversationStatus.AI_HANDLED,
  ): Promise<Conversation> {
    return prisma.conversation.create({
      data: {
        userId,
        status,
      },
    });
  }

  /**
   * Updates conversation status (e.g. AI_HANDLED, WAITING_HUMAN, CLOSED, OPEN)
   */
  public async updateStatus(id: string, status: ConversationStatus): Promise<Conversation> {
    return prisma.conversation.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Assigns a conversation to an operator
   */
  public async assignTo(id: string, assignedTo: string | null): Promise<Conversation> {
    return prisma.conversation.update({
      where: { id },
      data: { assignedTo },
    });
  }

  /**
   * Counts conversations optionally filtered by status
   */
  public async countByStatus(status?: ConversationStatus): Promise<number> {
    return prisma.conversation.count({
      where: status ? { status } : undefined,
    });
  }

  /**
   * Gets recent conversations
   */
  public async getRecentConversations(limit = 10): Promise<Conversation[]> {
    return prisma.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        user: true,
      },
    });
  }

  /**
   * Retrieves recent inquiries with user and their latest message
   */
  public async getRecentInquiries(limit = 10) {
    return prisma.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        user: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }
}

export const conversationRepository = new ConversationRepository();
export default conversationRepository;

