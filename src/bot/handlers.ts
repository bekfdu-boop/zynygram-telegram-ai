import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import supportService, { SupportService } from '../services/support';
import userService, { UserService } from '../services/user';
import conversationService, { ConversationService } from '../services/conversation';
import escalationService, { EscalationService } from '../services/escalation';
import { isAuthorizedAdmin } from './middleware';
import { ConversationStatus } from '@prisma/client';
import logger from '../utils/logger';

export const START_MESSAGE = `Assalomu alaykum! 👋

Men Zynygram AI Support yordamchisiman.

Zynygram, akkaunt, tasdiqlash belgisi, reklama hamkorligi yoki texnik muammolar bo‘yicha savollaringizga yordam beraman.

Agar operator bilan bog‘lanmoqchi bo‘lsangiz:
/human`;

export const HELP_MESSAGE = `ℹ️ Zynygram AI Support bo‘yicha qo‘llanma:

Mavjud buyruqlar:
/start - Botni qayta ishga tushirish va tanishuv
/help - Ushbu yordam xabari
/support - Yordam xizmati haqida ma'lumot
/human - Tirik operator bilan bog‘lanish
/status - Joriy suhbatingiz holatini tekshirish

Savolingizni to‘g‘ridan-to‘g‘ri oddiy matn ko‘rinishida yozishingiz mumkin (o‘zbek, rus yoki ingliz tilida).

Eslatma: Xavfsizlik yuzasidan shaxsiy parollaringiz yoki SMS tasdiqlash kodlarini hech qachon yubormang!`;

export const SUPPORT_MESSAGE = `🤝 Zynygram Qo‘llab-quvvatlash Xizmati

Biz ijtimoiy tarmoqdan foydalanish, profil sozlamalari, postlar, media yuklash hamda AI vositalari (rasm va video yaratish) bo‘yicha yordam beramiz.

Savolingizni yozib yuboring yoki tirik mutaxassis bilan bog‘lanish uchun /human buyrug‘ini bosing.`;

export const UNSUPPORTED_CONTENT_MESSAGE =
  'Hozircha ushbu turdagi xabarni avtomatik qayta ishlay olmayman. Iltimos, savolingizni matn ko‘rinishida yuboring.';

export const UNAUTHORIZED_ADMIN_MESSAGE = 'Bu buyruq faqat administratorlar uchun.';

