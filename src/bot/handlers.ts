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

export const VERIFY_INFO_MESSAGE = `🛡 <b>Zynygram Tasdiqlash Nishonini Olish Shartlari:</b>

Rasmiy tasdiqlash nishonini (<i>ko‘k belgi</i>) olish uchun quyidagi <b>2 ta rasmiy shartdan birini</b> bajaring:

1️⃣ <b>1-variant</b> <i>(Instagram yoki Telegram Story / Reels):</i>
Rasmiy https://t.me/Zynygram_media/2 postimizni Instagram yoki Telegram profilingizda <b>Story yoki Reels</b> qilib ulashing. 📱

2️⃣ <b>2-variant</b> <i>(Telegram kanallarda tarqatish):</i>
YOKI rasmiy https://t.me/zynygram/21 postimizni <b>Telegram kanallarida</b> tarqating. 📢

━━━━━━━━━━━━━━━━━━━━
✨ <b>Shartni bajargach, quyidagilarni yuboring:</b>
1. <b>Zynygram profilingiz nomini (username / nikini)</b>; 📱
2. Postingiz havolasini (linkini) yoki <b>skrinshotini (rasmini)</b>. 📸

<i>Masalan: "Zynygram nikim: @shaxzod, shartni bajardim..." (yoki skrinshot bilan).</i>

Mutaxassislarimiz arizangizni ko‘rib chiqib, profilingizni darhol tasdiqlashadi! 🛡✨`;

export const START_MESSAGE = `✨ <b>Assalomu alaykum! Xush kelibsiz!</b> 👋

<b>Zynygram</b> rasmiy mijozlar bilan ishlash xizmati sizga yordam berishga tayyor. 🌟

Akkaunt sozlamalari, <b>tasdiqlash nishonini olish</b>, taklif va mulohazalar yoki ilovadagi istalgan masala bo‘yicha sizni <i>mamnuniyat bilan</i> tinglaymiz. 🤝

Quyidagi menyudan kerakli bo‘limni tanlashingiz yoki savolingizni to‘g‘ridan-to‘g‘ri yozib qoldirishingiz mumkin: ⬇️`;

export const ADMIN_START_MESSAGE = `👋 <b>Xush kelibsiz, Administrator!</b> 🌟

Siz <b>Zynygram</b> rasmiy boshqaruv panelidasiz. 🛡
Quyidagi menyu orqali taklif va murojaatlarni kuzatib borishingiz, verifikatsiya statistikasini ko‘rishingiz hamda arizalarni tasdiqlashingiz yoki rad etishingiz mumkin: ⬇️`;

export const FEEDBACK_PROMPT_MESSAGE = `✍️ <b>Zynygram loyihasini rivojlantirish bo‘yicha taklif yoki muammo bildirish:</b> 🌟

Sizning har bir fikringiz biz uchun juda qadrli! 💡

Iltimos, taklifingiz yoki ilovada duch kelgan texnik muammoingizni <b>batafsil yozib qoldiring</b> <i>(xohlasangiz skrinshot ham ilova qilishingiz mumkin)</i>. 📝

Xabaringiz zudlik bilan ma’muriyatimiz va dasturchilar guruhimizga yetkaziladi! 🤝✨`;

export const FEEDBACK_RECEIVED_MESSAGE = `🌟 <b>Katta rahmat!</b>

Siz bildirgan taklif yoki muammo <i>ma’muriyatimiz va dasturchilar jamoamizga</i> yetkazildi. 🤝

<b>Zynygram</b> platformasini yanada mukammal qilishga hissa qo‘shayotganingiz uchun minnatdormiz! ✨`;

