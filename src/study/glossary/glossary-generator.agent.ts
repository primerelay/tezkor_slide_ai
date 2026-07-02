import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterProvider } from '../../ai/providers/openrouter.provider';
import { GlossaryEntry } from '../../database/entities/glossary-set.entity';

const LANGUAGE_NAMES: Record<string, string> = {
  uz: "O'zbek tili",
  ru: 'Русский язык',
  en: 'English',
  de: 'Deutsch',
};

export interface GlossaryGenResult {
  title: string;
  entries: GlossaryEntry[];
  cost: number;
}

@Injectable()
export class GlossaryGeneratorAgent {
  private readonly logger = new Logger(GlossaryGeneratorAgent.name);

  constructor(private readonly ai: OpenRouterProvider) {}

  async generate(
    sourceContent: string,
    count: number,
    language: string,
  ): Promise<GlossaryGenResult> {
    const lang = LANGUAGE_NAMES[language] || LANGUAGE_NAMES.uz;

    const systemPrompt = `You are an academic lexicographer compiling a glossary (izohli lug'at) for students in Uzbekistan. Quality bar:

RULES:
1. ALL terms and definitions in ${lang}
2. TERM: a key concept/word from the material (1-4 words)
3. DEFINITION: a precise, self-contained academic definition (1-2 sentences)
4. Pick the MOST important, exam-relevant terms; no duplicates, no trivia
5. If given only a topic (not full text), use accurate well-known terms of that field
6. Factually correct — never invent fake meanings`;

    const prompt = `Compile EXACTLY ${count} glossary terms from the material below.

MATERIAL:
${sourceContent}

LANGUAGE: ${lang}

Return JSON:
{
  "title": "Short glossary title in ${lang} (based on the material)",
  "entries": [
    { "term": "term", "definition": "precise definition" }
    // ... exactly ${count} entries
  ]
}`;

    this.logger.log(`Generating ${count} glossary terms (${language})`);

    const result = await this.ai.generateJson<{ title: string; entries: GlossaryEntry[] }>(
      prompt,
      systemPrompt,
      { temperature: 0.5, maxTokens: 6000 },
    );

    const entries = (result.data.entries || [])
      .filter(
        (e) =>
          e &&
          typeof e.term === 'string' &&
          typeof e.definition === 'string' &&
          e.term.trim() &&
          e.definition.trim(),
      )
      .slice(0, count);

    if (entries.length === 0) {
      throw new Error('No valid glossary entries were generated');
    }

    // Alphabetical order (locale-aware) — a proper reference glossary.
    entries.sort((a, b) => a.term.localeCompare(b.term, 'uz'));

    return {
      title: result.data.title?.trim() || sourceContent.substring(0, 40),
      entries,
      cost: result.cost || 0,
    };
  }
}
