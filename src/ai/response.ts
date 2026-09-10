import { containsSensitivePatterns } from '../utils/text';
import logger from '../utils/logger';

export interface ValidationResult {
  isValid: boolean;
  sanitizedContent: string;
  reason?: string;
}

export const FALLBACK_TECHNICAL_ERROR =
  'Kechirasiz, hozir javob berishda texnik muammo yuz berdi. Iltimos, birozdan keyin qayta urinib ko‘ring.';

export const FALLBACK_AI_UNAVAILABLE =
  'Kechirasiz, hozir AI yordamchida texnik nosozlik yuz berdi. Iltimos, operator bilan bog‘lanish uchun /human buyrug‘idan foydalaning.';

/**
 * Validates the raw text returned by the AI model to ensure safety, formatting,
 * and prevent system prompt or credential leaks.
 */
export function validateAIResponse(rawResponse: string | null | undefined, maxLength = 4000): ValidationResult {
  if (!rawResponse || typeof rawResponse !== 'string') {
    logger.warn('AI returned an empty or invalid response');
    return {
      isValid: false,
      sanitizedContent: FALLBACK_TECHNICAL_ERROR,
      reason: 'Empty response',
    };
  }

  const trimmed = rawResponse.trim();
  if (trimmed.length === 0) {
    return {
      isValid: false,
      sanitizedContent: FALLBACK_TECHNICAL_ERROR,
      reason: 'Whitespace-only response',
    };
  }

  if (trimmed.length > maxLength) {
    logger.warn({ length: trimmed.length, maxLength }, 'AI response exceeded maximum allowed length');
    return {
      isValid: false,
      sanitizedContent: FALLBACK_TECHNICAL_ERROR,
      reason: 'Response length exceeded',
    };
  }

  // Check for leaked credentials or secrets
  if (containsSensitivePatterns(trimmed)) {
    logger.error('CRITICAL: AI response attempted to leak sensitive credentials or keys');
    return {
      isValid: false,
      sanitizedContent: FALLBACK_TECHNICAL_ERROR,
      reason: 'Sensitive pattern detected',
    };
  }

  // Check for system prompt leakage
  const systemPromptLeakMarkers = [
    'You are Zynygram AI Support',
    'LANGUAGE:',
    'KNOWLEDGE POLICY:',
    'HUMAN ESCALATION:',
    'STRICT KNOWLEDGE RULE:',
    'internal instructions',
    'OpenAI-compatible',
  ];

  for (const marker of systemPromptLeakMarkers) {
    if (trimmed.includes(marker)) {
      logger.warn({ marker }, 'AI response leaked system prompt instructions');
      return {
        isValid: false,
        sanitizedContent: FALLBACK_TECHNICAL_ERROR,
        reason: 'System prompt leakage detected',
      };
    }
  }

  // Check for raw internal error leaks
  const internalErrorMarkers = [
    'InternalServerError',
    'ECONNREFUSED',
    'UnhandledPromiseRejection',
    'PrismaClientKnownRequestError',
    'DatabaseError',
  ];

  for (const errMarker of internalErrorMarkers) {
    if (trimmed.includes(errMarker)) {
      logger.error({ errMarker }, 'AI response contained raw backend error trace');
      return {
        isValid: false,
        sanitizedContent: FALLBACK_TECHNICAL_ERROR,
        reason: 'Internal error trace detected',
      };
    }
  }

  return {
    isValid: true,
    sanitizedContent: trimmed,
  };
}

