import prisma from '../prisma';
import { User } from '@prisma/client';

export class UserRepository {
  /**
   * Finds user by their Telegram ID
   */
  public async findByTelegramId(telegramId: bigint | string | number): Promise<User | null> {
    const bigIntId = typeof telegramId === 'bigint' ? telegramId : BigInt(telegramId);
    return prisma.user.findUnique({
      where: { telegramId: bigIntId },
    });
  }

  /**
   * Finds user by internal database ID
   */
  public async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Finds existing user or creates a new one with updated metadata
   */
  public async upsertUser(data: {
    telegramId: bigint | string | number;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    language?: string | null;
  }): Promise<User> {
    const bigIntId = typeof data.telegramId === 'bigint' ? data.telegramId : BigInt(data.telegramId);

    return prisma.user.upsert({
      where: { telegramId: bigIntId },
      update: {
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        ...(data.language ? { language: data.language } : {}),
      },
      create: {
        telegramId: bigIntId,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        language: data.language || 'uz',
      },
    });
  }

  /**
   * Blocks or unblocks a user
   */
  public async setBlockedStatus(telegramId: bigint | string | number, isBlocked: boolean): Promise<User> {
    const bigIntId = typeof telegramId === 'bigint' ? telegramId : BigInt(telegramId);
    return prisma.user.update({
      where: { telegramId: bigIntId },
      data: { isBlocked },
    });
  }

  /**
   * Sets verification badge status for a user
   */
  public async setVerifiedStatus(telegramId: bigint | string | number, isVerified: boolean): Promise<User> {
    const bigIntId = typeof telegramId === 'bigint' ? telegramId : BigInt(telegramId);
    return prisma.user.update({
      where: { telegramId: bigIntId },
      data: { isVerified },
    });
  }

  /**
   * Counts total registered users
   */
  public async countUsers(): Promise<number> {
    return prisma.user.count();
  }

  /**
   * Gets recent users
   */
  public async getRecentUsers(limit = 10): Promise<User[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const userRepository = new UserRepository();
export default userRepository;

