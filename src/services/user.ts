import userRepository, { UserRepository } from '../database/repositories/user.repository';
import { User } from '@prisma/client';
import logger from '../utils/logger';

export class UserService {
  constructor(private userRepo: UserRepository = userRepository) {}

  /**
   * Resolves or registers a user based on incoming Telegram user data
   */
  public async getOrCreateUser(data: {
    telegramId: bigint | string | number;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    language?: string | null;
  }): Promise<User> {
    const user = await this.userRepo.upsertUser(data);
    logger.debug({ userId: user.id, telegramId: user.telegramId.toString() }, 'User resolved');
    return user;
  }

  /**
   * Checks if user is blocked from using the bot
   */
  public async isUserBlocked(telegramId: bigint | string | number): Promise<boolean> {
    const user = await this.userRepo.findByTelegramId(telegramId);
    return user?.isBlocked ?? false;
  }

  /**
   * Sets blocked status for a user
   */
  public async setBlocked(telegramId: bigint | string | number, isBlocked: boolean): Promise<User> {
    const user = await this.userRepo.setBlockedStatus(telegramId, isBlocked);
    logger.info(
      { telegramId: telegramId.toString(), isBlocked },
      `User ${isBlocked ? 'blocked' : 'unblocked'}`,
    );
    return user;
  }

  /**
   * Returns user by Telegram ID
   */
  public async findByTelegramId(telegramId: bigint | string | number): Promise<User | null> {
    return this.userRepo.findByTelegramId(telegramId);
  }

  /**
   * Sets verification status for a user
   */
  public async setVerified(telegramId: bigint | string | number, isVerified: boolean): Promise<User> {
    const user = await this.userRepo.setVerifiedStatus(telegramId, isVerified);
    logger.info(
      { telegramId: telegramId.toString(), isVerified },
      `User verification badge ${isVerified ? 'granted' : 'revoked'}`,
    );
    return user;
  }

  /**
   * Returns stats about users
   */
  public async getUserCount(): Promise<number> {
    return this.userRepo.countUsers();
  }

  /**
   * Returns recent users
   */
  public async getRecentUsers(limit = 10): Promise<User[]> {
    return this.userRepo.getRecentUsers(limit);
  }

  /**
   * Paged users list with filters for Admin Web Panel
   */
  public async getUsersPaged(options: {
    search?: string;
    page?: number;
    limit?: number;
    isVerified?: boolean;
    isBlocked?: boolean;
  }): Promise<{ users: any[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (typeof options.isVerified === 'boolean') {
      where.isVerified = options.isVerified;
    }
    if (typeof options.isBlocked === 'boolean') {
      where.isBlocked = options.isBlocked;
    }
    if (options.search && options.search.trim()) {
      const term = options.search.trim();
      const isNum = /^\d+$/.test(term);
      where.OR = [
        { username: { contains: term, mode: 'insensitive' } },
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        ...(isNum ? [{ telegramId: BigInt(term) }] : []),
      ];
    }

    const prisma = (await import('../database/prisma')).default;
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          _count: {
            select: {
              conversations: true,
              verificationRequests: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      users: users.map((u) => ({
        ...u,
        telegramId: u.telegramId.toString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const userService = new UserService();
export default userService;

