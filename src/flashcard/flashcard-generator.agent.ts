import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterProvider } from '../ai/providers/openrouter.provider';
import { Flashcard } from '../database/entities/flashcard-set.entity';

const LANGUAGE_NAMES: Record<string, string> = {
  uz: "O'zbek tili",
  ru: 'Русский язык',
  en: 'English',
  de: 'Deutsch',
};

export interface FlashcardGenResult {
  title: string;
  cards: Flashcard[];
  cost: number;
}

@Injectable()
export class FlashcardGeneratorAgent {
  private readonly logger = new Logger(FlashcardGeneratorAgent.name);

  constructor(private readonly ai: OpenRouterProvider) {}

  async generate(
    sourceContent: string,
    count: number,
    language: string,
  ): Promise<FlashcardGenResult> {
    const lang = LANGUAGE_NAMES[language] || LANGUAGE_NAMES.uz;

    const systemPrompt = `You are an expert learning designer creating study flashcards for students in Uzbekistan. Great flashcards drive real memorisation, so hold a high bar:

RULES:
1. ALL cards in ${lang}
2. FRONT: a concise prompt — a term, concept, question, date, or "what is X?" (max ~12 words)
3. BACK: a clear, self-contained answer/definition with the key fact (1-2 sentences, precise)
4. One idea per card — atomic, not compound
5. Cover the MOST important, testable points of the material; no trivia, no duplicates
6. If given only a topic (not full text), generate accurate, well-known facts about it
7. Factually correct — never invent fake data`;

    const prompt = `Create EXACTLY ${count} study flashcards from the material below.

MATERIAL:
${sourceContent}

LANGUAGE: ${lang}

Return JSON:
{
  "title": "Short deck title in ${lang} (based on the material)",
  "cards": [
    { "front": "concise prompt/term/question", "back": "clear precise answer" }
    // ... exactly ${count} cards
  ]
}`;

    this.logger.log(`Generating ${count} flashcards (${language})`);

    const result = await this.ai.generateJson<{ title: string; cards: Flashcard[] }>(
      prompt,
      systemPrompt,
      { temperature: 0.6, maxTokens: 6000 },
    );

    // Keep only well-formed cards and cap to the requested count.
    const cards = (result.data.cards || [])
      .filter((c) => c && typeof c.front === 'string' && typeof c.back === 'string' && c.front.trim() && c.back.trim())
      .slice(0, count);

    if (cards.length === 0) {
      throw new Error('No valid flashcards were generated');
    }

    return {
      title: result.data.title?.trim() || sourceContent.substring(0, 40),
      cards,
      cost: result.cost || 0,
    };
  }
}
