import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import {
  AiProvider,
  AiProviderOptions,
  AiProviderResponse,
} from './ai-provider.interface';

// Gemini model pricing (USD per 1M tokens)
const GEMINI_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.0-flash': { input: 0.10, output: 0.40 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
};

@Injectable()
export class GeminiProvider implements AiProvider {
  readonly name = 'gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private client: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.geminiApiKey');
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
      this.model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }
  }

  isAvailable(): boolean {
    return this.client !== null && this.model !== null;
  }

  async generateText(
    prompt: string,
    systemPrompt?: string,
    options?: AiProviderOptions,
  ): Promise<AiProviderResponse> {
    if (!this.model) {
      throw new Error('Gemini provider is not configured');
    }

    const modelToUse = options?.model
      ? this.client!.getGenerativeModel({ model: options.model })
      : this.model;

    const generationConfig = {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 4096,
      topP: options?.topP ?? 0.9,
    };

    const fullPrompt = systemPrompt
      ? `${systemPrompt}\n\n${prompt}`
      : prompt;

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await modelToUse.generateContent({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig,
        });

        const response = result.response;
        const text = response.text();

        const usage = response.usageMetadata;
        const modelName = options?.model || 'gemini-2.0-flash';

        // Calculate cost based on token usage
        let cost: number | undefined;
        if (usage) {
          const pricing = GEMINI_PRICING[modelName] || GEMINI_PRICING['gemini-2.0-flash'];
          const inputCost = ((usage.promptTokenCount || 0) / 1_000_000) * pricing.input;
          const outputCost = ((usage.candidatesTokenCount || 0) / 1_000_000) * pricing.output;
          cost = inputCost + outputCost;

          this.logger.debug(
            `API cost for ${modelName}: $${cost.toFixed(6)} (${usage.promptTokenCount} in, ${usage.candidatesTokenCount} out)`
          );
        }

        return {
          content: text,
          usage: usage
            ? {
                inputTokens: usage.promptTokenCount || 0,
                outputTokens: usage.candidatesTokenCount || 0,
                totalTokens: usage.totalTokenCount || 0,
              }
            : undefined,
          cost,
        };
      } catch (error) {
        lastError = error as Error;
        const errorMessage = String(error);

        // Check if it's a rate limit error (429)
        if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
          const waitTime = Math.pow(2, attempt) * 5000; // 5s, 10s, 20s
          this.logger.warn(`Rate limited, retrying in ${waitTime / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // For other errors, throw immediately
        this.logger.error('Gemini API error:', error);
        throw error;
      }
    }

    this.logger.error('Max retries exceeded for Gemini API');
    throw lastError || new Error('Gemini API request failed after retries');
  }

  async generateJson<T>(
    prompt: string,
    systemPrompt?: string,
    options?: AiProviderOptions,
  ): Promise<{ data: T; cost?: number }> {
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
      const data = JSON.parse(content) as T;
      return { data, cost: response.cost };
    } catch (error) {
      this.logger.error('Failed to parse JSON response:', content);
      throw new Error(`Failed to parse AI response as JSON: ${error}`);
    }
  }
}
