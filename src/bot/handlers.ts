import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import supportService, { SupportService } from '../services/support';
import userService, { UserService } from '../services/user';
import conversationService, { ConversationService } from '../services/conversation';
import escalationService, { EscalationService } from '../services/escalation';
import verificationService, {
  VerificationService,
  PRIMARY_ADMIN_TELEGRAM_ID,
} from '../services/verification';
import {
  getUserMainMenu,
  getAdminMainMenu,
  USER_MENU_BUTTONS,
  ADMIN_MENU_BUTTONS,
} from './keyboards';
import { ConversationStatus } from '@prisma/client';
import config from '../config/env';
import logger from '../utils/logger';

export const VERIFY_INFO_MESSAGE = `🛡 Zynygram Tasdiqlash Nishonini Olish Shartlari:

Rasmiy tasdiqlash nishonini (ko‘k belgi) olish uchun quyidagi 2 ta rasmiy shartdan birini bajaring:

1️⃣ 1-variant (Instagram yoki Telegram Story / Reels):
Rasmiy https://t.me/Zynygram_media/2 postimizni Instagram yoki Telegram profilingizda Story yoki Reels qilib ulashing.

2️⃣ 2-variant (Telegram kanallarda tarqatish):
YOKI rasmiy https://t.me/zynygram/21 postimizni Telegram kanallarda tarqating.

✨ Shartni bajargach:
Postingiz yoki kanalingiz havolasini (linkini) to‘g‘ridan-to‘g‘ri shu yerga yozib yuboring. Mutaxassislarimiz tez orada ko‘rib chiqib, profilingizni tasdiqlashadi!`;

export const START_MESSAGE = `Assalomu alaykum! Xush kelibsiz! 👋

Zynygram rasmiy mijozlar bilan ishlash bo‘limi sizga yordam berishga tayyor.

Akkaunt sozlamalari, tasdiqlash nishonini olish, taklif va mulohazalar yoki ilovadagi istalgan masala bo‘yicha sizni tinglaymiz.

Quyidagi menyudan kerakli bo‘limni tanlashingiz yoki savolingizni to‘g‘ridan-to‘g‘ri yozib qoldirishingiz mumkin:`;

export const ADMIN_START_MESSAGE = `👋 Xush kelibsiz, Administrator!

Zynygram boshqaruv panelidasiz.
Quyidagi menyu orqali taklif va murojaatlarni kuzatib borishingiz, verifikatsiya statistikasini ko‘rishingiz va arizalarni tasdiqlashingiz yoki rad etishingiz mumkin:`;

export const FEEDBACK_PROMPT_MESSAGE = `✍️ Zynygram loyihasini rivojlantirish bo‘yicha taklifingiz yoki ilovada duch kelgan biror muammoingiz bo‘lsa, uni batafsil yozib qoldiring.

Har bir murojaat ma’muriyatimiz tomonidan diqqat bilan ko‘rib chiqiladi!`;

export const ABOUT_MESSAGE = `ℹ️ Zynygram haqida qisqacha:

Zynygram — zamonaviy O‘zbekiston ijtimoiy tarmog‘i bo‘lib, unda:
• Do‘stlar orttirishingiz, postlar va media kontentlar ulashishingiz;
• Sun’iy intellekt (AI) vositalari orqali professional rasm va video generatsiya qilishingiz;
• O‘z shaxsiy kanallaringiz va guruhlaringizni yuritishingiz mumkin.

Savollaringiz yoki takliflaringiz bo‘lsa, bemalol yozib qoldirishingiz mumkin!`;

export const HELP_MESSAGE = `ℹ️ Zynygram Qo‘llab-quvvatlash Xizmati:

Pastdagi qulay menyudan foydalanishingiz yoki savolingizni to‘g‘ridan-to‘g‘ri matn ko‘rinishida yozishingiz mumkin.

Eslatma: Xavfsizlik yuzasidan shaxsiy parollaringiz yoki SMS tasdiqlash kodlarini hech kimga yubormang!`;

export const SUPPORT_MESSAGE = `🤝 Zynygram Qo‘llab-quvvatlash Xizmati

Biz ijtimoiy tarmoqdan foydalanish, profil sozlamalari, postlar, media yuklash hamda rasm va video yaratish vositalari bo‘yicha yordam beramiz.

Savolingizni to‘g‘ridan-to‘g‘ri yozib qoldirishingiz mumkin.`;

