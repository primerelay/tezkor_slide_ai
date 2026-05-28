import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AiProvider,
  AiProviderOptions,
  AiProviderResponse,
} from './ai-provider.interface';

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
          'HTTP-Referer': 'https://tezkor-slide.ai',
          'X-Title': 'Tezkor Slide AI',
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
      });

      const content = completion.choices[0]?.message?.content || '';
      const usage = completion.usage;

      return {
        content,
        usage: usage
          ? {
              inputTokens: usage.prompt_tokens,
              outputTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens,
            }
          : undefined,
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
  ): Promise<T> {
    const jsonSystemPrompt = systemPrompt
      ? `${systemPrompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, just pure JSON.`
      : 'Respond ONLY with valid JSON. No markdown, no code blocks, just pure JSON.';

    const response = await this.generateText(prompt, jsonSystemPrompt, options);

    let content = response.content.trim();

    if (content.startsWith('```json')) {
      content = content.slice(7);
    }
    if (content.startsWith('```')) {
      content = content.slice(3);
    }
    if (content.endsWith('```')) {
      content = content.slice(0, -3);
    }
    content = content.trim();

    try {
      return JSON.parse(content) as T;
    } catch (error) {
      this.logger.error('Failed to parse JSON response:', content);
      throw new Error(`Failed to parse AI response as JSON: ${error}`);
    }
  }
}
