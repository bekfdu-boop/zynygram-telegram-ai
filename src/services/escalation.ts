import conversationService, { ConversationService } from './conversation';
import { ConversationStatus } from '@prisma/client';
import config from '../config/env';
import logger from '../utils/logger';
import { Telegraf } from 'telegraf';

export const HUMAN_ESCALATION_USER_CONFIRMATION =
  'Albatta. Masalangiz operatorimizga yuborildi. Iltimos, biroz kuting.';

export interface EscalationRequest {
  conversationId: string;
  telegramId: string | bigint | number;
  username?: string | null;
  firstName?: string | null;
  lastMessageContent: string;
}

export class EscalationService {
  constructor(
    private convService: ConversationService = conversationService,
    private botInstance?: Telegraf,
  ) {}

  /**
   * Sets the bot instance for dispatching notifications to support channels/admins
   */
  public setBot(bot: Telegraf): void {
    this.botInstance = bot;
  }

  /**
   * Escalates a conversation to human operator
   */
  public async escalateToHuman(req: EscalationRequest): Promise<{ success: boolean; userMessage: string }> {
    try {
      // 1. Change status to WAITING_HUMAN so automatic AI stops
      await this.convService.updateStatus(req.conversationId, ConversationStatus.WAITING_HUMAN);

      // 2. Dispatch notification to support group or admins
      await this.notifySupportTeam(req);

      logger.info(
        {
          conversationId: req.conversationId,
          telegramId: req.telegramId.toString(),
        },
        'Conversation successfully escalated to human operator',
      );

      return {
        success: true,
        userMessage: HUMAN_ESCALATION_USER_CONFIRMATION,
      };
    } catch (error) {
      logger.error({ error, conversationId: req.conversationId }, 'Failed to process human escalation');
      return {
        success: false,
        userMessage: HUMAN_ESCALATION_USER_CONFIRMATION,
      };
    }
  }

  /**
   * Sends formatted notification to the configured support group or administrators
   */
  private async notifySupportTeam(req: EscalationRequest): Promise<void> {
    if (!this.botInstance) {
      logger.warn('Telegraf bot instance not bound to EscalationService; escalation notification not sent to Telegram');
      return;
    }

    const userHandle = req.username ? `@${req.username}` : req.firstName || 'Foydalanuvchi';
    const alertMessage = `🆘 Yangi operator so‘rovi

User: ${userHandle}
Telegram ID: ${req.telegramId.toString()}
Conversation ID: ${req.conversationId}

Last message:
${req.lastMessageContent}`;

    try {
      // Prefer SUPPORT_GROUP_ID if configured
      if (config.supportGroupId) {
        await this.botInstance.telegram.sendMessage(config.supportGroupId, alertMessage);
        return;
      }

      // Fallback: Notify admins directly if configured
      if (config.adminIds.length > 0) {
        for (const adminId of config.adminIds) {
          try {
            await this.botInstance.telegram.sendMessage(adminId, alertMessage);
          } catch (adminErr) {
            logger.warn({ adminId, error: adminErr }, 'Failed to notify individual admin');
          }
        }
      }
    } catch (err) {
      logger.error({ error: err }, 'Failed to dispatch Telegram escalation alert');
    }
  }
}

export const escalationService = new EscalationService();
export default escalationService;
