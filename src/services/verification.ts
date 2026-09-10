import { Telegraf, Markup } from 'telegraf';
import prisma from '../database/prisma';
import userService, { UserService } from './user';
import { VerificationRequest, VerificationStatus } from '@prisma/client';
import config from '../config/env';
import logger from '../utils/logger';

export const PRIMARY_ADMIN_TELEGRAM_ID = '8191294446';

export const VERIFICATION_APPROVED_USER_MESSAGE =
  'Tabriklaymiz! 🎉\n\nSizning Zynygram tasdiqlash nishoni (verifikatsiya) so‘rovingiz ma’qullandi va profilingiz muvaffaqiyatli tasdiqlandi! 🛡✨\n\nZynygram loyihasini qo‘llab-quvvatlaganingiz uchun tashakkur!';

export const VERIFICATION_REJECTED_USER_MESSAGE =
  'Kechirasiz, sizning Zynygram tasdiqlash nishoni so‘rovingiz rad etildi.\n\nIltimos, rasmiy shartlar (Story/Reels yoki Telegram kanallarda post ulashish) to‘liq bajarilganligini tekshirib, qaytadan havola bilan murojaat qiling.';

export interface CreateVerificationInput {
  telegramId: bigint | string | number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  proofText: string;
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

      const request = await prisma.verificationRequest.create({
        data: {
          userId: user.id,
          status: VerificationStatus.PENDING,
          proofText: input.proofText,
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
          '✅ Sizning tasdiqlash nishoni bo‘yicha arizangiz qabul qilindi va ma’muriyatga yuborildi!\n\nTez orada ko‘rib chiqilib, profilingiz tasdiqlanadi. Iltimos, javobni kuting.',
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

    const alertText = `🛡 YANGI TASDIQLASH NISHONI SO‘ROVI!

Foydalanuvchi: ${userHandle}
Telegram ID: ${request.user.telegramId.toString()}
Vaqt: ${new Date().toLocaleString('uz-UZ')}

Yuborilgan Isbot / Murojaat:
${request.proofText || '(Isbot matni yo‘q)'}`;

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
        await this.botInstance.telegram.sendMessage(targetId, alertText, keyboard);
      } catch (err) {
        logger.warn({ targetId, error: err }, 'Failed to send verification alert to admin target');
      }
    }
  }
}

export const verificationService = new VerificationService();
export default verificationService;

