import { Telegraf } from 'telegraf';
import config from '../config/env';
import logger from '../utils/logger';
import { botErrorHandler, createRateLimitMiddleware } from './middleware';
import { registerBotHandlers } from './handlers';
import { registerChatAutomationHandlers } from './automation';
import escalationService from '../services/escalation';

export const bot = new Telegraf(config.botToken);

/**
 * Initializes Telegraf bot with middleware, handlers, error boundaries,
 * and Telegram Business / Chat Automation integration.
 */
export function initBot(): Telegraf {
  // Error handling boundary
  bot.catch(botErrorHandler);

  // Rate limiting middleware
  bot.use(createRateLimitMiddleware());

  // Bind bot instance to escalation service for admin/support group alerts
  escalationService.setBot(bot);

  // Register command and message handlers
  registerBotHandlers(bot);

  // Register Telegram Business / Chat Automation handlers
  registerChatAutomationHandlers(bot);

  logger.info('Telegraf bot configured successfully');
  return bot;
}

/**
 * Starts the Telegram bot in long polling mode
 */
export async function startBot(): Promise<void> {
  try {
    initBot();

    // Check bot token validity with getMe
    const botInfo = await bot.telegram.getMe();
    logger.info(
      { username: botInfo.username, id: botInfo.id, canJoinGroups: botInfo.can_join_groups },
      'Telegram bot authenticated successfully',
    );

    // Launch polling in background
    bot.launch({
      dropPendingUpdates: true,
    }).catch((err: unknown) => {
      logger.error({ error: err }, 'Telegram bot polling error');
    });

    logger.info('Telegram bot polling started');
  } catch (error) {
    logger.error({ error }, 'Failed to start Telegram bot');
    throw error;
  }
}

/**
 * Gracefully stops the Telegram bot
 */
export function stopBot(reason = 'Shutdown'): void {
  logger.info({ reason }, 'Stopping Telegram bot');
  bot.stop(reason);
}

export default bot;
