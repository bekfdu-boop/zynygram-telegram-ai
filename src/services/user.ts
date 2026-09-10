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
}

export const userService = new UserService();
export default userService;

