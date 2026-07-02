import { Injectable, Logger } from '@nestjs/common';
import { DocAiClient } from './doc-ai.client';
import { SupportedLanguage } from '../../common/i18n/i18n.service';
import { DocumentType } from '../../database/entities/document.entity';

export interface DocSectionPlan {
  /** 'kirish' — introduction, 'bob' — numbered chapter, 'xulosa' — conclusion */
  type: 'kirish' | 'bob' | 'xulosa';
  title: string;
  subsections: string[];
  /** Target word count for the section body. */
  targetWords: number;
}

export interface DocumentPlan {
  title: string;
  sections: DocSectionPlan[];
  references: string[];
}

export interface DocPlanResult {
  plan: DocumentPlan;
  cost: number;
}

const LANGUAGE_NAMES: Record<string, string> = {
  uz: "O'zbek tili",
  ru: 'Русский язык',
  en: 'English',
  de: 'Deutsch',
};

// Roughly 290 words fit on an A4 page with Times New Roman 14pt and 1.5 spacing.
export const WORDS_PER_PAGE = 290;

// Pages consumed by title page, table of contents and the references list.
const OVERHEAD_PAGES = 3;

@Injectable()
export class DocPlannerAgent {
  private readonly logger = new Logger(DocPlannerAgent.name);

  constructor(private readonly ai: DocAiClient) {}

  async generatePlan(
    topic: string,
    docType: DocumentType,
    pageCount: number,
    language: SupportedLanguage,
  ): Promise<DocPlanResult> {
    if (docType === 'insho') {
      return this.generateEssayPlan(topic, pageCount, language);
    }

    const contentPages = Math.max(pageCount - OVERHEAD_PAGES, 4);
    // Intro and conclusion take ~1 page each; the rest is split into chapters.
    const chapterPages = contentPages - 2;
    const chapterCount = Math.min(Math.max(Math.round(chapterPages / 2), 2), 6);
    const wordsPerChapter = Math.round((chapterPages * WORDS_PER_PAGE) / chapterCount);

    const docTypeName = docType === 'referat' ? 'referat (academic report)' : 'mustaqil ish (independent academic work)';

    const systemPrompt = `You are a senior university professor in Uzbekistan who structures flawless academic papers for students. You design paper outlines that real teachers rate highly: logical flow, complete topic coverage, academically precise section titles.

RULES:
1. ALL titles and content in ${LANGUAGE_NAMES[language]}
2. Section titles must be specific to the topic — never generic filler like "Asosiy qism"
3. Chapter titles are numbered later by the renderer — do NOT include numbers like "1." in titles
4. References must be REAL, well-known published books, textbooks and reputable sources relevant to the topic (author, title, publisher, year). Never invent fake authors. Prefer widely known classic textbooks and official/international sources. Include 2-3 internet sources (real major sites) at the end.`;

    const prompt = `Design the structure of a ${docTypeName} for a university student.

TOPIC: ${topic}
TOTAL PAGES: ${pageCount}
CHAPTERS (bob): exactly ${chapterCount}
LANGUAGE: ${LANGUAGE_NAMES[language]}

Return JSON:
{
  "title": "Polished academic title for the paper (based on the topic, properly capitalized)",
  "sections": [
    { "type": "kirish", "title": "<'Kirish' in ${LANGUAGE_NAMES[language]}>", "subsections": [], "targetWords": ${WORDS_PER_PAGE} },
    { "type": "bob", "title": "Specific chapter title", "subsections": ["2-3 specific subsection titles"], "targetWords": ${wordsPerChapter} },
    // ... exactly ${chapterCount} chapters, each with 2-3 subsections
    { "type": "xulosa", "title": "<'Xulosa' in ${LANGUAGE_NAMES[language]}>", "subsections": [], "targetWords": ${WORDS_PER_PAGE} }
  ],
  "references": ["10-12 bibliography entries: Author. Title. — City: Publisher, Year.", "... last 2-3 entries are real internet sources"]
}`;

    this.logger.log(`Planning ${docType} (${pageCount} pages) for: ${topic}`);

    const result = await this.ai.generateJson<DocumentPlan>(prompt, systemPrompt, {
      temperature: 0.7,
      maxTokens: 4096,
    });

    this.logger.log(
      `Plan ready: ${result.data.sections.length} sections, cost: $${result.cost.toFixed(6)}`,
    );

    return { plan: result.data, cost: result.cost };
  }

  /**
   * Essay (insho) plan — flowing prose, no chapters/subsections/references.
   * Sections are written as continuous paragraphs by the renderer.
   */
  private async generateEssayPlan(
    topic: string,
    pageCount: number,
    language: SupportedLanguage,
  ): Promise<DocPlanResult> {
    const totalWords = pageCount * WORDS_PER_PAGE;
    const bodyCount = pageCount <= 2 ? 2 : 3;
    const wordsPerBody = Math.round((totalWords * 0.7) / bodyCount);
    const introOutroWords = Math.round(totalWords * 0.15);

    const systemPrompt = `You are a masterful essayist writing school/university essays (insho) in ${LANGUAGE_NAMES[language]} for students in Uzbekistan. An essay is flowing, persuasive, personal-yet-academic prose — NOT a report with chapters or citations.

RULES:
1. ALL content in ${LANGUAGE_NAMES[language]}
2. A compelling, thoughtful essay title based on the topic
3. Plan an introduction that hooks the reader and states the main idea, ${bodyCount} body movements that each develop one distinct angle with vivid examples, and a conclusion that leaves a lasting impression
4. Body "title" fields are internal planning notes only (they will NOT be printed) — make them describe each movement's angle
5. NO references, NO chapters, NO subsections.`;

    const prompt = `Plan an essay (insho) for a student.

TOPIC: ${topic}
LENGTH: ~${pageCount} pages (~${totalWords} words)
LANGUAGE: ${LANGUAGE_NAMES[language]}

Return JSON:
{
  "title": "An evocative essay title (not just the raw topic)",
  "sections": [
    { "type": "kirish", "title": "intro", "subsections": [], "targetWords": ${introOutroWords} },
    { "type": "bob", "title": "internal note: first angle", "subsections": [], "targetWords": ${wordsPerBody} },
    // ... ${bodyCount} body movements total
    { "type": "xulosa", "title": "conclusion", "subsections": [], "targetWords": ${introOutroWords} }
  ],
  "references": []
}`;

    this.logger.log(`Planning essay (${pageCount} pages) for: ${topic}`);

    const result = await this.ai.generateJson<DocumentPlan>(prompt, systemPrompt, {
      temperature: 0.8,
      maxTokens: 2048,
    });

    return { plan: { ...result.data, references: [] }, cost: result.cost };
  }
}
