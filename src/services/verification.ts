import { Telegraf, Markup } from 'telegraf';
import prisma from '../database/prisma';
import userService, { UserService } from './user';
import { VerificationRequest, VerificationStatus } from '@prisma/client';
import config from '../config/env';
import logger from '../utils/logger';
import { escapeTelegramHtml } from '../utils/text';

/** @deprecated Use config.adminIds; retained only for backwards-compatible imports. */
export const PRIMARY_ADMIN_TELEGRAM_ID = config.adminIds[0] ?? '';

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
  businessConnectionId?: string | null;
  chatId?: string | number | null;
}

export class VerificationService {
  private botInstance?: Telegraf;

  constructor(private users: UserService = userService) {}

  public setBot(bot: Telegraf): void {
    this.botInstance = bot;
  }

  /**
   * Creates a pending verification request and alerts the admin with interactive buttons
   * Strictly limits verification requests to 1 request per user.
   */
  public async submitVerificationRequest(
    input: CreateVerificationInput,
  ): Promise<{ success: boolean; requestId: string; userMessage: string; alreadySubmitted?: boolean }> {
    try {
      const user = await this.users.getOrCreateUser({
        telegramId: input.telegramId,
        username: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
      });

      if (user.isVerified) {
        logger.info(
          { userId: user.id, telegramId: user.telegramId.toString() },
          'User is already verified; duplicate verification request rejected',
        );
        return {
          success: false,
          alreadySubmitted: true,
          requestId: '',
          userMessage: 'ℹ️ Sizning Zynygram profilingiz allaqachon tasdiqlangan! 🛡✨',
        };
      }

      const existingRequest = await prisma.verificationRequest.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      if (existingRequest) {
        logger.info(
          {
            userId: user.id,
            telegramId: user.telegramId.toString(),
            existingRequestId: existingRequest.id,
            status: existingRequest.status,
          },
          'User already submitted a verification request earlier; only 1 request per user allowed',
        );

        let userMessage =
          'ℹ️ Siz allaqachon tasdiqlash so‘rovini yuborgansiz. Tasdiqlash so‘rovi har bir foydalanuvchidan faqat bir marta qabul qilinadi.';
        if (existingRequest.status === VerificationStatus.PENDING) {
          userMessage =
            '⏳ Sizning tasdiqlash so‘rovingiz allaqachon qabul qilingan va ko‘rib chiqilmoqda. Iltimos, mutaxassislarimiz javobini kuting. 🤝';
        } else if (existingRequest.status === VerificationStatus.APPROVED) {
          userMessage = 'ℹ️ Sizning Zynygram profilingiz allaqachon tasdiqlangan! 🛡✨';
        }

        return {
          success: false,
          alreadySubmitted: true,
          requestId: existingRequest.id,
          userMessage,
        };
      }

      let finalProof = input.photoFileId
        ? input.proofText
          ? `${input.proofText}\n[Photo: ${input.photoFileId}]`
          : `[Photo: ${input.photoFileId}]`
        : input.proofText;

      if (input.businessConnectionId && input.chatId) {
        finalProof = `${finalProof}\n[BusinessChat: ${input.businessConnectionId}:${input.chatId}]`;
      }

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

      // Dispatch interactive notification to configured support recipients.
      await this.sendVerificationAlertToAdmin(request);

      return {
        success: true,
        alreadySubmitted: false,
        requestId: request.id,
        userMessage:
          '✅ <b>Arizangiz qabul qilindi!</b> 🌟\n\nSiz yuborgan isbot <i>(havola yoki skrinshot)</i> ma’muriyatimizga ko‘rib chiqish uchun yuborildi. 🛡\n\nTez orada mutaxassislarimiz ko‘rib chiqib, profilingizni tasdiqlashadi. <i>Iltimos, biroz kuting.</i> 🤝✨',
      };
    } catch (error) {
      logger.error({ error }, 'Failed to submit verification request');
      return {
        success: false,
        alreadySubmitted: false,
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
        let sent = false;
        const businessMatch = request.proofText?.match(/\[BusinessChat:\s*([^:]+):([^\]]+)\]/);

        if (businessMatch) {
          const [, connectionId, chatId] = businessMatch;
          try {
            await this.botInstance.telegram.callApi('sendMessage', {
              chat_id: chatId.trim(),
              text: VERIFICATION_APPROVED_USER_MESSAGE,
              parse_mode: 'HTML',
              business_connection_id: connectionId.trim(),
            } as never);
            sent = true;
            logger.info(
              { requestId, chatId: chatId.trim(), connectionId: connectionId.trim() },
              'Approval message successfully sent to user via Telegram Business connection',
            );
          } catch (bizErr) {
            logger.error(
              { error: bizErr, requestId, chatId, connectionId },
              'Failed to deliver approval message via Telegram Business connection',
            );
          }
        }

        // If not sent via business connection, send direct Telegram message (provided user is not admin)
        if (!sent && userTelegramId !== adminTelegramId.toString()) {
          try {
            await this.botInstance.telegram.sendMessage(
              userTelegramId,
              VERIFICATION_APPROVED_USER_MESSAGE,
              { parse_mode: 'HTML' },
            );
            sent = true;
            logger.info({ requestId, userTelegramId }, 'Approval message sent via direct Telegram chat');
          } catch (msgErr) {
            logger.error({ error: msgErr, userTelegramId }, 'Failed to send direct approval message to user');
          }
        }
      }

      return { success: true, userTelegramId };
    } catch (error) {
      logger.error({ error, requestId }, 'Error approving verification request');
      return { success: false };
    }
  }

  /**
   * Rejects a verification request without sending notification to user
   * (Tasdiqlash bekor bo'lsa foydalanuvchiga xabar borishi shart emas)
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
        'Verification request rejected by admin (no notification sent to user as per policy)',
      );

      // Do not send rejection notice to user
      return { success: true, userTelegramId };
    } catch (error) {
      logger.error({ error, requestId }, 'Error rejecting verification request');
      return { success: false };
    }
  }

  /**
   * Retrieves verification status for a specific user by telegramId
   */
  public async getUserVerificationStatus(telegramId: bigint | string | number): Promise<{
    isVerified: boolean;
    hasRequest: boolean;
    status?: VerificationStatus;
    message?: string;
  }> {
    try {
      const user = await this.users.findByTelegramId(telegramId);
      if (!user) {
        return { isVerified: false, hasRequest: false };
      }
      if (user.isVerified) {
        return {
          isVerified: true,
          hasRequest: false,
          message: '🎉 <b>Sizning profilingiz allaqachon tasdiqlangan!</b> 🛡✨',
        };
      }
      const existingRequest = await prisma.verificationRequest.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (existingRequest) {
        let message =
          'ℹ️ Siz allaqachon tasdiqlash so‘rovini yuborgansiz. Tasdiqlash so‘rovi har bir foydalanuvchidan faqat bir marta qabul qilinadi.';
        if (existingRequest.status === VerificationStatus.PENDING) {
          message =
            '⏳ <b>Arizangiz ko‘rib chiqilmoqda!</b>\n\nSizning tasdiqlash so‘rovingiz allaqachon qabul qilingan. Mutaxassislarimiz tez orada ko‘rib chiqishadi. Iltimos, kuting. 🤝';
        } else if (existingRequest.status === VerificationStatus.APPROVED) {
          message = '🎉 <b>Sizning profilingiz allaqachon tasdiqlangan!</b> 🛡✨';
        }
        return {
          isVerified: false,
          hasRequest: true,
          status: existingRequest.status,
          message,
        };
      }
      return { isVerified: false, hasRequest: false };
    } catch (err) {
      logger.error({ error: err, telegramId: telegramId.toString() }, 'Failed to get user verification status');
      return { isVerified: false, hasRequest: false };
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
    const cleanProof = request.proofText
      ? request.proofText
          .replace(/\[Photo:\s*[^\]]+\]/g, '')
          .replace(/\[BusinessChat:\s*[^\]]+\]/g, '')
          .trim()
      : '';

    // Detect Zynygram username if provided in message
    const customNikMatch = cleanProof.match(/(?:nik|username|profil|login|nomi)[\s:]*@?([a-zA-Z0-9_.]{3,30})/i);
    const atUsernameMatch = cleanProof.match(/@([a-zA-Z0-9_.]{3,30})/);
    const detectedUsername = customNikMatch ? customNikMatch[1] : (atUsernameMatch ? atUsernameMatch[1] : null);
    const zynygramDisplay = detectedUsername ? `<code>@${escapeTelegramHtml(detectedUsername)}</code>` : '⚠️ <i>(Xabar/rasmdan qarang)</i>';

    const alertText = `🛡 <b>YANGI TASDIQLASH NISHONI SO‘ROVI!</b>

👤 <b>Telegram profili:</b> ${userHandle}
🆔 <b>Telegram ID:</b> <code>${request.user.telegramId.toString()}</code>
📱 <b>Zynygram Profili:</b> ${zynygramDisplay}
🕒 <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}

📝 <b>Yuborilgan Isbot / Murojaat:</b>
${cleanProof || (photoMatch ? '📸 <i>(Skrinshot / Rasm ilova qilingan)</i>' : '<i>(Isbot matni yo‘q)</i>')}`;

    const safeAlertText = alertText
      .replace(userHandle, escapeTelegramHtml(userHandle))
      .replace(cleanProof, cleanProof ? escapeTelegramHtml(cleanProof) : '');

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Tasdiqlash', `v_app:${request.id}`),
        Markup.button.callback('❌ Rad etish', `v_rej:${request.id}`),
      ],
    ]);

    // Send to configured administrators and, when set, the support group.
    const targets = new Set<string>(config.adminIds);
    if (config.supportGroupId) {
      targets.add(config.supportGroupId);
    }

    for (const targetId of targets) {
      try {
        if (photoMatch) {
          const sent = await this.botInstance.telegram.sendPhoto(targetId, photoMatch[1], {
            caption: safeAlertText,
            parse_mode: 'HTML',
            reply_markup: keyboard.reply_markup,
          });
          logger.info({ targetId, messageId: sent.message_id }, 'Verification photo alert successfully sent to admin target');
        } else {
          const sent = await this.botInstance.telegram.sendMessage(targetId, safeAlertText, {
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

  /**
   * Paged verification requests with filtering for Admin Web Panel
   */
  public async getRequestsPaged(options: {
    status?: VerificationStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ requests: any[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.status) {
      where.status = options.status;
    }
    if (options.search && options.search.trim()) {
      const term = options.search.trim();
      const isNum = /^\d+$/.test(term);
      where.OR = [
        { proofText: { contains: term, mode: 'insensitive' } },
        { user: { username: { contains: term, mode: 'insensitive' } } },
        { user: { firstName: { contains: term, mode: 'insensitive' } } },
        ...(isNum ? [{ user: { telegramId: BigInt(term) } }] : []),
      ];
    }

    try {
      const [total, rawRequests] = await Promise.all([
        prisma.verificationRequest.count({ where }),
        prisma.verificationRequest.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                telegramId: true,
                username: true,
                firstName: true,
                lastName: true,
                isVerified: true,
                isBlocked: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      const requests = rawRequests.map((r) => {
        const photoMatch = r.proofText?.match(/\[Photo:\s*([^\]]+)\]/);
        const cleanProof = r.proofText
          ? r.proofText
              .replace(/\[Photo:\s*[^\]]+\]/g, '')
              .replace(/\[BusinessChat:\s*[^\]]+\]/g, '')
              .trim()
          : '';

        const customNikMatch = cleanProof.match(/(?:nik|username|profil|login|nomi)[\s:]*@?([a-zA-Z0-9_.]{3,30})/i);
        const atUsernameMatch = cleanProof.match(/@([a-zA-Z0-9_.]{3,30})/);
        const detectedUsername = customNikMatch ? customNikMatch[1] : (atUsernameMatch ? atUsernameMatch[1] : null);

        return {
          id: r.id,
          status: r.status,
          proofText: cleanProof,
          rawProof: r.proofText,
          photoFileId: photoMatch ? photoMatch[1] : null,
          zynygramUsername: detectedUsername,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          user: {
            ...r.user,
            telegramId: r.user.telegramId.toString(),
          },
        };
      });

      return {
        requests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (err) {
      logger.error({ error: err }, 'Failed to fetch paged verification requests');
      return { requests: [], total: 0, page, totalPages: 0 };
    }
  }
}

export const verificationService = new VerificationService();
export default verificationService;
