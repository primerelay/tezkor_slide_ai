import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  AiProvider,
  AiProviderOptions,
  AiProviderResponse,
} from './ai-provider.interface';

@Injectable()
export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic';
  private readonly logger = new Logger(AnthropicProvider.name);
  private client: Anthropic | null = null;
  private readonly defaultModel = 'claude-3-haiku-20240307';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.anthropicApiKey');
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
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
      throw new Error('Anthropic provider is not configured');
    }

    try {
      const message = await this.client.messages.create({
        model: options?.model || this.defaultModel,
        max_tokens: options?.maxTokens ?? 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });

      const content =
        message.content[0].type === 'text' ? message.content[0].text : '';

      return {
        content,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
          totalTokens: message.usage.input_tokens + message.usage.output_tokens,
        },
      };
    } catch (error) {
      this.logger.error('Anthropic API error:', error);
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
