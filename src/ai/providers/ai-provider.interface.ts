export interface AiProviderResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost?: number;
}

export interface AiProviderOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  model?: string;
}

export interface AiProvider {
  readonly name: string;

  generateText(
    prompt: string,
    systemPrompt?: string,
    options?: AiProviderOptions,
  ): Promise<AiProviderResponse>;

  generateJson<T>(
    prompt: string,
    systemPrompt?: string,
    options?: AiProviderOptions,
  ): Promise<T>;

  isAvailable(): boolean;
}
