import prisma from '../prisma';
import { Message, MessageRole } from '@prisma/client';

export class MessageRepository {
  /**
   * Saves a message to the database
   */
  public async createMessage(data: {
    conversationId: string;
    role: MessageRole;
    content: string;
    telegramMessageId?: bigint | number | string | null;
  }): Promise<Message> {
    const tgMsgId =
      data.telegramMessageId != null
        ? typeof data.telegramMessageId === 'bigint'
          ? data.telegramMessageId
          : BigInt(data.telegramMessageId)
        : null;

    return prisma.message.create({
      data: {
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        telegramMessageId: tgMsgId,
      },
    });
  }

  /**
   * Retrieves the most recent messages for a conversation in chronological order
   */
  public async getRecentMessages(conversationId: string, limit = 15): Promise<Message[]> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Reverse so messages are in chronological order (oldest -> newest)
    return messages.reverse();
  }

  /**
   * Counts total messages stored
   */
  public async countMessages(): Promise<number> {
    return prisma.message.count();
  }
}

export const messageRepository = new MessageRepository();
export default messageRepository;

