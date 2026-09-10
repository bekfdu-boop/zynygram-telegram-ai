import logger from '../utils/logger';

export interface ModerationResult {
  isAllowed: boolean;
  reason?: string;
  isThreat: boolean;
  suggestedAction: 'ALLOW' | 'REJECT' | 'ESCALATE';
}

export class ModerationService {
  /**
   * Evaluates an incoming message for spam, credential theft, and jailbreak attempts.
   * Legitimate complaints and negative feedback about Zynygram are deliberately allowed.
   */
  public evaluate(text: string): ModerationResult {
    if (!text || text.trim().length === 0) {
      return {
        isAllowed: true,
        isThreat: false,
        suggestedAction: 'ALLOW',
      };
    }

    // Normalize text: lowercase and normalize varied apostrophe variants
    const lower = text
      .toLowerCase()
      .replace(/[\u2018\u2019\u201A\u201B\u0060\u00B4]/g, "'")
      .trim();

    // 1. Detect Credential Theft & Extraction Attempts
    const credentialTheftPatterns = [
      /send me (?:your|the)?\s*(?:database|db|env|environment|api[ _-]?key|bot[ _-]?token)/i,
      /(?:parol|kod|login|token)[a-z]*\s+(?:bering|yuboring|ayting|ber)/i,
      /(?:дай|скажи|отправь)[a-z]*\s+(?:пароль|токен|ключ|базу данных)/i,
      /reveal\s+(?:your|the)?\s*(?:system prompt|internal instructions|secret)/i,
      /tizim\s+(?:ko'?rsatma|instruksiya)[a-z]*\s+(?:ko'?rsat|ber)/i,
      /show me\s+(?:your|the)?\s*(?:system prompt|hidden prompt)/i,
      /(?:what is|give me|tell me)\s+(?:your|the)?\s*system prompt/i,
    ];

    for (const pattern of credentialTheftPatterns) {
      if (pattern.test(lower)) {
        logger.warn({ textSample: text.substring(0, 50) }, 'Moderation flagged credential/prompt extraction attempt');
        return {
          isAllowed: false,
          reason: 'Credential or prompt extraction attempt detected',
          isThreat: true,
          suggestedAction: 'REJECT',
        };
      }
    }

    // 2. Detect Classic Jailbreaks / Override Attempts
    const jailbreakPatterns = [
      /ignore\s+(?:all\s+)?(?:previous|prior)\s+(?:instructions|rules)/i,
      /disregard\s+(?:all\s+)?(?:your\s+)?(?:instructions|guidelines|rules)/i,
      /barcha\s+(?:avvalgi|oldingi)\s+(?:ko'?rsatma|qoida)[a-z]*\s+(?:unut|bekor qil)/i,
      /забудь\s+(?:все\s+)?(?:предыдущие|прошлые)\s+(?:инструкции|правила)/i,
      /you are now in dan mode/i,
      /you are now an unfiltered ai/i,
      /dan mode/i,
      /jailbreak/i,
    ];

    for (const pattern of jailbreakPatterns) {
      if (pattern.test(lower)) {
        logger.warn({ textSample: text.substring(0, 50) }, 'Moderation flagged prompt injection / jailbreak attempt');
        return {
          isAllowed: false,
          reason: 'System override or jailbreak pattern detected',
          isThreat: true,
          suggestedAction: 'REJECT',
        };
      }
    }

    // 3. Detect Obvious Spam and Flooding
    // Check for excessive repetitive characters (e.g. 'aaaaaaaaaaaaaaaaaaaa')
    if (/(.)\1{20,}/.test(lower)) {
      return {
        isAllowed: false,
        reason: 'Excessive repetitive character spam detected',
        isThreat: false,
        suggestedAction: 'REJECT',
      };
    }

    // Check for crypto/casino spam URLs
    const spamUrlPatterns = [
      /(t\.me\/(joinchat|crypto|casino|binance_airdrop))/i,
      /(win-crypto|free-bitcoin|casino-bonus|1xbet-mirror)/i,
    ];
    for (const pattern of spamUrlPatterns) {
      if (pattern.test(lower)) {
        return {
          isAllowed: false,
          reason: 'Promotional spam link detected',
          isThreat: false,
          suggestedAction: 'REJECT',
        };
      }
    }

    // Normal criticism about Zynygram is permitted and encouraged to receive helpful assistance
    return {
      isAllowed: true,
      isThreat: false,
      suggestedAction: 'ALLOW',
    };
  }
}

export const moderationService = new ModerationService();
export default moderationService;
