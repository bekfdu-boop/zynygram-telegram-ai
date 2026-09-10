import { Telegraf } from 'telegraf';
import supportService, { SupportService } from '../services/support';
import verificationService, { VerificationService } from '../services/verification';
import config from '../config/env';
import logger from '../utils/logger';
import { escapeTelegramHtml } from '../utils/text';

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
  verification: VerificationService = verificationService,
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
      const photoArray = (msg as { photo?: Array<{ file_id: string }> }).photo;
      const caption = (msg as { caption?: string }).caption;

      if (!fromUser || !chatId || (!text && !photoArray)) {
        return;
      }

      // Ignore messages sent by the business owner / admin themselves
      if (
        config.adminIds.includes(fromUser.id.toString())
      ) {
        logger.debug({ fromUserId: fromUser.id }, 'Ignoring business message sent by admin / business owner');
        return;
      }

      logger.info(
        {
          connectionId,
          fromUserId: fromUser.id,
          chatId,
          hasPhoto: !!photoArray,
        },
        'Received automated business message via Telegram Chat Automation',
      );

      // Handle photo proof submission in business chat
      if (photoArray && photoArray.length > 0) {
        const photoFileId = photoArray[photoArray.length - 1].file_id;
        try {
          const vResult = await verification.submitVerificationRequest({
            telegramId: fromUser.id,
            username: fromUser.username,
            firstName: fromUser.first_name,
            lastName: fromUser.last_name,
            proofText: caption || '📸 Foydalanuvchi skrinshot yubordi',
            photoFileId,
            businessConnectionId: connectionId,
            chatId,
          });

          let photoReply = vResult.userMessage;
          const lowerCaption = (caption || '').toLowerCase();
          const hasUsernameInCaption =
            (caption || '').includes('@') ||
            lowerCaption.includes('nik') ||
            lowerCaption.includes('user') ||
            lowerCaption.includes('profil');

          if (!hasUsernameInCaption) {
            photoReply +=
              '\n\n💡 <b>Muhim eslatma:</b>\nAgar hali yozmagan bo‘lsangiz, tasdiqlash nishoni berilishi kerak bo‘lgan <b>Zynygram ilovasidagi foydalanuvchi nomingizni (username / nikingizni)</b> ham shu yerga yozib yuboring! 📱🛡';
          }

          await ctx.telegram.callApi('sendMessage', {
            chat_id: chatId,
            text: photoReply,
            parse_mode: 'HTML',
            business_connection_id: connectionId,
          } as never);
          return;
        } catch (vErr) {
          logger.error({ error: vErr }, 'Failed to submit verification photo via business message');
        }
      }

      if (!text) {
        return;
      }

      // Check if incoming business message is a verification link or proof submission
      const hasLink =
        text.includes('http://') ||
        text.includes('https://') ||
        text.includes('t.me/') ||
        text.includes('instagram.com/') ||
        text.includes('tiktok.com/') ||
        text.includes('youtu.be/');

      const lowerText = text.toLowerCase();
      const mentionsVerification =
        lowerText.includes('tasdiqlash') ||
        lowerText.includes('verifikatsiya') ||
        lowerText.includes('nishon') ||
        lowerText.includes('belgi') ||
        lowerText.includes('reels') ||
        lowerText.includes('story') ||
        lowerText.includes('stori') ||
        lowerText.includes('shart') ||
        lowerText.includes('bajardim') ||
        lowerText.includes('tekshir') ||
        lowerText.includes('post') ||
        lowerText.includes('kanal');

      const isVerificationSubmission = mentionsVerification && (hasLink || /@[a-zA-Z0-9_.]{3,30}/.test(text));
      if (isVerificationSubmission) {
        logger.info(
          { fromUserId: fromUser.id, chatId, textPreview: text.substring(0, 40) },
          'Incoming business message identified as verification submission',
        );

        try {
          const vResult = await verification.submitVerificationRequest({
            telegramId: fromUser.id,
            username: fromUser.username,
            firstName: fromUser.first_name,
            lastName: fromUser.last_name,
            proofText: text,
            businessConnectionId: connectionId,
            chatId,
          });

          let textReply = vResult.userMessage;
          const hasUsernameInText =
            text.includes('@') ||
            lowerText.includes('nik') ||
            lowerText.includes('user') ||
            lowerText.includes('profil') ||
            lowerText.includes('login');

          if (!hasUsernameInText) {
            textReply +=
              '\n\n💡 <b>Muhim eslatma:</b>\nAgar hali yozmagan bo‘lsangiz, tasdiqlash nishoni berilishi kerak bo‘lgan <b>Zynygram ilovasidagi foydalanuvchi nomingizni (username / nikingizni)</b> ham shu yerga yozib yuboring! 📱🛡';
          }

          await ctx.telegram.callApi('sendMessage', {
            chat_id: chatId,
            text: textReply,
            parse_mode: 'HTML',
            business_connection_id: connectionId,
          } as never);
          return;
        } catch (vErr) {
          logger.error({ error: vErr }, 'Failed to submit verification via business message');
        }
      }

      // Feedback / Suggestion / Problem detection in business chat
      const isFeedback =
        lowerText.includes('taklif') ||
        lowerText.includes('muammo') ||
        lowerText.includes('shikoyat') ||
        lowerText.includes('xatolik') ||
        lowerText.includes('ishlamayapti') ||
        lowerText.includes('fikr') ||
        lowerText.includes('maslahat') ||
        lowerText.includes('bug');

      if (isFeedback) {
        const userHandle = fromUser.username ? `@${fromUser.username}` : fromUser.first_name || 'Mijoz';
      const feedbackAlert = `📩 <b>YANGI TAKLIF YOKI MUAMMO MUROJAATI!</b> 🌟\n\n👤 <b>Foydalanuvchi:</b> ${escapeTelegramHtml(userHandle)}\n🆔 <b>Telegram ID:</b> <code>${fromUser.id}</code>\n💬 <b>Chat:</b> <i>Telegram Business Chat</i>\n🕒 <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}\n\n💬 <b>Murojaat matni:</b>\n<i>"${escapeTelegramHtml(text)}"</i>`;

        try {
          const feedbackTarget = config.supportGroupId || config.adminIds[0];
          if (feedbackTarget) {
            await ctx.telegram.sendMessage(feedbackTarget, feedbackAlert, { parse_mode: 'HTML' });
          } else {
            logger.warn('Business feedback received but no support recipient is configured');
          }
        } catch (err) {
          logger.error({ error: err }, 'Failed to forward business feedback alert to admin');
        }

        await ctx.telegram.callApi('sendMessage', {
          chat_id: chatId,
          text: 'Rahmat! Siz yuborgan taklif yoki muammo <i>ma’muriyatimizga yetkazildi</i>. 📩\n\nFikringiz <b>Zynygram</b> loyihasini yanada yaxshilashda biz uchun juda qadrlidir! 🤝✨',
          parse_mode: 'HTML',
          business_connection_id: connectionId,
        } as never);
        return;
      }

      try {
        const result = await support.handleUserMessage({
          telegramId: fromUser.id,
          username: fromUser.username,
          firstName: fromUser.first_name,
          lastName: fromUser.last_name,
          text,
          telegramMessageId: msg.message_id,
          businessConnectionId: connectionId,
          businessChatId: chatId,
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
