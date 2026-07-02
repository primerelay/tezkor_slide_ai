export interface AiProviderResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost?: number;
}

export interface AiJsonResponse<T> {
  data: T;
  cost?: number;
}

export interface AiProviderOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  model?: string;
  /** Ask the model to return a strict JSON object (reduces malformed output). */
  jsonMode?: boolean;
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
  ): Promise<AiJsonResponse<T>>;

  isAvailable(): boolean;
}
