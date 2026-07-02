import { Injectable, Logger } from '@nestjs/common';
import { DocAiClient } from './doc-ai.client';
import { SupportedLanguage } from '../../common/i18n/i18n.service';
import { DocumentPlan, DocSectionPlan, WORDS_PER_PAGE } from './doc-planner.agent';

// Empirically the model writes ~72 words per paragraph regardless of the
// requested length, so we provision paragraph COUNT against a slightly lower
// figure — this makes the document meet (or slightly exceed) the requested
// page count instead of falling ~20% short.
const WORDS_PER_PARAGRAPH = 65;

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
    isEssay = false,
  ): Promise<SectionWriteResult> {
    const outline = plan.sections
      .map((s, i) => `${i + 1}. ${s.title}${s.subsections.length ? ` (${s.subsections.join('; ')})` : ''}`)
      .join('\n');

    const systemPrompt = isEssay
      ? `You are a masterful essayist writing a school/university essay (insho) in ${LANGUAGE_NAMES[language]} for students in Uzbekistan. This is flowing, persuasive, reflective prose — NOT a report.

QUALITY BAR (non-negotiable):
1. Vivid, engaging, emotionally resonant prose with a clear personal voice
2. Use concrete examples, imagery, and thoughtful reasoning
3. Flowing connected paragraphs (NOT bullet lists, NO subheadings)
4. Smooth transitions so the whole essay reads as one continuous piece
5. Each paragraph 4-6 full sentences; no filler or repetition
6. Write ONLY in ${LANGUAGE_NAMES[language]}`
      : `You are a distinguished academic author writing university papers in ${LANGUAGE_NAMES[language]} for students in Uzbekistan. Your writing is what makes this service 2x better than competitors, so hold a high bar:

QUALITY BAR (non-negotiable):
1. Rich, substantive academic prose — every paragraph teaches something concrete
2. Include precise facts: dates, names, statistics, definitions, real examples
3. Formal academic register, flowing connected paragraphs (NOT bullet lists)
4. Each paragraph is 4-7 full sentences; no filler or repeated ideas
5. Define key terms on first use; build arguments logically
6. NEVER fabricate quotes or statistics you are unsure of — prefer well-established facts
7. Write ONLY in ${LANGUAGE_NAMES[language]}`;

    // Essays are always continuous prose blocks with no headings.
    const isChapter = section.type === 'bob' && !isEssay && section.subsections.length > 0;

    // Paragraph counts are derived from the section's word target so the final
    // document actually reaches the number of pages the user paid for. Models
    // obey explicit paragraph counts far more reliably than raw word targets.
    const target = section.targetWords || WORDS_PER_PAGE;
    const totalParas = Math.max(Math.ceil(target / WORDS_PER_PARAGRAPH), 2);
    const paraSpec =
      'Every paragraph MUST be a substantial 6-9 full sentences (~90-120 words) of detailed content — this length is REQUIRED to reach the target.';

    let structureSpec: string;
    if (isChapter) {
      const subs = section.subsections;
      const perSub = Math.max(Math.ceil(totalParas / subs.length), 2);
      structureSpec = `Write this chapter as ${subs.length} blocks, one per subsection (in this order):
${subs.map((s) => `- ${s}`).join('\n')}

Each block: {"heading": "<subsection title>", "paragraphs": [...]} with EXACTLY ${perSub} paragraphs. ${paraSpec}`;
    } else if (isEssay) {
      const paras = Math.max(totalParas, 2);
      const role =
        section.type === 'kirish'
          ? ' This is the OPENING — hook the reader and introduce the central idea.'
          : section.type === 'xulosa'
            ? ' This is the CLOSING — leave a memorable final impression, do not merely summarize.'
            : ' This is a body movement — develop one distinct angle with examples.';
      structureSpec = `Write it as a single block: {"heading": null, "paragraphs": [...]} with EXACTLY ${paras} flowing paragraphs (each 5-8 sentences).${role}`;
    } else {
      const paras = Math.max(totalParas, 3);
      structureSpec = `Write it as a single block: {"heading": null, "paragraphs": [...]} with EXACTLY ${paras} paragraphs. ${paraSpec}${
        section.type === 'kirish'
          ? ' The introduction must state the relevance (dolzarbligi) of the topic, the aim (maqsad) and tasks (vazifalar) of the work.'
          : section.type === 'xulosa'
            ? ' The conclusion must synthesize the main findings of ALL chapters and end with practical significance.'
            : ''
      }`;
    }

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
