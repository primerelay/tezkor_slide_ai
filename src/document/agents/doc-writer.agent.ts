import { Injectable, Logger } from '@nestjs/common';
import { DocAiClient } from './doc-ai.client';
import { SupportedLanguage } from '../../common/i18n/i18n.service';
import { DocumentPlan, DocSectionPlan } from './doc-planner.agent';

export interface WrittenBlock {
  /** Subsection heading (e.g. "Fotosintez jarayonining bosqichlari"); null for kirish/xulosa. */
  heading: string | null;
  paragraphs: string[];
}

export interface SectionImage {
  /** Local file path of the downloaded image. */
  path: string;
  description: string;
  width: number;
  height: number;
}

export interface WrittenSection {
  title: string;
  type: DocSectionPlan['type'];
  blocks: WrittenBlock[];
  /** Optional illustration placed under the chapter heading. */
  image?: SectionImage;
}

export interface SectionWriteResult {
  section: WrittenSection;
  cost: number;
}

const LANGUAGE_NAMES: Record<string, string> = {
  uz: "O'zbek tili",
  ru: 'Русский язык',
  en: 'English',
  de: 'Deutsch',
};

@Injectable()
export class DocWriterAgent {
  private readonly logger = new Logger(DocWriterAgent.name);

  constructor(private readonly ai: DocAiClient) {}

  /**
   * Writes one section of the document. Sections are generated one call at a
   * time (cheap model, small context) — previous section TITLES are passed for
   * coherence instead of full text to keep input tokens minimal.
   */
  async writeSection(
    topic: string,
    plan: DocumentPlan,
    section: DocSectionPlan,
    sectionIndex: number,
    language: SupportedLanguage,
  ): Promise<SectionWriteResult> {
    const outline = plan.sections
      .map((s, i) => `${i + 1}. ${s.title}${s.subsections.length ? ` (${s.subsections.join('; ')})` : ''}`)
      .join('\n');

    const systemPrompt = `You are a distinguished academic author writing university papers in ${LANGUAGE_NAMES[language]} for students in Uzbekistan. Your writing is what makes this service 2x better than competitors, so hold a high bar:

QUALITY BAR (non-negotiable):
1. Rich, substantive academic prose — every paragraph teaches something concrete
2. Include precise facts: dates, names, statistics, definitions, real examples
3. Formal academic register, flowing connected paragraphs (NOT bullet lists)
4. Each paragraph is 4-7 full sentences; no filler or repeated ideas
5. Define key terms on first use; build arguments logically
6. NEVER fabricate quotes or statistics you are unsure of — prefer well-established facts
7. Write ONLY in ${LANGUAGE_NAMES[language]}`;

    const isChapter = section.type === 'bob';

    const structureSpec = isChapter
      ? `Write this chapter with EXACTLY these subsections as blocks:
${section.subsections.map((s) => `- ${s}`).join('\n')}

Each block: {"heading": "<subsection title>", "paragraphs": ["...", "..."]} with 2-4 paragraphs per subsection.`
      : `Write it as a single block: {"heading": null, "paragraphs": ["...", "...", "..."]} with 3-5 paragraphs.${
          section.type === 'kirish'
            ? ' The introduction must state the relevance (dolzarbligi) of the topic, the aim (maqsad) and tasks (vazifalar) of the work.'
            : ' The conclusion must synthesize the main findings of ALL chapters and end with practical significance.'
        }`;

    const prompt = `PAPER TOPIC: ${topic}
PAPER TITLE: ${plan.title}

FULL OUTLINE (for context — write ONLY the requested section, do not repeat other sections' content):
${outline}

SECTION TO WRITE NOW (#${sectionIndex + 1}): "${section.title}"
TARGET LENGTH: ~${section.targetWords} words total

${structureSpec}

Return JSON:
{ "blocks": [ { "heading": <string or null>, "paragraphs": ["paragraph text", ...] } ] }`;

    this.logger.log(`Writing section ${sectionIndex + 1}: ${section.title}`);

    const result = await this.ai.generateJson<{ blocks: WrittenBlock[] }>(
      prompt,
      systemPrompt,
      { temperature: 0.7, maxTokens: 8192 },
    );

    return {
      section: {
        title: section.title,
        type: section.type,
        blocks: result.data.blocks || [],
      },
      cost: result.cost,
    };
  }
}
