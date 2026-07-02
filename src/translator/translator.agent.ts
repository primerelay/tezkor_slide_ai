import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterProvider } from '../ai/providers/openrouter.provider';

export const LANGUAGE_NAMES: Record<string, string> = {
  uz: "O'zbek tili",
  ru: 'Русский язык',
  en: 'English',
  de: 'Deutsch',
};

export interface TranslateResult {
  text: string;
  cost: number;
}

@Injectable()
export class TranslatorAgent {
  private readonly logger = new Logger(TranslatorAgent.name);

  constructor(private readonly ai: OpenRouterProvider) {}

  async translate(text: string, targetLang: string): Promise<TranslateResult> {
    const target = LANGUAGE_NAMES[targetLang] || LANGUAGE_NAMES.uz;

    const systemPrompt = `You are a professional academic translator. You translate text into ${target} with the precision expected in universities.

RULES:
1. Auto-detect the source language.
2. Translate into ${target}, preserving the EXACT meaning.
3. Keep academic/technical terminology correct and use the field's standard terms in ${target}.
4. Preserve the register (formal stays formal), structure, paragraph breaks and any lists.
5. Do NOT add notes, explanations, or the original text.
6. Output ONLY the translation.`;

    const prompt = `Translate the following text into ${target}:\n\n${text}`;

    this.logger.log(`Translating ${text.length} chars → ${targetLang}`);

    const res = await this.ai.generateText(prompt, systemPrompt, {
      temperature: 0.3,
      maxTokens: 6000,
    });

    const translated = (res.content || '').trim();
    if (!translated) {
      throw new Error('Empty translation');
    }

    return { text: translated, cost: res.cost || 0 };
  }
}
