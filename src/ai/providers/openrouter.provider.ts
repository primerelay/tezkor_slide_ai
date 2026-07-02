import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AiProvider,
  AiProviderOptions,
  AiProviderResponse,
} from './ai-provider.interface';

// OpenRouter model pricing (USD per 1M tokens)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'openai/gpt-4o-mini': { input: 0.15, output: 0.60 },
  'openai/gpt-4o': { input: 2.50, output: 10.00 },
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
  'anthropic/claude-3-sonnet': { input: 3.00, output: 15.00 },
  'google/gemini-flash-1.5': { input: 0.075, output: 0.30 },
  'google/gemini-pro-1.5': { input: 1.25, output: 5.00 },
};

@Injectable()
export class OpenRouterProvider implements AiProvider {
  readonly name = 'openrouter';
  private readonly logger = new Logger(OpenRouterProvider.name);
  private client: OpenAI | null = null;
  private readonly defaultModel = 'openai/gpt-4o-mini';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.openrouterApiKey');
    if (apiKey) {
      this.client = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey,
        defaultHeaders: {
          'HTTP-Referer': 'https://sliderai.uz',
          'X-Title': 'SliderAI UZ',
        },
      });
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async generateText(
    prompt: string,
    systemPrompt?: string,
    options?: AiProviderOptions,
  ): Promise<AiProviderResponse> {
    if (!this.client) {
      throw new Error('OpenRouter provider is not configured');
    }

    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    try {
      const completion = await this.client.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
        top_p: options?.topP ?? 0.9,
        ...(options?.jsonMode
          ? { response_format: { type: 'json_object' as const } }
          : {}),
      });

      const content = completion.choices[0]?.message?.content || '';
      const usage = completion.usage;
      const model = options?.model || this.defaultModel;

      // Calculate cost based on token usage
      let cost: number | undefined;
      if (usage) {
        const pricing = MODEL_PRICING[model] || MODEL_PRICING[this.defaultModel];
        const inputCost = (usage.prompt_tokens / 1_000_000) * pricing.input;
        const outputCost = (usage.completion_tokens / 1_000_000) * pricing.output;
        cost = inputCost + outputCost;

        this.logger.debug(
          `API cost for ${model}: $${cost.toFixed(6)} (${usage.prompt_tokens} in, ${usage.completion_tokens} out)`
        );
      }

      return {
        content,
        usage: usage
          ? {
              inputTokens: usage.prompt_tokens,
              outputTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens,
            }
          : undefined,
        cost,
      };
    } catch (error) {
      this.logger.error('OpenRouter API error:', error);
      throw error;
    }
  }

  async generateJson<T>(
    prompt: string,
    systemPrompt?: string,
    options?: AiProviderOptions,
  ): Promise<{ data: T; cost?: number }> {
    const jsonSystemPrompt = systemPrompt
      ? `${systemPrompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, just pure JSON.`
      : 'Respond ONLY with valid JSON. No markdown, no code blocks, just pure JSON.';

    // JSON mode makes the model emit strict JSON; a single retry covers the
    // rare case where the response is still truncated or malformed.
    const jsonOptions = { ...options, jsonMode: true };
    let totalCost = 0;
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await this.generateText(prompt, jsonSystemPrompt, jsonOptions);
      totalCost += response.cost || 0;

      try {
        const data = JSON.parse(this.stripJson(response.content)) as T;
        return { data, cost: totalCost };
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `JSON parse failed (attempt ${attempt + 1}/2)${attempt === 0 ? ', retrying' : ''}`,
        );
      }
    }

    this.logger.error('Failed to parse JSON response after retry');
    throw new Error(`Failed to parse AI response as JSON: ${lastError}`);
  }

  private stripJson(raw: string): string {
    let content = raw.trim();
    if (content.startsWith('```json')) {
      content = content.slice(7);
    }
    if (content.startsWith('```')) {
      content = content.slice(3);
    }
    if (content.endsWith('```')) {
      content = content.slice(0, -3);
    }
    return content.trim();
  }
}
