import { Telegraf, Markup } from 'telegraf';
import prisma from '../database/prisma';
import userService, { UserService } from './user';
import { VerificationRequest, VerificationStatus } from '@prisma/client';
import config from '../config/env';
import logger from '../utils/logger';

export const PRIMARY_ADMIN_TELEGRAM_ID = '8191294446';

export const VERIFICATION_APPROVED_USER_MESSAGE =
  '🎉 <b>Tabriklaymiz!</b> 🌟\n\nSizning <b>Zynygram tasdiqlash nishoni</b> (verifikatsiya) so‘rovingiz ma’qullandi va profilingiz <i>muvaffaqiyatli tasdiqlandi!</i> 🛡✨\n\n<b>Zynygram</b> loyihasini qo‘llab-quvvatlayotganingiz uchun samimiy minnatdorchilik bildiramiz! 🤝🚀';

export const VERIFICATION_REJECTED_USER_MESSAGE =
  'Kechirasiz, sizning <b>Zynygram tasdiqlash nishoni</b> so‘rovingiz rad etildi. ℹ️\n\nIltimos, rasmiy shartlar (<i>Story/Reels yoki Telegram kanallarda post ulashish</i>) to‘liq bajarilganligini tekshirib, qaytadan havola yoki skrinshot bilan murojaat qiling. 🤝';

export interface CreateVerificationInput {
  telegramId: bigint | string | number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  proofText: string;
  photoFileId?: string | null;
}

export class VerificationService {
  private botInstance?: Telegraf;

  constructor(private users: UserService = userService) {}

  public setBot(bot: Telegraf): void {
    this.botInstance = bot;
  }

  /**
   * Creates a pending verification request and alerts the admin with interactive buttons
   */
  public async submitVerificationRequest(
    input: CreateVerificationInput,
  ): Promise<{ success: boolean; requestId: string; userMessage: string }> {
    try {
      const user = await this.users.getOrCreateUser({
        telegramId: input.telegramId,
        username: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
      });

      const finalProof = input.photoFileId
        ? input.proofText
          ? `${input.proofText}\n[Photo: ${input.photoFileId}]`
          : `[Photo: ${input.photoFileId}]`
        : input.proofText;

      const request = await prisma.verificationRequest.create({
        data: {
          userId: user.id,
          status: VerificationStatus.PENDING,
          proofText: finalProof,
        },
        include: {
          user: true,
        },
      });

      logger.info(
        { requestId: request.id, userId: user.id, telegramId: user.telegramId.toString() },
        'Verification request created, notifying admin',
      );

      // Dispatch interactive notification to admin (8191294446 and configured admins)
      await this.sendVerificationAlertToAdmin(request);

      return {
        success: true,
        requestId: request.id,
        userMessage:
          '✅ <b>Arizangiz qabul qilindi!</b> 🌟\n\nSiz yuborgan isbot <i>(havola yoki skrinshot)</i> ma’muriyatimizga ko‘rib chiqish uchun yuborildi. 🛡\n\nTez orada mutaxassislarimiz ko‘rib chiqib, profilingizni tasdiqlashadi. <i>Iltimos, biroz kuting.</i> 🤝✨',
      };
    } catch (error) {
      logger.error({ error }, 'Failed to submit verification request');
      return {
        success: false,
        requestId: '',
        userMessage:
          'Kechirasiz, tasdiqlash so‘rovini qabul qilishda texnik muammo yuz berdi. Iltimos, birozdan so‘ng qayta urinib ko‘ring.',
      };
    }
  }

  /**
   * Approves a verification request and notifies the user
   */
  public async approveRequest(
    requestId: string,
    adminTelegramId: string | number,
  ): Promise<{ success: boolean; userTelegramId?: string }> {
    try {
      const request = await prisma.verificationRequest.findUnique({
        where: { id: requestId },
        include: { user: true },
      });

      if (!request) {
        logger.warn({ requestId }, 'Verification request not found for approval');
        return { success: false };
      }

      // Update request status
      await prisma.verificationRequest.update({
        where: { id: requestId },
        data: { status: VerificationStatus.APPROVED },
      });

      // Mark user as verified
      await prisma.user.update({
        where: { id: request.userId },
        data: { isVerified: true },
      });

      const userTelegramId = request.user.telegramId.toString();

      logger.info(
        { requestId, userTelegramId, approvedBy: adminTelegramId },
        'Verification request approved by admin',
      );

      // Send congratulations to user
      if (this.botInstance) {
        try {
          await this.botInstance.telegram.sendMessage(
            userTelegramId,
            VERIFICATION_APPROVED_USER_MESSAGE,
            { parse_mode: 'HTML' },
          );
        } catch (msgErr) {
          logger.error({ error: msgErr, userTelegramId }, 'Failed to send approval message to user');
        }
      }

      return { success: true, userTelegramId };
    } catch (error) {
      logger.error({ error, requestId }, 'Error approving verification request');
      return { success: false };
    }
  }

