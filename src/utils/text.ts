/**
 * Text processing and sanitization utilities
 */

/**
 * Truncates text to a maximum length with an optional ellipsis suffix
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Strips dangerous control characters while preserving normal whitespace
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  // Remove non-printable control characters except standard newlines and tabs
  return Array.from(text)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return (code >= 32 || code === 10 || code === 13 || code === 9) && code !== 127;
    })
    .join('')
    .trim();
}

/**
 * Escapes characters for Telegram MarkdownV2
 */
export function escapeMarkdownV2(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

/** Escapes untrusted content before putting it in Telegram's HTML parse mode. */
export function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Checks for common leaked secrets/credentials patterns (API keys, JWT, passwords, etc.)
 */
export function containsSensitivePatterns(text: string): boolean {
  const sensitivePatterns = [
    /sk-[a-zA-Z0-9]{20,}/i,               // OpenAI style key
    /eyJ[a-zA-Z0-9_-]{10,}\.eyJ/i,       // JWT token
    /bot[0-9]{8,10}:[a-zA-Z0-9_-]{35}/i, // Telegram Bot token
    /DATABASE_URL/i,
    /AI_API_KEY/i,
    /BOT_TOKEN/i,
    /password\s*=\s*['"][^'"]+['"]/i,
  ];

  return sensitivePatterns.some((pattern) => pattern.test(text));
}

/**
 * Basic heuristic language detector: detects whether input is predominantly
 * Uzbek (Latin/Cyrillic), Russian (Cyrillic), or English (Latin).
 */
export function detectLanguage(text: string): 'uz' | 'ru' | 'en' {
  const lower = text.toLowerCase();

  // Uzbek-specific markers (Latin and Cyrillic)
  const uzbekWords = [
    'salom', 'assalomu', 'alaykum', 'qanday', 'nima', 'qilish', 'haqida',
    'rahmat', 'iltimos', 'yordam', 'akkaunt', 'tasdiqlash', 'kerak', 'mumkin',
    'bormi', 'yo‘q', "yo'q", 'o‘zbek', "o'zbek", 'qayerda', 'nega', 'uchun',
    'салом', 'қандай', 'нима', 'ёрдам', 'раҳмат', 'керак', 'борми', 'йўқ'
  ];

  // Russian markers
  const russianWords = [
    'привет', 'здравствуйте', 'как', 'что', 'помогите', 'спасибо', 'пожалуйста',
    'аккаунт', 'почему', 'где', 'можно', 'нужно', 'поддержка', 'вопрос'
  ];

  // Check Uzbek keywords first
  for (const word of uzbekWords) {
    if (lower.includes(word)) {
      return 'uz';
    }
  }

  // Check Russian keywords
  for (const word of russianWords) {
    if (lower.includes(word)) {
      return 'ru';
    }
  }

  // If heavy cyrillic without uzbek markers, classify as Russian
  const cyrillicMatches = lower.match(/[\u0400-\u04FF]/g) || [];
  if (cyrillicMatches.length > text.length * 0.3) {
    return 'ru';
  }

  // Check English words
  const englishWords = ['hello', 'hi', 'how', 'what', 'help', 'thanks', 'thank you', 'please', 'account', 'why', 'can', 'is'];
  for (const word of englishWords) {
    if (lower.includes(word)) {
      return 'en';
    }
  }

  // Default to Uzbek as primary audience
  return 'uz';
}
