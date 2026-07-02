import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterProvider } from '../../ai/providers/openrouter.provider';

const LANGUAGE_NAMES: Record<string, string> = {
  uz: "O'zbek tili",
  ru: 'Русский язык',
  en: 'English',
  de: 'Deutsch',
};

export interface CrosswordWord {
  word: string;
  clue: string;
}

export interface CrosswordGenResult {
  title: string;
  words: CrosswordWord[];
  cost: number;
}

@Injectable()
export class CrosswordGeneratorAgent {
  private readonly logger = new Logger(CrosswordGeneratorAgent.name);

  constructor(private readonly ai: OpenRouterProvider) {}

  async generate(
    sourceContent: string,
    count: number,
    language: string,
  ): Promise<CrosswordGenResult> {
    const lang = LANGUAGE_NAMES[language] || LANGUAGE_NAMES.uz;
    // Ask for extra words so we can drop ones that don't interlock in the grid.
    const ask = Math.min(count + 6, 30);

    const systemPrompt = `You design educational crossword puzzles for students in Uzbekistan. Quality bar:

RULES:
1. ALL words and clues in ${lang}
2. Each ANSWER is a SINGLE word, 3-11 letters, NO spaces, NO hyphens, NO digits
3. Use only standard letters (crossword answers must interlock by letter)
4. CLUE: a short, clear definition/hint that does NOT contain the answer word
5. Pick important, well-known terms of the topic; no duplicates
6. Prefer words that share common letters so they can cross each other`;

    const prompt = `Create ${ask} crossword words with clues from the material below.

MATERIAL:
${sourceContent}

LANGUAGE: ${lang}

Return JSON:
{
  "title": "Short crossword title in ${lang}",
  "words": [
    { "word": "SINGLEWORD", "clue": "short hint without the answer" }
    // ... ${ask} items
  ]
}`;

    this.logger.log(`Generating crossword words (${language})`);

    const result = await this.ai.generateJson<{ title: string; words: CrosswordWord[] }>(
      prompt,
      systemPrompt,
      { temperature: 0.6, maxTokens: 4000 },
    );

    const seen = new Set<string>();
    const words = (result.data.words || [])
      .map((w) => ({
        // Normalise: letters only, uppercase.
        word: (w?.word || '').toUpperCase().replace(/[^A-ZÀ-ÿА-ЯЁЎҚҒҲ'`]/gi, '').replace(/['`]/g, ''),
        clue: (w?.clue || '').trim(),
      }))
      .filter((w) => {
        if (w.word.length < 3 || w.word.length > 11 || !w.clue) return false;
        if (seen.has(w.word)) return false;
        seen.add(w.word);
        return true;
      });

    if (words.length < 3) {
      throw new Error('Not enough valid crossword words were generated');
    }

    return {
      title: result.data.title?.trim() || sourceContent.substring(0, 40),
      words,
      cost: result.cost || 0,
    };
  }
}