  /**
   * Rejects a verification request and notifies the user
   */
  public async rejectRequest(
    requestId: string,
    adminTelegramId: string | number,
  ): Promise<{ success: boolean; userTelegramId?: string }> {
    try {
      const request = await prisma.verificationRequest.findUnique({
        where: { id: requestId },
        include: { user: true },
      });

      if (!request) {
        logger.warn({ requestId }, 'Verification request not found for rejection');
        return { success: false };
      }

      await prisma.verificationRequest.update({
        where: { id: requestId },
        data: { status: VerificationStatus.REJECTED },
      });

      const userTelegramId = request.user.telegramId.toString();

      logger.info(
        { requestId, userTelegramId, rejectedBy: adminTelegramId },
        'Verification request rejected by admin',
      );

      // Send rejection notice to user
      if (this.botInstance) {
        try {
          await this.botInstance.telegram.sendMessage(
            userTelegramId,
            VERIFICATION_REJECTED_USER_MESSAGE,
            { parse_mode: 'HTML' },
          );
        } catch (msgErr) {
          logger.error({ error: msgErr, userTelegramId }, 'Failed to send rejection message to user');
        }
      }

      return { success: true, userTelegramId };
    } catch (error) {
      logger.error({ error, requestId }, 'Error rejecting verification request');
      return { success: false };
    }
  }

  /**
   * Dispatches formatted notification to admin with interactive buttons
   */
  private async sendVerificationAlertToAdmin(
    request: VerificationRequest & { user: { telegramId: bigint; username: string | null; firstName: string | null } },
  ): Promise<void> {
    if (!this.botInstance) {
      logger.warn('Telegraf bot instance not bound to VerificationService');
      return;
    }

    const userHandle = request.user.username
      ? `@${request.user.username}`
      : request.user.firstName || 'Foydalanuvchi';

    const photoMatch = request.proofText?.match(/\[Photo:\s*([^\]]+)\]/);
    const cleanProof = request.proofText ? request.proofText.replace(/\[Photo:\s*[^\]]+\]/, '').trim() : '';

    // Detect Zynygram username if provided in message
    const customNikMatch = cleanProof.match(/(?:nik|username|profil|login|nomi)[\s:]*@?([a-zA-Z0-9_.]{3,30})/i);
    const atUsernameMatch = cleanProof.match(/@([a-zA-Z0-9_.]{3,30})/);
    const detectedUsername = customNikMatch ? customNikMatch[1] : (atUsernameMatch ? atUsernameMatch[1] : null);
    const zynygramDisplay = detectedUsername ? `<code>@${detectedUsername}</code>` : '⚠️ <i>(Xabar/rasmdan qarang)</i>';

    const alertText = `🛡 <b>YANGI TASDIQLASH NISHONI SO‘ROVI!</b>

👤 <b>Telegram profili:</b> ${userHandle}
🆔 <b>Telegram ID:</b> <code>${request.user.telegramId.toString()}</code>
📱 <b>Zynygram Profili:</b> ${zynygramDisplay}
🕒 <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}

📝 <b>Yuborilgan Isbot / Murojaat:</b>
${cleanProof || (photoMatch ? '📸 <i>(Skrinshot / Rasm ilova qilingan)</i>' : '<i>(Isbot matni yo‘q)</i>')}`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Tasdiqlash', `v_app:${request.id}`),
        Markup.button.callback('❌ Rad etish', `v_rej:${request.id}`),
      ],
    ]);

    // Send to primary admin profile (8191294446) and configured admin IDs
    const targets = new Set<string>([PRIMARY_ADMIN_TELEGRAM_ID, ...config.adminIds]);
    if (config.supportGroupId) {
      targets.add(config.supportGroupId);
    }

    for (const targetId of targets) {
      try {
        if (photoMatch) {
          const sent = await this.botInstance.telegram.sendPhoto(targetId, photoMatch[1], {
            caption: alertText,
            parse_mode: 'HTML',
            reply_markup: keyboard.reply_markup,
          });
          logger.info({ targetId, messageId: sent.message_id }, 'Verification photo alert successfully sent to admin target');
        } else {
          const sent = await this.botInstance.telegram.sendMessage(targetId, alertText, {
            parse_mode: 'HTML',
            reply_markup: keyboard.reply_markup,
          });
          logger.info({ targetId, messageId: sent.message_id }, 'Verification text alert successfully sent to admin target');
        }
      } catch (err) {
        logger.error({ targetId, error: err }, 'Failed to send verification alert to admin target');
      }
    }
  }
  /**
   * Retrieves summary statistics for verification requests
   */
  public async getVerificationStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    try {
      const [total, pending, approved, rejected] = await Promise.all([
        prisma.verificationRequest.count(),
        prisma.verificationRequest.count({ where: { status: VerificationStatus.PENDING } }),
        prisma.verificationRequest.count({ where: { status: VerificationStatus.APPROVED } }),
        prisma.verificationRequest.count({ where: { status: VerificationStatus.REJECTED } }),
      ]);

      return { total, pending, approved, rejected };
    } catch (error) {
      logger.error({ error }, 'Failed to fetch verification statistics');
      return { total: 0, pending: 0, approved: 0, rejected: 0 };
    }
  }

  /**
   * Retrieves pending verification requests with user details
   */
  public async getPendingRequests(limit = 10): Promise<
    (VerificationRequest & {
      user: { telegramId: bigint; username: string | null; firstName: string | null; lastName: string | null };
    })[]
  > {
    try {
      return await prisma.verificationRequest.findMany({
        where: { status: VerificationStatus.PENDING },
        include: {
          user: {
            select: { telegramId: true, username: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch pending verification requests');
      return [];
    }
  }

  /**
   * Retrieves recent verification requests with status
   */
  public async getRecentRequests(limit = 10): Promise<
    (VerificationRequest & {
      user: { telegramId: bigint; username: string | null; firstName: string | null; lastName: string | null };
    })[]
  > {
    try {
      return await prisma.verificationRequest.findMany({
        include: {
          user: {
            select: { telegramId: true, username: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch recent verification requests');
      return [];
    }
  }
}

export const verificationService = new VerificationService();
export default verificationService;

