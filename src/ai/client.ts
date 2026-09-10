import OpenAI from 'openai';
import config from '../config/env';
import logger from '../utils/logger';
import { AIError } from '../utils/errors';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface IAIClient {
  generateResponse(messages: AIMessage[], options?: AIGenerateOptions): Promise<string>;
}

export class OpenAICompatibleClient implements IAIClient {
  private client: OpenAI;
  private defaultModel: string;
  private defaultTemperature: number;
  private maxRetries = 3;
  private defaultTimeoutMs = 30000;

  constructor(
    apiKey = config.ai.apiKey,
    baseURL = config.ai.baseUrl,
    defaultModel = config.ai.model,
    defaultTemperature = config.ai.temperature,
  ) {
    this.defaultModel = defaultModel;
    this.defaultTemperature = defaultTemperature;
    this.client = new OpenAI({
      apiKey,
      baseURL,
      maxRetries: 0, // We manage retries explicitly with custom transient backoff logic
      timeout: this.defaultTimeoutMs,
    });
  }

  /**
   * Generates a response from the OpenAI-compatible endpoint with resilient retry logic
   */
  public async generateResponse(
    messages: AIMessage[],
    options?: AIGenerateOptions,
  ): Promise<string> {
    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature ?? this.defaultTemperature;
    const maxTokens = options?.maxTokens;
    const timeoutMs = options?.timeoutMs || this.defaultTimeoutMs;

    let attempt = 0;
    let lastError: unknown = null;

    while (attempt < this.maxRetries) {
      attempt++;
      try {
        logger.debug(
          { model, messageCount: messages.length, attempt },
          'Sending completion request to AI provider',
        );

        const response = await this.client.chat.completions.create(
          {
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
          },
          {
            timeout: timeoutMs,
          },
        );

        const choice = response.choices?.[0];
        const content = choice?.message?.content;

        if (!content || typeof content !== 'string') {
          throw new AIError('AI provider returned an empty completion response', false);
        }

        logger.debug(
          {
            model,
            finishReason: choice.finish_reason,
            tokens: response.usage,
          },
          'AI response received successfully',
        );

        return content;
      } catch (error: unknown) {
        lastError = error;
        const isTransient = this.isTransientError(error);

        logger.warn(
          {
            attempt,
            maxRetries: this.maxRetries,
            isTransient,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'AI request encountered an error',
        );

        if (!isTransient || attempt >= this.maxRetries) {
          break;
        }

        // Exponential backoff with jitter
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000) + Math.random() * 300;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    const message = lastError instanceof Error ? lastError.message : 'Unknown AI API error';
    throw new AIError(`Failed to generate AI response after ${attempt} attempts: ${message}`, false);
  }

  /**
   * Determines if an error is a safe transient failure (e.g. rate limit 429, 5xx server error, timeout)
   */
  private isTransientError(error: unknown): boolean {
    if (error instanceof OpenAI.APIError) {
      // 429 = Rate Limit, 500/502/503/504 = Transient server errors
      if (error.status === 429 || (error.status && error.status >= 500 && error.status < 600)) {
        return true;
      }
      return false;
    }

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes('timeout') ||
        msg.includes('etimedout') ||
        msg.includes('econnreset') ||
        msg.includes('rate limit') ||
        msg.includes('network')
      ) {
        return true;
      }
    }

    return false;
  }
}

export const aiClient = new OpenAICompatibleClient();
export default aiClient;