export const ABOUT_MESSAGE = `ℹ️ <b>Zynygram haqida qisqacha:</b> 🌟

<b>Zynygram</b> — zamonaviy O‘zbekiston ijtimoiy tarmog‘i bo‘lib, unda:
• Do‘stlar orttirishingiz, postlar va media kontentlar ulashishingiz; 👥
• <b>Sun’iy intellekt (AI)</b> vositalari orqali professional rasm va video generatsiya qilishingiz; 🎨
• O‘z shaxsiy kanallaringiz va guruhlaringizni yuritishingiz mumkin. 📢

Savollaringiz yoki takliflaringiz bo‘lsa, <i>bemalol yozib qoldirishingiz mumkin!</i> 🤝✨`;

export const HELP_MESSAGE = `ℹ️ <b>Zynygram Qo‘llab-quvvatlash Xizmati:</b>

Pastdagi qulay menyudan foydalanishingiz yoki savolingizni to‘g‘ridan-to‘g‘ri matn ko‘rinishida yozishingiz mumkin. 💬

⚠️ <i>Eslatma: Xavfsizlik yuzasidan shaxsiy parollaringiz yoki SMS tasdiqlash kodlarini hech kimga bermang!</i>`;

export const SUPPORT_MESSAGE = `🤝 <b>Zynygram Qo‘llab-quvvatlash Xizmati</b> 🌟

Biz ijtimoiy tarmoqdan foydalanish, profil sozlamalari, postlar, media yuklash hamda rasm va video yaratish vositalari bo‘yicha sizga <i>chin dildan</i> yordam beramiz. 🛡

Savolingizni to‘g‘ridan-to‘g‘ri yozib qoldirishingiz mumkin. ✍️`;