export function registerBotHandlers(
  bot: Telegraf,
  support: SupportService = supportService,
  users: UserService = userService,
  conversations: ConversationService = conversationService,
  escalations: EscalationService = escalationService,
): void {
  // /start command
  bot.command('start', async (ctx) => {
    const fromUser = ctx.from;
    if (fromUser) {
      try {
        await users.getOrCreateUser({
          telegramId: fromUser.id,
          username: fromUser.username,
          firstName: fromUser.first_name,
          lastName: fromUser.last_name,
          language: fromUser.language_code,
        });
      } catch (err) {
        logger.error({ error: err }, 'Failed to persist user on /start command');
      }
    }
    await ctx.reply(START_MESSAGE);
  });

  // /help command
  bot.command('help', async (ctx) => {
    await ctx.reply(HELP_MESSAGE);
  });

  // /support command
  bot.command('support', async (ctx) => {
    await ctx.reply(SUPPORT_MESSAGE);
  });

  // /human command (Human Escalation)
  bot.command('human', async (ctx) => {
    const fromUser = ctx.from;
    if (!fromUser) return;

    const user = await users.getOrCreateUser({
      telegramId: fromUser.id,
      username: fromUser.username,
      firstName: fromUser.first_name,
      lastName: fromUser.last_name,
    });

    const activeConv = await conversations.getOrCreateActiveConversation(user.id);

    const result = await escalations.escalateToHuman({
      conversationId: activeConv.id,
      telegramId: fromUser.id,
      username: fromUser.username,
      firstName: fromUser.first_name,
      lastMessageContent: '/human buyrug‘i yuborildi',
    });

    await ctx.reply(result.userMessage);
  });

  // /status command
  bot.command('status', async (ctx) => {
    const fromUser = ctx.from;
    if (!fromUser) return;

    const user = await users.findByTelegramId(fromUser.id);
    if (!user) {
      await ctx.reply('Sizda faol murojaat topilmadi. Savolingizni yozib qoldirishingiz mumkin.');
      return;
    }

    const activeConv = await conversations.getOrCreateActiveConversation(user.id);

    let statusText = 'Faol';
    if (activeConv.status === ConversationStatus.AI_HANDLED) {
      statusText = '🤖 AI yordamchi tomonidan xizmat ko‘rsatilmoqda';
    } else if (activeConv.status === ConversationStatus.WAITING_HUMAN) {
      statusText = '⏳ Tirik operator navbatida kutilmoqda';
    } else if (activeConv.status === ConversationStatus.CLOSED) {
      statusText = '✅ Yopilgan';
    } else if (activeConv.status === ConversationStatus.OPEN) {
      statusText = '🟢 Ochiq';
    }

    await ctx.reply(
      `📋 Sizning suhbat holatingiz:\n\nID: ${activeConv.id}\nHolat: ${statusText}\nBoshlangan vaqti: ${activeConv.createdAt.toLocaleString()}`,
    );
  });

  // -------------------------------------------------------------
  // ADMIN COMMANDS
  // -------------------------------------------------------------

  // /admin menu
  bot.command('admin', async (ctx) => {
    if (!isAuthorizedAdmin(ctx)) {
      await ctx.reply(UNAUTHORIZED_ADMIN_MESSAGE);
      return;
    }

    const adminText = `🛠 Zynygram Admin Panel:

/stats - Tizim statistikasi (foydalanuvchilar, suhbatlar)
/users - So‘nggi foydalanuvchilar ro‘yxati
/open <conversationId> - Suhbatni qayta ochish
/close <conversationId> - Suhbatni yopish
/block <telegramId> - Foydalanuvchini bloklash
/unblock <telegramId> - Blokdan chiqarish`;

    await ctx.reply(adminText);
  });

  // /stats
  bot.command('stats', async (ctx) => {
    if (!isAuthorizedAdmin(ctx)) {
      await ctx.reply(UNAUTHORIZED_ADMIN_MESSAGE);
      return;
    }

    const [userCount, convStats] = await Promise.all([
      users.getUserCount(),
      conversations.getConversationStats(),
    ]);

    const statsReport = `📊 Tizim Statistikasi:

👥 Jami foydalanuvchilar: ${userCount}
💬 Jami suhbatlar: ${convStats.total}
🤖 AI javob berayotgan: ${convStats.aiHandled}
⏳ Operator kutayotgan: ${convStats.waitingHuman}
🟢 Ochiq: ${convStats.open}
✅ Yopilgan: ${convStats.closed}`;

    await ctx.reply(statsReport);
  });

  // /users
  bot.command('users', async (ctx) => {
    if (!isAuthorizedAdmin(ctx)) {
      await ctx.reply(UNAUTHORIZED_ADMIN_MESSAGE);
      return;
    }

    const recent = await users.getRecentUsers(10);
    if (recent.length === 0) {
      await ctx.reply('Hozircha foydalanuvchilar yo‘q.');
      return;
    }

    const userList = recent
      .map(
        (u, i) =>
          `${i + 1}. ${u.username ? `@${u.username}` : u.firstName || 'No name'} (ID: ${u.telegramId.toString()}) - ${u.isBlocked ? '🚫 Bloklangan' : '✅ Faol'}`,
      )
      .join('\n');

    await ctx.reply(`👥 So‘nggi 10 ta foydalanuvchi:\n\n${userList}`);
  });

  // /open <conversationId>
  bot.command('open', async (ctx) => {
    if (!isAuthorizedAdmin(ctx)) {
      await ctx.reply(UNAUTHORIZED_ADMIN_MESSAGE);
      return;
    }

    const args = ctx.message.text.split(' ').slice(1);
    const convId = args[0]?.trim();
    if (!convId) {
      await ctx.reply('Ishlatish: /open <conversationId>');
      return;
    }

    try {
      await conversations.reopenConversation(convId);
      await ctx.reply(`✅ Suhbat (${convId}) qayta ochildi.`);
    } catch {
      await ctx.reply(`❌ Suhbat topilmadi yoki xatolik yuz berdi.`);
    }
  });

  // /close <conversationId>
  bot.command('close', async (ctx) => {
    if (!isAuthorizedAdmin(ctx)) {
      await ctx.reply(UNAUTHORIZED_ADMIN_MESSAGE);
      return;
    }

    const args = ctx.message.text.split(' ').slice(1);
    const convId = args[0]?.trim();
    if (!convId) {
      await ctx.reply('Ishlatish: /close <conversationId>');
      return;
    }

    try {
      await conversations.closeConversation(convId);
      await ctx.reply(`✅ Suhbat (${convId}) yopildi.`);
    } catch {
      await ctx.reply(`❌ Suhbat topilmadi yoki xatolik yuz berdi.`);
    }
  });

  // /block <telegramId>
  bot.command('block', async (ctx) => {
    if (!isAuthorizedAdmin(ctx)) {
      await ctx.reply(UNAUTHORIZED_ADMIN_MESSAGE);
      return;
    }

    const args = ctx.message.text.split(' ').slice(1);
    const targetId = args[0]?.trim();
    if (!targetId) {
      await ctx.reply('Ishlatish: /block <telegramId>');
      return;
    }

    try {
      await users.setBlocked(targetId, true);
      await ctx.reply(`🚫 Foydalanuvchi (${targetId}) bloklandi.`);
    } catch {
      await ctx.reply(`❌ Foydalanuvchi topilmadi yoki xatolik yuz berdi.`);
    }
  });

  // /unblock <telegramId>
  bot.command('unblock', async (ctx) => {
    if (!isAuthorizedAdmin(ctx)) {
      await ctx.reply(UNAUTHORIZED_ADMIN_MESSAGE);
      return;
    }

    const args = ctx.message.text.split(' ').slice(1);
    const targetId = args[0]?.trim();
    if (!targetId) {
      await ctx.reply('Ishlatish: /unblock <telegramId>');
      return;
    }

    try {
      await users.setBlocked(targetId, false);
      await ctx.reply(`✅ Foydalanuvchi (${targetId}) blokdan chiqarildi.`);
    } catch {
      await ctx.reply(`❌ Foydalanuvchi topilmadi yoki xatolik yuz berdi.`);
    }
  });

  // -------------------------------------------------------------
  // NON-TEXT CONTENT HANDLERS (voice, video, stickers, files)
  // -------------------------------------------------------------
  bot.on(
    [
      message('voice'),
      message('video'),
      message('sticker'),
      message('document'),
      message('photo'),
      message('audio'),
      message('video_note'),
    ],
    async (ctx) => {
      logger.info({ userId: ctx.from?.id }, 'Unsupported media type received');
      await ctx.reply(UNSUPPORTED_CONTENT_MESSAGE);
    },
  );

  // -------------------------------------------------------------
  // REGULAR TEXT MESSAGE HANDLER
  // -------------------------------------------------------------
  bot.on(message('text'), async (ctx) => {
    const fromUser = ctx.from;
    const text = ctx.message.text;

    // Ignore commands already caught
    if (text.startsWith('/')) {
      return;
    }

    logger.debug(
      { userId: fromUser.id, length: text.length },
      'Processing user support text message',
    );

    const result = await support.handleUserMessage({
      telegramId: fromUser.id,
      username: fromUser.username,
      firstName: fromUser.first_name,
      lastName: fromUser.last_name,
      text,
      telegramMessageId: ctx.message.message_id,
    });

    if (result.replyText) {
      await ctx.reply(result.replyText);
    }
  });

  logger.info('Telegram bot command and message handlers registered');
}

export default registerBotHandlers;

