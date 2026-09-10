import { MessageRole, ConversationStatus } from '@prisma/client';
import userService, { UserService } from './user';
import conversationService, { ConversationService } from './conversation';
import escalationService, { EscalationService } from './escalation';
import moderationService, { ModerationService } from './moderation';
import aiClient, { IAIClient, AIMessage } from '../ai/client';
import { getRelevantContext } from '../ai/knowledge';
import { buildSystemPromptWithContext } from '../ai/prompts';
import { validateAIResponse, FALLBACK_AI_UNAVAILABLE } from '../ai/response';
import config from '../config/env';
import logger from '../utils/logger';
import { sanitizeText, truncate } from '../utils/text';

export interface ProcessMessageInput {
  telegramId: bigint | string | number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  text: string;
  telegramMessageId?: bigint | number | string | null;
}

export interface ProcessMessageResult {
  replyText: string | null;
  escalatedToHuman: boolean;
  status: ConversationStatus;
}

export class SupportService {
  constructor(
    private users: UserService = userService,
    private conversations: ConversationService = conversationService,
    private escalations: EscalationService = escalationService,
    private moderation: ModerationService = moderationService,
    private ai: IAIClient = aiClient,
  ) {}

  /**
   * Executes the exact support pipeline specified in Section 23:
   * Validate -> User -> Conversation -> Save User Msg -> Check Blocked ->
   * Check Human Status -> Search Knowledge -> History -> Prompt -> AI -> Validate -> Save Assistant Msg -> Return
   */
  public async handleUserMessage(input: ProcessMessageInput): Promise<ProcessMessageResult> {
    const rawText = input.text;
    const sanitizedInput = sanitizeText(rawText);

    // 1. Validate message
    if (!sanitizedInput || sanitizedInput.length === 0) {
      return {
        replyText: 'Iltimos, savolingizni matn ko‘rinishida yozib yuboring.',
        escalatedToHuman: false,
        status: ConversationStatus.AI_HANDLED,
      };
    }

    const trimmedInput = truncate(sanitizedInput, config.maxMessageLength);

    // 2. Find or create user
    const user = await this.users.getOrCreateUser({
      telegramId: input.telegramId,
      username: input.username,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    // 3. Find or create conversation
    const conversation = await this.conversations.getOrCreateActiveConversation(user.id);

    // 4. Save incoming USER message
    await this.conversations.saveMessage(
      conversation.id,
      MessageRole.USER,
      trimmedInput,
      input.telegramMessageId,
    );

    // 5. Check blocked status
    if (user.isBlocked) {
      logger.warn({ telegramId: input.telegramId.toString() }, 'Blocked user attempted to send message');
      return {
        replyText: 'Sizning hisobingiz bloklangan. Yordam xizmatidan foydalana olmaysiz.',
        escalatedToHuman: false,
        status: conversation.status,
      };
    }

    // 6. Moderation Check (Credential theft, system prompt extraction, repetitive spam)
    const moderationResult = this.moderation.evaluate(trimmedInput);
    if (!moderationResult.isAllowed) {
      logger.warn(
        { reason: moderationResult.reason, telegramId: input.telegramId.toString() },
        'Message rejected by moderation service',
      );
      return {
        replyText:
          'Xabaringiz xavfsizlik va moderatsiya qoidalariga mos kelmadi. Iltimos, xizmatdan to‘g‘ri maqsadda foydalaning.',
        escalatedToHuman: false,
        status: conversation.status,
      };
    }

    // 7. Check human escalation status
    // If conversation is already in WAITING_HUMAN, do not generate automatic AI responses
    if (conversation.status === ConversationStatus.WAITING_HUMAN) {
      logger.debug(
        { conversationId: conversation.id },
        'Conversation is in WAITING_HUMAN status, skipping AI response generation',
      );
      return {
        replyText: 'Sizning murojaatingiz operator navbatida turibdi. Iltimos, operator javobini kuting.',
        escalatedToHuman: true,
        status: ConversationStatus.WAITING_HUMAN,
      };
    }

    // Check if the user is explicitly requesting a human operator in text
    const lower = trimmedInput.toLowerCase();
    const explicitHumanPhrases = [
      'operator',
      'inson',
      'odam',
      'human',
      'jonli xodim',
      'operator bilan bog‘la',
      'operator bilan bog\'la',
      'оператор',
      'живой оператор',
      'человек',
      'operator kerak',
      'connect to human',
      'live agent',
    ];

    const isRequestingHuman = explicitHumanPhrases.some((phrase) => lower.includes(phrase));
    if (isRequestingHuman) {
      const escalationRes = await this.escalations.escalateToHuman({
        conversationId: conversation.id,
        telegramId: input.telegramId,
        username: input.username,
        firstName: input.firstName,
        lastMessageContent: trimmedInput,
      });

      // Save system/assistant message informing escalation
      await this.conversations.saveMessage(
        conversation.id,
        MessageRole.ASSISTANT,
        escalationRes.userMessage,
      );

      return {
        replyText: escalationRes.userMessage,
        escalatedToHuman: true,
        status: ConversationStatus.WAITING_HUMAN,
      };
    }

    // 8. Search knowledge base
    const knowledgeContext = getRelevantContext(trimmedInput, 2500);

    // 9. Get recent conversation history (last 10-15 messages for context memory)
    const recentDbMessages = await this.conversations.getRecentMessages(conversation.id, 12);
    const conversationHistory: AIMessage[] = recentDbMessages
      .filter((msg) => msg.role === MessageRole.USER || msg.role === MessageRole.ASSISTANT)
      .map((msg) => ({
        role: msg.role === MessageRole.USER ? 'user' : 'assistant',
        content: msg.content,
      }));

    // 10. Build system prompt with retrieved knowledge
    const systemPrompt = buildSystemPromptWithContext(knowledgeContext);

    const fullMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ];

    // Ensure the current user message is present at the end
    if (
      fullMessages.length === 0 ||
      fullMessages[fullMessages.length - 1].content !== trimmedInput
    ) {
      fullMessages.push({ role: 'user', content: trimmedInput });
    }

    // 11. Call AI with retry & timeout handling
    let rawAIResponse: string;
    try {
      rawAIResponse = await this.ai.generateResponse(fullMessages);
    } catch (aiError) {
      logger.error({ error: aiError }, 'AI response generation failed');

      // Save and return fallback message
      await this.conversations.saveMessage(
        conversation.id,
        MessageRole.ASSISTANT,
        FALLBACK_AI_UNAVAILABLE,
      );

      return {
        replyText: FALLBACK_AI_UNAVAILABLE,
        escalatedToHuman: false,
        status: conversation.status,
      };
    }

    // 12. Validate AI response (anti-leakage, non-empty, length check)
    const validation = validateAIResponse(rawAIResponse, config.maxMessageLength);
    const finalAnswer = validation.sanitizedContent;

    // Check if the AI determined that a human escalation is required
    const indicatesEscalation =
      finalAnswer.includes('operatorimizga yuboraman') ||
      finalAnswer.includes('operatorimizga ulab berishim') ||
      finalAnswer.includes('/human');

    if (indicatesEscalation) {
      // Notify support team of auto-escalation
      await this.escalations.escalateToHuman({
        conversationId: conversation.id,
        telegramId: input.telegramId,
        username: input.username,
        firstName: input.firstName,
        lastMessageContent: trimmedInput,
      });
    }

    // 13. Save ASSISTANT message
    await this.conversations.saveMessage(
      conversation.id,
      MessageRole.ASSISTANT,
      finalAnswer,
    );

    // 14. Return Telegram response
    return {
      replyText: finalAnswer,
      escalatedToHuman: indicatesEscalation,
      status: indicatesEscalation ? ConversationStatus.WAITING_HUMAN : conversation.status,
    };
  }
}

export const supportService = new SupportService();
export default supportService;
