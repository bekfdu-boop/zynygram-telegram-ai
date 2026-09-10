import { Telegraf } from 'telegraf';
import supportService, { SupportService } from '../services/support';
import logger from '../utils/logger';

/**
 * Telegram Chat Automation (Telegram Business) handler.
 *
 * OFFICIAL ARCHITECTURE NOTE:
 * In accordance with Telegram Bot API 7.2+, Telegram Business users can connect
 * an official Telegram bot to their personal or business account for Chat Automation.
 *
 * When enabled by the user in Telegram Settings -> Telegram Business -> Chatbots:
 * 1. Telegram delivers `business_connection` updates when connected/disconnected.
 * 2. Telegram legitimately delivers incoming customer messages via `business_message` updates.
 * 3. The bot responds via the official Bot API using the provided `business_connection_id`.
 *
 * This implementation strictly adheres to official Telegram Bot API capabilities
 * and does NOT use unofficial MTProto userbots, session strings, or password requests.
 */
export function registerChatAutomationHandlers(
  bot: Telegraf,
  support: SupportService = supportService,
): void {
  bot.use(async (ctx, next) => {
    const update = ctx.update as unknown as Record<string, unknown>;

    // 1. Handle Business Connection Updates
    if ('business_connection' in update && update.business_connection) {
      const conn = update.business_connection as {
        id?: string;
        user?: { id?: number; username?: string };
        is_enabled?: boolean;
        can_reply?: boolean;
      };

      logger.info(
        {
          connectionId: conn.id,
          user: conn.user?.username || conn.user?.id,
          isEnabled: conn.is_enabled,
          canReply: conn.can_reply,
        },
        'Telegram Business connection status updated',
      );
      return;
    }

    // 2. Handle Incoming Business Messages (Chat Automation)
    if ('business_message' in update && update.business_message) {
      const msg = update.business_message as {
        business_connection_id?: string;
        message_id?: number;
        chat?: { id: number | string };
        from?: { id: number; username?: string; first_name?: string; last_name?: string };
        text?: string;
      };

      const connectionId = msg.business_connection_id;
      const fromUser = msg.from;
      const text = typeof msg.text === 'string' ? msg.text : undefined;
      const chatId = msg.chat?.id;

      if (!fromUser || !text || !chatId) {
        return;
      }

      logger.info(
        {
          connectionId,
          fromUserId: fromUser.id,
          chatId,
        },
        'Received automated business message via Telegram Chat Automation',
      );

      try {
        const result = await support.handleUserMessage({
          telegramId: fromUser.id,
          username: fromUser.username,
          firstName: fromUser.first_name,
          lastName: fromUser.last_name,
          text,
          telegramMessageId: msg.message_id,
        });

        if (result.replyText) {
          logger.info(
            { chatId, connectionId, replyPreview: result.replyText.substring(0, 50) },
            'Sending automated business message reply via Telegram Bot API',
          );
          // Send reply within the business chat context using official business_connection_id
          await ctx.telegram.callApi('sendMessage', {
            chat_id: chatId,
            text: result.replyText,
            business_connection_id: connectionId,
          } as never);
          logger.info({ chatId, connectionId }, 'Automated reply sent successfully');
        }
      } catch (error) {
        logger.error(
          {
            error: error instanceof Error ? error.message : String(error),
            connectionId,
            chatId,
          },
          'Failed to process business message in chat automation',
        );
      }
      return;
    }

    return next();
  });

  logger.info('Telegram Chat Automation / Business handlers registered');
}

export default registerChatAutomationHandlers;