export const UNSUPPORTED_CONTENT_MESSAGE =
  'Hozircha ushbu turdagi xabarni qabul qila olmaymiz. Iltimos, xabaringiz yoki havolangizni matn ko‘rinishida yuboring.';

export const UNAUTHORIZED_ADMIN_MESSAGE = 'Bu amal faqat administratorlar uchun.';

function isSenderAdmin(fromId?: number | bigint | string): boolean {
  if (!fromId) return false;
  const idStr = fromId.toString();
  return idStr === PRIMARY_ADMIN_TELEGRAM_ID || config.adminIds.includes(idStr);
}

export function registerBotHandlers(
  bot: Telegraf,
  support: SupportService = supportService,
  users: UserService = userService,
  conversations: ConversationService = conversationService,
  escalations: EscalationService = escalationService,
  verification: VerificationService = verificationService,
): void {
  // /verify or /tasdiqlash command
  bot.command(['verify', 'tasdiqlash'], async (ctx) => {
    const fromUser = ctx.from;
    if (!fromUser) return;

    const args = ctx.message.text.split(' ').slice(1).join(' ').trim();
    if (args.length > 0) {
      const res = await verification.submitVerificationRequest({
        telegramId: fromUser.id,
        username: fromUser.username,
        firstName: fromUser.first_name,
        lastName: fromUser.last_name,
        proofText: args,
      });
      await ctx.reply(res.userMessage, getUserMainMenu());
      return;
    }

    await ctx.reply(VERIFY_INFO_MESSAGE, getUserMainMenu());
  });

  // /start command
  bot.command('start', async (ctx) => {
    const fromUser = ctx.from;
    if (fromUser) {
      try {
        const user = await users.getOrCreateUser({
          telegramId: fromUser.id,
          username: fromUser.username,
          firstName: fromUser.first_name,
          lastName: fromUser.last_name,
          language: fromUser.language_code,
        });
        const activeConv = await conversations.getOrCreateActiveConversation(user.id);
        if (activeConv.status === ConversationStatus.WAITING_HUMAN) {
          await conversations.updateStatus(activeConv.id, ConversationStatus.AI_HANDLED);
        }
      } catch (err) {
        logger.error({ error: err }, 'Failed to persist user on /start command');
      }
    }

    if (isSenderAdmin(fromUser?.id)) {
      await ctx.reply(ADMIN_START_MESSAGE, getAdminMainMenu());
      return;
    }

    await ctx.reply(START_MESSAGE, getUserMainMenu());
  });

  // /ai or /reset command
  bot.command(['ai', 'reset'], async (ctx) => {
    const fromUser = ctx.from;
    if (!fromUser) return;

    try {
      const user = await users.getOrCreateUser({
        telegramId: fromUser.id,
        username: fromUser.username,
        firstName: fromUser.first_name,
        lastName: fromUser.last_name,
      });

      const activeConv = await conversations.getOrCreateActiveConversation(user.id);
      await conversations.updateStatus(activeConv.id, ConversationStatus.AI_HANDLED);
      await ctx.reply('Assalomu alaykum! Xizmatimiz yana faol. Savolingiz yoki murojaatingizni bemalol yozishingiz mumkin!', getUserMainMenu());
    } catch (err) {
      logger.error({ error: err }, 'Failed to reset conversation');
      await ctx.reply('Sizni tinglayapmiz. Savolingizni yozishingiz mumkin.', getUserMainMenu());
    }
  });

  // /help command
  bot.command('help', async (ctx) => {
    await ctx.reply(HELP_MESSAGE, isSenderAdmin(ctx.from?.id) ? getAdminMainMenu() : getUserMainMenu());
  });

  // /support command
  bot.command('support', async (ctx) => {
    await ctx.reply(SUPPORT_MESSAGE, getUserMainMenu());
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
      lastMessageContent: 'Operatorga ulanish so‘rovi',
    });

    await ctx.reply(result.userMessage, getUserMainMenu());
  });

  // /status command
  bot.command('status', async (ctx) => {
    const fromUser = ctx.from;
    if (!fromUser) return;

    const user = await users.findByTelegramId(fromUser.id);
    if (!user) {
      await ctx.reply('Sizda hozircha faol murojaat yo‘q. Savolingizni yozib qoldirishingiz mumkin.', getUserMainMenu());
      return;
    }

    const activeConv = await conversations.getOrCreateActiveConversation(user.id);

    let statusText = 'Faol';
    if (activeConv.status === ConversationStatus.AI_HANDLED) {
      statusText = '🟢 Mutaxassis tomonidan xizmat ko‘rsatilmoqda';
    } else if (activeConv.status === ConversationStatus.WAITING_HUMAN) {
      statusText = '⏳ Navbatchi mutaxassis ko‘rib chiqishi kutilmoqda';
    } else if (activeConv.status === ConversationStatus.CLOSED) {
      statusText = '✅ Yopilgan';
    } else if (activeConv.status === ConversationStatus.OPEN) {
      statusText = '🟢 Ochiq';
    }

    await ctx.reply(
      `📋 Murojaatingiz holati:\n\nID: ${activeConv.id}\nHolat: ${statusText}\nBoshlangan vaqti: ${activeConv.createdAt.toLocaleString('uz-UZ')}`,
      getUserMainMenu(),
    );
  });

  // -------------------------------------------------------------
  // USER MENU BUTTON LISTENERS
  // -------------------------------------------------------------
  bot.hears(USER_MENU_BUTTONS.VERIFY, async (ctx) => {
    await ctx.reply(VERIFY_INFO_MESSAGE, getUserMainMenu());
  });

  bot.hears(USER_MENU_BUTTONS.FEEDBACK, async (ctx) => {
    await ctx.reply(FEEDBACK_PROMPT_MESSAGE, getUserMainMenu());
  });

  bot.hears(USER_MENU_BUTTONS.OPERATOR, async (ctx) => {
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
      lastMessageContent: 'Operatorga ulanish tugmasi bosildi',
    });

    await ctx.reply(result.userMessage, getUserMainMenu());
  });

  bot.hears(USER_MENU_BUTTONS.ABOUT, async (ctx) => {
    await ctx.reply(ABOUT_MESSAGE, getUserMainMenu());
  });

  // -------------------------------------------------------------
  // ADMIN DASHBOARD & MENU LISTENERS
  // -------------------------------------------------------------
  bot.hears(ADMIN_MENU_BUTTONS.STATS, async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) return;

    const [userCount, convStats, vStats] = await Promise.all([
      users.getUserCount(),
      conversations.getConversationStats(),
      verification.getVerificationStats(),
    ]);

    const report = `📊 Zynygram Tizimining Umumiy Statistikasi:

👥 Jami foydalanuvchilar: ${userCount}
💬 Jami suhbatlar: ${convStats.total}
🟢 Ochiq suhbatlar: ${convStats.open}
⏳ Navbatda kutayotganlar: ${convStats.waitingHuman}
✅ Yopilgan suhbatlar: ${convStats.closed}

━━━━━━━━━━━━━━━━━━━━
🛡 Tasdiqlash (Verifikatsiya) arizalari:
📥 Jami kelgan so‘rovlar: ${vStats.total}
⏳ Kutilayotgan (yangi): ${vStats.pending}
✅ Tasdiqlangan: ${vStats.approved}
❌ Rad etilgan: ${vStats.rejected}`;

    await ctx.reply(report, getAdminMainMenu());
  });

  bot.hears(ADMIN_MENU_BUTTONS.VERIFICATION_STATS, async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) return;

    const vStats = await verification.getVerificationStats();

    const report = `🛡 VERIFIKATSIYA (TASDIQLASH NISHONI) HISOBOTI:

📥 Jami kelgan arizalar: ${vStats.total} ta
⏳ Ko‘rib chiqilishi kerak (kutilayotgan): ${vStats.pending} ta
✅ Muvaffaqiyatli tasdiqlangan: ${vStats.approved} ta
❌ Rad etilgan arizalar: ${vStats.rejected} ta

💡 "⏳ Kutilayotgan arizalar" tugmasi orqali yangi kelgan har bir arizani tekshirib, darhol tasdiqlashingiz yoki rad etishingiz mumkin.`;

    await ctx.reply(report, getAdminMainMenu());
  });

  bot.hears(ADMIN_MENU_BUTTONS.PENDING_VERIFICATIONS, async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) return;

    const pending = await verification.getPendingRequests(10);
    if (pending.length === 0) {
      await ctx.reply('✅ Hozirda yangi kutilayotgan tasdiqlash arizalari yo‘q. Barcha arizalar ko‘rib chiqilgan!', getAdminMainMenu());
      return;
    }

    await ctx.reply(`⏳ Hozirda kutilayotgan arizalar (${pending.length} ta):`, getAdminMainMenu());

    for (const req of pending) {
      const userHandle = req.user.username
        ? `@${req.user.username}`
        : req.user.firstName || 'Nomsiz foydalanuvchi';

      const itemText = `🛡 ARIZA:
Foydalanuvchi: ${userHandle}
Telegram ID: ${req.user.telegramId.toString()}
Vaqt: ${req.createdAt.toLocaleString('uz-UZ')}

Yuborilgan Isbot:
${req.proofText}`;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Tasdiqlash', `v_app:${req.id}`),
          Markup.button.callback('❌ Rad etish', `v_rej:${req.id}`),
        ],
      ]);

      await ctx.reply(itemText, keyboard);
    }
  });

  bot.hears(ADMIN_MENU_BUTTONS.INQUIRIES, async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) return;

    const inquiries = await conversations.getRecentInquiries(10);
    if (inquiries.length === 0) {
      await ctx.reply('Hozircha hech qanday murojaat yoki taklif topilmadi.', getAdminMainMenu());
      return;
    }

    const lines = inquiries.map((c, i) => {
      const u = c.user;
      const userHandle = u.username ? `@${u.username}` : u.firstName || 'Foydalanuvchi';
      const lastMsg = c.messages[0]?.content || '(Xabar yo‘q)';
      const snippet = lastMsg.length > 60 ? lastMsg.substring(0, 57) + '...' : lastMsg;
      let statusIcon = '💬';
      if (c.status === ConversationStatus.WAITING_HUMAN) statusIcon = '⏳';
      else if (c.status === ConversationStatus.CLOSED) statusIcon = '✅';

      return `${i + 1}. ${statusIcon} ${userHandle} (ID: ${u.telegramId.toString()}):\n   "${snippet}"`;
    });

    await ctx.reply(`📩 So‘nggi murojaat va takliflar:\n\n${lines.join('\n\n')}`, getAdminMainMenu());
  });

  bot.hears(ADMIN_MENU_BUTTONS.USERS, async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) return;

    const recent = await users.getRecentUsers(10);
    if (recent.length === 0) {
      await ctx.reply('Hozircha foydalanuvchilar ro‘yxati bo‘sh.', getAdminMainMenu());
      return;
    }

    const userList = recent
      .map(
        (u, i) =>
          `${i + 1}. ${u.username ? `@${u.username}` : u.firstName || 'No name'} (ID: ${u.telegramId.toString()}) ${u.isVerified ? '🛡 [Tasdiqlangan]' : ''} - ${u.isBlocked ? '🚫 Blok' : '✅ Faol'}`,
      )
      .join('\n');

    await ctx.reply(`👥 So‘nggi 10 ta foydalanuvchi:\n\n${userList}`, getAdminMainMenu());
  });

  bot.hears(ADMIN_MENU_BUTTONS.REFRESH, async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) return;
    await ctx.reply('🔄 Boshqaruv paneli menyusi yangilandi.', getAdminMainMenu());
  });

  // -------------------------------------------------------------
  // ADMIN COMMANDS (/admin, /stats, etc.)
  // -------------------------------------------------------------
  bot.command('admin', async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) {
      await ctx.reply(UNAUTHORIZED_ADMIN_MESSAGE);
      return;
    }

    await ctx.reply(ADMIN_START_MESSAGE, getAdminMainMenu());
  });

  bot.command('stats', async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) {
      await ctx.reply(UNAUTHORIZED_ADMIN_MESSAGE);
      return;
    }

    const [userCount, convStats, vStats] = await Promise.all([
      users.getUserCount(),
      conversations.getConversationStats(),
      verification.getVerificationStats(),
    ]);

    const statsReport = `📊 Tizim Statistikasi:

👥 Jami foydalanuvchilar: ${userCount}
💬 Jami suhbatlar: ${convStats.total}
🟢 Ochiq: ${convStats.open}
⏳ Navbatda kutayotgan: ${convStats.waitingHuman}
✅ Yopilgan: ${convStats.closed}

🛡 Verifikatsiya:
📥 Jami kelgan: ${vStats.total}
⏳ Kutilmoqda: ${vStats.pending}
✅ Tasdiqlangan: ${vStats.approved}
❌ Rad etilgan: ${vStats.rejected}`;

    await ctx.reply(statsReport, getAdminMainMenu());
  });

  bot.command('users', async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) {
      await ctx.reply(UNAUTHORIZED_ADMIN_MESSAGE);
      return;
    }

    const recent = await users.getRecentUsers(10);
    if (recent.length === 0) {
      await ctx.reply('Hozircha foydalanuvchilar yo‘q.', getAdminMainMenu());
      return;
    }

    const userList = recent
      .map(
        (u, i) =>
          `${i + 1}. ${u.username ? `@${u.username}` : u.firstName || 'No name'} (ID: ${u.telegramId.toString()}) ${u.isVerified ? '🛡 [Tasdiqlangan]' : ''} - ${u.isBlocked ? '🚫 Bloklangan' : '✅ Faol'}`,
      )
      .join('\n');

    await ctx.reply(`👥 So‘nggi 10 ta foydalanuvchi:\n\n${userList}`, getAdminMainMenu());
  });

  bot.command('open', async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) {
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

  bot.command('close', async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) {
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

  bot.command('block', async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) {
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

  bot.command('unblock', async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) {
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
  // VERIFICATION APPROVAL & REJECTION ACTIONS (Admin Interactive Buttons)
  // -------------------------------------------------------------
  bot.action(/^v_app:(.+)$/, async (ctx) => {
    const fromId = ctx.from?.id?.toString();
    const isAllowed = isSenderAdmin(fromId);
    if (!isAllowed) {
      await ctx.answerCbQuery(UNAUTHORIZED_ADMIN_MESSAGE, { show_alert: true });
      return;
    }

    const requestId = ctx.match[1];
    const result = await verification.approveRequest(requestId, fromId || PRIMARY_ADMIN_TELEGRAM_ID);

    if (result.success) {
      await ctx.answerCbQuery('✅ Foydalanuvchi tasdiqlandi!');
      const adminName = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
      const originalText =
        ctx.callbackQuery.message && 'text' in ctx.callbackQuery.message ? ctx.callbackQuery.message.text : '';
      await ctx.editMessageText(
        `${originalText}\n\n━━━━━━━━━━━━━━━━━━━━\n✅ TASDIQLANDI! (${adminName} tomonidan ma’qullandi va foydalanuvchiga tasdiqlanganlik xabari yuborildi)`,
      );
    } else {
      await ctx.answerCbQuery('❌ Xatolik yuz berdi yoki allaqachon ko‘rib chiqilgan.', { show_alert: true });
    }
  });

  bot.action(/^v_rej:(.+)$/, async (ctx) => {
    const fromId = ctx.from?.id?.toString();
    const isAllowed = isSenderAdmin(fromId);
    if (!isAllowed) {
      await ctx.answerCbQuery(UNAUTHORIZED_ADMIN_MESSAGE, { show_alert: true });
      return;
    }

    const requestId = ctx.match[1];
    const result = await verification.rejectRequest(requestId, fromId || PRIMARY_ADMIN_TELEGRAM_ID);

    if (result.success) {
      await ctx.answerCbQuery('❌ So‘rov rad etildi');
      const adminName = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
      const originalText =
        ctx.callbackQuery.message && 'text' in ctx.callbackQuery.message ? ctx.callbackQuery.message.text : '';
      await ctx.editMessageText(
        `${originalText}\n\n━━━━━━━━━━━━━━━━━━━━\n❌ RAD ETILDI (${adminName} tomonidan rad etildi va foydalanuvchiga xabar yuborildi)`,
      );
    } else {
      await ctx.answerCbQuery('❌ Xatolik yuz berdi.', { show_alert: true });
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
      await ctx.reply(UNSUPPORTED_CONTENT_MESSAGE, isSenderAdmin(ctx.from?.id) ? getAdminMainMenu() : getUserMainMenu());
    },
  );

  // -------------------------------------------------------------
  // REGULAR TEXT MESSAGE HANDLER
  // -------------------------------------------------------------
  bot.on(message('text'), async (ctx) => {
    const fromUser = ctx.from;
    const text = ctx.message.text;

    // Ignore commands
    if (text.startsWith('/')) {
      return;
    }

    const isAdmin = isSenderAdmin(fromUser.id);

    // If user is sharing any link or proof for verification
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

    // Automatically submit verification request if it has a link or mentions verification conditions
    if (hasLink || mentionsVerification) {
      const vResult = await verification.submitVerificationRequest({
        telegramId: fromUser.id,
        username: fromUser.username,
        firstName: fromUser.first_name,
        lastName: fromUser.last_name,
        proofText: text,
      });
      await ctx.reply(vResult.userMessage, isAdmin ? getAdminMainMenu() : getUserMainMenu());
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
      await ctx.reply(result.replyText, isAdmin ? getAdminMainMenu() : getUserMainMenu());
    }
  });

  logger.info('Telegram bot command and message handlers registered');
}

export default registerBotHandlers;