export const UNSUPPORTED_CONTENT_MESSAGE =
  'Hozircha ushbu turdagi xabarni qabul qila olmaymiz. Iltimos, xabaringiz yoki havolangizni <b>matn yoki rasm (skrinshot)</b> ko‘rinishida yuboring. 📸';

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
      await ctx.reply(res.userMessage, { parse_mode: 'HTML', ...getUserMainMenu() });
      return;
    }

    await ctx.reply(VERIFY_INFO_MESSAGE, { parse_mode: 'HTML', ...getUserMainMenu() });
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
      await ctx.reply(ADMIN_START_MESSAGE, { parse_mode: 'HTML', ...getAdminMainMenu() });
      return;
    }

    await ctx.reply(START_MESSAGE, { parse_mode: 'HTML', ...getUserMainMenu() });
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
      await ctx.reply(
        'Assalomu alaykum! Xizmatimiz yana faol. Savolingiz yoki murojaatingizni <i>bemalol yozishingiz mumkin!</i> 🤝✨',
        { parse_mode: 'HTML', ...getUserMainMenu() },
      );
    } catch (err) {
      logger.error({ error: err }, 'Failed to reset conversation');
      await ctx.reply('Sizni tinglayapmiz. Savolingizni yozishingiz mumkin. 🤝', getUserMainMenu());
    }
  });

  // /help command
  bot.command('help', async (ctx) => {
    await ctx.reply(HELP_MESSAGE, {
      parse_mode: 'HTML',
      ...(isSenderAdmin(ctx.from?.id) ? getAdminMainMenu() : getUserMainMenu()),
    });
  });

  // /support command
  bot.command('support', async (ctx) => {
    await ctx.reply(SUPPORT_MESSAGE, { parse_mode: 'HTML', ...getUserMainMenu() });
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
      await ctx.reply('Sizda hozircha faol murojaat yo‘q. Savolingizni yozib qoldirishingiz mumkin. 🤝', getUserMainMenu());
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
      `📋 <b>Murojaatingiz holati:</b>\n\n🆔 <b>ID:</b> <code>${activeConv.id}</code>\n📊 <b>Holat:</b> ${statusText}\n🕒 <b>Boshlangan vaqti:</b> ${activeConv.createdAt.toLocaleString('uz-UZ')}`,
      { parse_mode: 'HTML', ...getUserMainMenu() },
    );
  });

  // -------------------------------------------------------------
  // USER MENU BUTTON LISTENERS
  // -------------------------------------------------------------
  bot.hears(USER_MENU_BUTTONS.VERIFY, async (ctx) => {
    await ctx.reply(VERIFY_INFO_MESSAGE, { parse_mode: 'HTML', ...getUserMainMenu() });
  });

  bot.hears(USER_MENU_BUTTONS.FEEDBACK, async (ctx) => {
    await ctx.reply(FEEDBACK_PROMPT_MESSAGE, { parse_mode: 'HTML', ...getUserMainMenu() });
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
    await ctx.reply(ABOUT_MESSAGE, { parse_mode: 'HTML', ...getUserMainMenu() });
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

    const report = `📊 <b>Zynygram Tizimining Umumiy Statistikasi:</b> 🌟

👥 <b>Jami foydalanuvchilar:</b> ${userCount} ta
💬 <b>Jami suhbatlar:</b> ${convStats.total} ta
🟢 <b>Ochiq suhbatlar:</b> ${convStats.open} ta
⏳ <b>Navbatda kutayotganlar:</b> ${convStats.waitingHuman} ta
✅ <b>Yopilgan suhbatlar:</b> ${convStats.closed} ta

━━━━━━━━━━━━━━━━━━━━
🛡 <b>Tasdiqlash (Verifikatsiya) arizalari:</b>
📥 <b>Jami kelgan so‘rovlar:</b> ${vStats.total} ta
⏳ <b>Kutilayotgan (yangi):</b> ${vStats.pending} ta
✅ <b>Tasdiqlangan:</b> ${vStats.approved} ta
❌ <b>Rad etilgan:</b> ${vStats.rejected} ta`;

    await ctx.reply(report, { parse_mode: 'HTML', ...getAdminMainMenu() });
  });

  bot.hears(ADMIN_MENU_BUTTONS.VERIFICATION_STATS, async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) return;

    const vStats = await verification.getVerificationStats();

    const report = `🛡 <b>VERIFIKATSIYA (TASDIQLASH NISHONI) HISOBOTI:</b> 🌟

📥 <b>Jami kelgan arizalar:</b> ${vStats.total} ta
⏳ <b>Ko‘rib chiqilishi kerak (kutilayotgan):</b> ${vStats.pending} ta
✅ <b>Muvaffaqiyatli tasdiqlangan:</b> ${vStats.approved} ta
❌ <b>Rad etilgan arizalar:</b> ${vStats.rejected} ta

💡 <i>"⏳ Kutilayotgan arizalar" tugmasi orqali yangi arizalarni skrinshotlari bilan ko‘rib chiqib, darhol tasdiqlashingiz yoki rad etishingiz mumkin.</i>`;

    await ctx.reply(report, { parse_mode: 'HTML', ...getAdminMainMenu() });
  });

  bot.hears(ADMIN_MENU_BUTTONS.PENDING_VERIFICATIONS, async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) return;

    const pending = await verification.getPendingRequests(10);
    if (pending.length === 0) {
      await ctx.reply('✅ <b>Hozirda yangi kutilayotgan tasdiqlash arizalari yo‘q.</b>\n\nBarcha arizalar ko‘rib chiqilgan! 🌟', {
        parse_mode: 'HTML',
        ...getAdminMainMenu(),
      });
      return;
    }

    await ctx.reply(`⏳ <b>Ko‘rib chiqilishi kutilayotgan arizalar (${pending.length} ta):</b>`, {
      parse_mode: 'HTML',
      ...getAdminMainMenu(),
    });

    for (const req of pending) {
      const userHandle = req.user.username
        ? `@${req.user.username}`
        : req.user.firstName || 'Nomsiz foydalanuvchi';

      const photoMatch = req.proofText?.match(/\[Photo:\s*([^\]]+)\]/);
      const cleanProof = req.proofText
        ? req.proofText
            .replace(/\[Photo:\s*[^\]]+\]/g, '')
            .replace(/\[BusinessChat:\s*[^\]]+\]/g, '')
            .trim()
        : '';

      const customNikMatch = cleanProof.match(/(?:nik|username|profil|login|nomi)[\s:]*@?([a-zA-Z0-9_.]{3,30})/i);
      const atUsernameMatch = cleanProof.match(/@([a-zA-Z0-9_.]{3,30})/);
      const detectedUsername = customNikMatch ? customNikMatch[1] : (atUsernameMatch ? atUsernameMatch[1] : null);
      const zynygramDisplay = detectedUsername ? `<code>@${detectedUsername}</code>` : '⚠️ <i>(Xabar/rasmdan qarang)</i>';

      const itemText = `🛡 <b>ARIZA:</b>
👤 <b>Telegram profili:</b> ${userHandle}
🆔 <b>Telegram ID:</b> <code>${req.user.telegramId.toString()}</code>
📱 <b>Zynygram Profili:</b> ${zynygramDisplay}
🕒 <b>Vaqt:</b> ${req.createdAt.toLocaleString('uz-UZ')}

📝 <b>Yuborilgan Isbot:</b>
${cleanProof || (photoMatch ? '📸 <i>(Skrinshot ilova qilingan)</i>' : '<i>(Isbot matni yo‘q)</i>')}`;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Tasdiqlash', `v_app:${req.id}`),
          Markup.button.callback('❌ Rad etish', `v_rej:${req.id}`),
        ],
      ]);

      if (photoMatch) {
        try {
          await ctx.replyWithPhoto(photoMatch[1], {
            caption: itemText,
            parse_mode: 'HTML',
            reply_markup: keyboard.reply_markup,
          });
          continue;
        } catch {
          // fallback to text
        }
      }

      await ctx.reply(itemText, {
        parse_mode: 'HTML',
        reply_markup: keyboard.reply_markup,
      });
    }
  });

  bot.hears(ADMIN_MENU_BUTTONS.INQUIRIES, async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) return;

    const inquiries = await conversations.getRecentInquiries(10);
    if (inquiries.length === 0) {
      await ctx.reply('Hozircha hech qanday murojaat yoki taklif topilmadi. 📭', getAdminMainMenu());
      return;
    }

    const lines = inquiries.map((c, i) => {
      const u = c.user;
      const userHandle = u.username ? `@${u.username}` : u.firstName || 'Foydalanuvchi';
      const lastMsg = c.messages[0]?.content || '(Xabar yo‘q)';
      const snippet = lastMsg.length > 70 ? lastMsg.substring(0, 67) + '...' : lastMsg;
      let statusIcon = '💬';
      if (c.status === ConversationStatus.WAITING_HUMAN) statusIcon = '⏳';
      else if (c.status === ConversationStatus.CLOSED) statusIcon = '✅';

      return `<b>${i + 1}.</b> ${statusIcon} <b>${userHandle}</b> (<code>${u.telegramId.toString()}</code>):\n   <i>"${snippet}"</i>`;
    });

    await ctx.reply(`📩 <b>So‘nggi murojaat va takliflar:</b> 🌟\n\n${lines.join('\n\n')}`, {
      parse_mode: 'HTML',
      ...getAdminMainMenu(),
    });
  });

  bot.hears(ADMIN_MENU_BUTTONS.USERS, async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) return;

    const recent = await users.getRecentUsers(10);
    if (recent.length === 0) {
      await ctx.reply('Hozircha foydalanuvchilar ro‘yxati bo‘sh. 👥', getAdminMainMenu());
      return;
    }

    const userList = recent
      .map(
        (u, i) =>
          `<b>${i + 1}.</b> ${u.username ? `@${u.username}` : u.firstName || 'No name'} (<code>${u.telegramId.toString()}</code>) ${u.isVerified ? '🛡 <b>[Tasdiqlangan]</b>' : ''} - ${u.isBlocked ? '🚫 <i>Bloklangan</i>' : '✅ <i>Faol</i>'}`,
      )
      .join('\n');

    await ctx.reply(`👥 <b>So‘nggi 10 ta foydalanuvchi:</b> 🌟\n\n${userList}`, {
      parse_mode: 'HTML',
      ...getAdminMainMenu(),
    });
  });

  bot.hears(ADMIN_MENU_BUTTONS.REFRESH, async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) return;
    await ctx.reply('🔄 <b>Boshqaruv paneli menyusi yangilandi.</b>', {
      parse_mode: 'HTML',
      ...getAdminMainMenu(),
    });
  });

  // -------------------------------------------------------------
  // ADMIN COMMANDS (/admin, /stats, etc.)
  // -------------------------------------------------------------
  bot.command('admin', async (ctx) => {
    if (!isSenderAdmin(ctx.from?.id)) {
      await ctx.reply(UNAUTHORIZED_ADMIN_MESSAGE);
      return;
    }

    await ctx.reply(ADMIN_START_MESSAGE, { parse_mode: 'HTML', ...getAdminMainMenu() });
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

    const statsReport = `📊 <b>Tizim Statistikasi:</b> 🌟

👥 <b>Jami foydalanuvchilar:</b> ${userCount}
💬 <b>Jami suhbatlar:</b> ${convStats.total}
🟢 <b>Ochiq:</b> ${convStats.open}
⏳ <b>Navbatda kutayotgan:</b> ${convStats.waitingHuman}
✅ <b>Yopilgan:</b> ${convStats.closed}

🛡 <b>Verifikatsiya:</b>
📥 <b>Jami kelgan:</b> ${vStats.total}
⏳ <b>Kutilmoqda:</b> ${vStats.pending}
✅ <b>Tasdiqlangan:</b> ${vStats.approved}
❌ <b>Rad etilgan:</b> ${vStats.rejected}`;

    await ctx.reply(statsReport, { parse_mode: 'HTML', ...getAdminMainMenu() });
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
          `<b>${i + 1}.</b> ${u.username ? `@${u.username}` : u.firstName || 'No name'} (<code>${u.telegramId.toString()}</code>) ${u.isVerified ? '🛡 <b>[Tasdiqlangan]</b>' : ''} - ${u.isBlocked ? '🚫 <i>Bloklangan</i>' : '✅ <i>Faol</i>'}`,
      )
      .join('\n');

    await ctx.reply(`👥 <b>So‘nggi 10 ta foydalanuvchi:</b>\n\n${userList}`, {
      parse_mode: 'HTML',
      ...getAdminMainMenu(),
    });
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
    try {
      const fromId = ctx.from?.id?.toString();
      const isAllowed = isSenderAdmin(fromId);
      if (!isAllowed) {
        await ctx.answerCbQuery(UNAUTHORIZED_ADMIN_MESSAGE, { show_alert: true });
        return;
      }

      const cbData = ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';
      const requestId = (ctx.match && ctx.match[1]) || cbData.replace('v_app:', '');
      logger.info({ fromId, requestId, cbData }, 'Executing v_app approval callback');

      const result = await verification.approveRequest(requestId, fromId || PRIMARY_ADMIN_TELEGRAM_ID);

      if (result.success) {
        await ctx.answerCbQuery('✅ Foydalanuvchi tasdiqlandi!');
        const adminName = ctx.from?.username ? `@${ctx.from.username}` : ctx.from?.first_name || 'Admin';
        const originalText =
          ctx.callbackQuery && 'message' in ctx.callbackQuery && ctx.callbackQuery.message && 'text' in ctx.callbackQuery.message
            ? ctx.callbackQuery.message.text
            : ctx.callbackQuery && 'message' in ctx.callbackQuery && ctx.callbackQuery.message && 'caption' in ctx.callbackQuery.message
              ? (ctx.callbackQuery.message as { caption?: string }).caption || ''
              : '';

        const confirmationNotice = `${originalText}\n\n━━━━━━━━━━━━━━━━━━━━\n✅ <b>TASDIQLANDI!</b> 🌟 (${adminName} tomonidan ma’qullandi va foydalanuvchiga tasdiqlanganlik xabari yuborildi)`;

        if (ctx.callbackQuery && 'message' in ctx.callbackQuery && ctx.callbackQuery.message && 'caption' in ctx.callbackQuery.message) {
          await ctx.editMessageCaption(confirmationNotice, { parse_mode: 'HTML' });
        } else {
          await ctx.editMessageText(confirmationNotice, { parse_mode: 'HTML' });
        }
      } else {
        await ctx.answerCbQuery('❌ Xatolik yuz berdi yoki allaqachon ko‘rib chiqilgan.', { show_alert: true });
      }
    } catch (err) {
      logger.error({ error: err }, 'Unhandled error in v_app action');
      try {
        await ctx.answerCbQuery('❌ Xatolik yuz berdi.', { show_alert: true });
      } catch {}
    }
  });

  bot.action(/^v_rej:(.+)$/, async (ctx) => {
    try {
      const fromId = ctx.from?.id?.toString();
      const isAllowed = isSenderAdmin(fromId);
      if (!isAllowed) {
        await ctx.answerCbQuery(UNAUTHORIZED_ADMIN_MESSAGE, { show_alert: true });
        return;
      }

      const cbData = ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';
      const requestId = (ctx.match && ctx.match[1]) || cbData.replace('v_rej:', '');
      logger.info({ fromId, requestId, cbData }, 'Executing v_rej rejection callback');

      const result = await verification.rejectRequest(requestId, fromId || PRIMARY_ADMIN_TELEGRAM_ID);

      if (result.success) {
        await ctx.answerCbQuery('❌ So‘rov rad etildi');
        const adminName = ctx.from?.username ? `@${ctx.from.username}` : ctx.from?.first_name || 'Admin';
        const originalText =
          ctx.callbackQuery && 'message' in ctx.callbackQuery && ctx.callbackQuery.message && 'text' in ctx.callbackQuery.message
            ? ctx.callbackQuery.message.text
            : ctx.callbackQuery && 'message' in ctx.callbackQuery && ctx.callbackQuery.message && 'caption' in ctx.callbackQuery.message
              ? (ctx.callbackQuery.message as { caption?: string }).caption || ''
              : '';

        const rejectionNotice = `${originalText}\n\n━━━━━━━━━━━━━━━━━━━━\n❌ <b>RAD ETILDI</b> (${adminName} tomonidan rad etildi va foydalanuvchiga xabar yuborildi)`;

        if (ctx.callbackQuery && 'message' in ctx.callbackQuery && ctx.callbackQuery.message && 'caption' in ctx.callbackQuery.message) {
          await ctx.editMessageCaption(rejectionNotice, { parse_mode: 'HTML' });
        } else {
          await ctx.editMessageText(rejectionNotice, { parse_mode: 'HTML' });
        }
      } else {
        await ctx.answerCbQuery('❌ Xatolik yuz berdi.', { show_alert: true });
      }
    } catch (err) {
      logger.error({ error: err }, 'Unhandled error in v_rej action');
      try {
        await ctx.answerCbQuery('❌ Xatolik yuz berdi.', { show_alert: true });
      } catch {}
    }
  });

  // -------------------------------------------------------------
  // PHOTO / SCREENSHOT HANDLER (Verification & feedback proof)
  // -------------------------------------------------------------
  bot.on(message('photo'), async (ctx) => {
    const fromUser = ctx.from;
    const photos = ctx.message.photo;
    const largestPhoto = photos[photos.length - 1];
    const photoFileId = largestPhoto.file_id;
    const caption = ctx.message.caption || '';
    const isAdmin = isSenderAdmin(fromUser.id);

    logger.info(
      { userId: fromUser.id, photoFileId, caption },
      'Received photo/screenshot from user',
    );

    const vResult = await verification.submitVerificationRequest({
      telegramId: fromUser.id,
      username: fromUser.username,
      firstName: fromUser.first_name,
      lastName: fromUser.last_name,
      proofText: caption || '📸 Foydalanuvchi skrinshot yubordi',
      photoFileId,
    });

    const hasUsernameInCaption =
      caption.includes('@') ||
      caption.toLowerCase().includes('nik') ||
      caption.toLowerCase().includes('user') ||
      caption.toLowerCase().includes('profil');

    let photoReply = vResult.userMessage;
    if (!hasUsernameInCaption) {
      photoReply +=
        '\n\n💡 <b>Muhim eslatma:</b>\nAgar hali yozmagan bo‘lsangiz, tasdiqlash nishoni berilishi kerak bo‘lgan <b>Zynygram ilovasidagi foydalanuvchi nomingizni (username / nikingizni)</b> ham shu yerga yozib yuboring! 📱🛡';
    }

    await ctx.reply(photoReply, {
      parse_mode: 'HTML',
      ...(isAdmin ? getAdminMainMenu() : getUserMainMenu()),
    });
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
      message('audio'),
      message('video_note'),
    ],
    async (ctx) => {
      logger.info({ userId: ctx.from?.id }, 'Unsupported media type received');
      await ctx.reply(UNSUPPORTED_CONTENT_MESSAGE, {
        parse_mode: 'HTML',
        ...(isSenderAdmin(ctx.from?.id) ? getAdminMainMenu() : getUserMainMenu()),
      });
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

      const hasUsernameInText =
        text.includes('@') ||
        lowerText.includes('nik') ||
        lowerText.includes('user') ||
        lowerText.includes('profil') ||
        lowerText.includes('login');

      let textReply = vResult.userMessage;
      if (!hasUsernameInText) {
        textReply +=
          '\n\n💡 <b>Muhim eslatma:</b>\nAgar hali yozmagan bo‘lsangiz, tasdiqlash nishoni berilishi kerak bo‘lgan <b>Zynygram ilovasidagi foydalanuvchi nomingizni (username / nikingizni)</b> ham shu yerga yozib yuboring! 📱🛡';
      }

      await ctx.reply(textReply, {
        parse_mode: 'HTML',
        ...(isAdmin ? getAdminMainMenu() : getUserMainMenu()),
      });
      return;
    }

    // Feedback / Suggestion / Bug report detection
    const isFeedback =
      lowerText.includes('taklif') ||
      lowerText.includes('muammo') ||
      lowerText.includes('shikoyat') ||
      lowerText.includes('xatolik') ||
      lowerText.includes('ishlamayapti') ||
      lowerText.includes('fikr') ||
      lowerText.includes('maslahat') ||
      lowerText.includes('bug');

    if (!isAdmin && isFeedback) {
      const userHandle = fromUser.username ? `@${fromUser.username}` : fromUser.first_name || 'Foydalanuvchi';
      const feedbackAlert = `📩 <b>YANGI TAKLIF YOKI MUAMMO MUROJAATI!</b> 🌟

👤 <b>Foydalanuvchi:</b> ${userHandle}
🆔 <b>Telegram ID:</b> <code>${fromUser.id}</code>
🕒 <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}

💬 <b>Murojaat matni:</b>
<i>"${text}"</i>`;

      try {
        await ctx.telegram.sendMessage(PRIMARY_ADMIN_TELEGRAM_ID, feedbackAlert, { parse_mode: 'HTML' });
      } catch (err) {
        logger.error({ error: err }, 'Failed to forward feedback alert to admin');
      }

      await ctx.reply(FEEDBACK_RECEIVED_MESSAGE, {
        parse_mode: 'HTML',
        ...getUserMainMenu(),
      });
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
