import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterProvider } from '../../ai/providers/openrouter.provider';
import { AiProviderOptions } from '../../ai/providers/ai-provider.interface';

/**
 * AI client for document generation — routes everything through OpenRouter
 * (default model openai/gpt-4o-mini, $0.15/$0.60 per 1M tokens).
 */
@Injectable()
export class DocAiClient {
  private readonly logger = new Logger(DocAiClient.name);

  constructor(private readonly openRouterProvider: OpenRouterProvider) {}

  async generateJson<T>(
    prompt: string,
    systemPrompt: string,
    options?: AiProviderOptions,
  ): Promise<{ data: T; cost: number }> {
    if (!this.openRouterProvider.isAvailable()) {
      throw new Error('OpenRouter provider is not configured');
    }

    const result = await this.openRouterProvider.generateJson<T>(
      prompt,
      systemPrompt,
      options,
    );
    return { data: result.data, cost: result.cost || 0 };
  }
}
