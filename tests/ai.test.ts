import { describe, it, expect, vi } from 'vitest';
import { buildSystemPromptWithContext, SYSTEM_PROMPT } from '../src/ai/prompts';
import { validateAIResponse, FALLBACK_TECHNICAL_ERROR } from '../src/ai/response';
import { OpenAICompatibleClient, AIMessage } from '../src/ai/client';

describe('AI Prompt Generation', () => {
  it('should return base system prompt when no context is provided', () => {
    const prompt = buildSystemPromptWithContext();
    expect(prompt).toBe(SYSTEM_PROMPT);
    expect(prompt).toContain('Zynygram AI Support');
  });

  it('should inject official knowledge context into system prompt', () => {
    const context = '### [verification] Tasdiqlash belgisi ma\'lumotlari';
    const prompt = buildSystemPromptWithContext(context);

    expect(prompt).toContain('OFFICIAL KNOWLEDGE BASE CONTEXT:');
    expect(prompt).toContain(context);
    expect(prompt).toContain('STRICT KNOWLEDGE RULE:');
  });
});

describe('AI Response Validation', () => {
  it('should accept valid and clean responses', () => {
    const valid = 'Zynygram - bu O‘zbekiston ijtimoiy tarmog‘i.';
    const result = validateAIResponse(valid, 4000);

    expect(result.isValid).toBe(true);
    expect(result.sanitizedContent).toBe(valid);
  });

  it('should reject empty or whitespace responses with fallback', () => {
    const resultEmpty = validateAIResponse('', 4000);
    expect(resultEmpty.isValid).toBe(false);
    expect(resultEmpty.sanitizedContent).toBe(FALLBACK_TECHNICAL_ERROR);

    const resultWhitespace = validateAIResponse('   \n  ', 4000);
    expect(resultWhitespace.isValid).toBe(false);
    expect(resultWhitespace.sanitizedContent).toBe(FALLBACK_TECHNICAL_ERROR);
  });

  it('should reject responses exceeding maximum length', () => {
    const longText = 'A'.repeat(5000);
    const result = validateAIResponse(longText, 4000);

    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('Response length exceeded');
    expect(result.sanitizedContent).toBe(FALLBACK_TECHNICAL_ERROR);
  });

  it('should reject responses leaking API keys or secrets', () => {
    const leak = 'Mana sizga API kalit: sk-1234567890abcdef1234567890abcdef';
    const result = validateAIResponse(leak, 4000);

    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('Sensitive pattern detected');
    expect(result.sanitizedContent).toBe(FALLBACK_TECHNICAL_ERROR);
  });

  it('should reject responses leaking system prompt instructions', () => {
    const leak = 'You are Zynygram AI Support and here are internal instructions...';
    const result = validateAIResponse(leak, 4000);

    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('System prompt leakage detected');
    expect(result.sanitizedContent).toBe(FALLBACK_TECHNICAL_ERROR);
  });

  it('should reject responses leaking backend errors', () => {
    const leak = 'Error: ECONNREFUSED connecting to database';
    const result = validateAIResponse(leak, 4000);

    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('Internal error trace detected');
    expect(result.sanitizedContent).toBe(FALLBACK_TECHNICAL_ERROR);
  });
});

describe('AI Client (Mocked)', () => {
  it('should handle completions via mocked client without real API key', async () => {
    const client = new OpenAICompatibleClient('mock-key', 'https://mock.example.com/v1', 'mock-model');

    // Mock internal openai chat completions create
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: 'Zynygram yordamchisi sizga xizmat ko‘rsatadi.',
          },
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
    });

    // Replace internal method
    (client as unknown as { client: { chat: { completions: { create: typeof mockCreate } } } }).client = {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    };

    const messages: AIMessage[] = [{ role: 'user', content: 'Salom' }];
    const response = await client.generateResponse(messages);

    expect(response).toBe('Zynygram yordamchisi sizga xizmat ko‘rsatadi.');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});

