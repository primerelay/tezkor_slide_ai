import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterProvider } from '../providers/openrouter.provider';
import { GeminiProvider } from '../providers/gemini.provider';
import { AiProvider } from '../providers/ai-provider.interface';
import { PresentationOutline } from './outline.agent';

export interface SlideContent {
  slideNumber: number;
  type: string;
  title: string;
  subtitle?: string;
  bullets?: string[];
  timeline?: Array<{
    year: string;
    event: string;
  }>;
  comparison?: {
    leftTitle: string;
    rightTitle: string;
    leftItems: string[];
    rightItems: string[];
  };
  statistics?: Array<{
    value: string;
    label: string;
  }>;
  quote?: {
    text: string;
    author: string;
  };
  speakerNotes?: string;
}

export interface FullPresentationContent {
  title: string;
  subtitle: string;
  slides: SlideContent[];
}

@Injectable()
export class ContentAgent {
  private readonly logger = new Logger(ContentAgent.name);
  private readonly provider: AiProvider;

  constructor(
    private readonly openRouterProvider: OpenRouterProvider,
    private readonly geminiProvider: GeminiProvider,
  ) {
    if (openRouterProvider.isAvailable()) {
      this.provider = openRouterProvider;
      this.logger.log('Using OpenRouter provider');
    } else {
      this.provider = geminiProvider;
      this.logger.log('Using Gemini provider');
    }
  }

  async generateContent(
    outline: PresentationOutline,
    language: 'uz' | 'ru' | 'en',
  ): Promise<FullPresentationContent> {
    const languageNames: Record<string, string> = {
      uz: "O'zbek tili",
      ru: 'Русский язык',
      en: 'English',
    };

    const systemPrompt = `You are an expert academic content writer. Generate detailed slide content based on the outline.

RULES:
- Use ${languageNames[language]} for all content
- Maximum 5 bullets per slide
- Maximum 14 words per bullet point
- Maximum 30 words total text per slide (excluding speaker notes)
- Keep content concise, academic, and informative
- Add brief speaker notes for each slide
- For timelines: 3-5 events with years
- For comparisons: balanced items on both sides
- For statistics: 3-4 key numbers with labels
- For quotes: find relevant, educational quotes`;

    const slidesJson = JSON.stringify(outline.slides, null, 2);

    const prompt = `Generate detailed content for this presentation:

TITLE: ${outline.title}
SUBTITLE: ${outline.subtitle}
LANGUAGE: ${languageNames[language]}

OUTLINE:
${slidesJson}

Return JSON with this structure:
{
  "title": "${outline.title}",
  "subtitle": "${outline.subtitle}",
  "slides": [
    {
      "slideNumber": 1,
      "type": "hero",
      "title": "Title text",
      "subtitle": "Subtitle text"
    },
    {
      "slideNumber": 2,
      "type": "bullets",
      "title": "Slide title",
      "bullets": ["Point 1", "Point 2", "Point 3"],
      "speakerNotes": "Notes for presenter"
    },
    {
      "slideNumber": 3,
      "type": "timeline",
      "title": "Timeline title",
      "timeline": [{"year": "2020", "event": "Event description"}],
      "speakerNotes": "Notes"
    },
    {
      "slideNumber": 4,
      "type": "comparison",
      "title": "Comparison title",
      "comparison": {
        "leftTitle": "Option A",
        "rightTitle": "Option B",
        "leftItems": ["Item 1", "Item 2"],
        "rightItems": ["Item 1", "Item 2"]
      },
      "speakerNotes": "Notes"
    },
    {
      "slideNumber": 5,
      "type": "statistics",
      "title": "Statistics title",
      "statistics": [{"value": "85%", "label": "Description"}],
      "speakerNotes": "Notes"
    },
    {
      "slideNumber": 6,
      "type": "quote",
      "title": "Quote slide title",
      "quote": {"text": "Quote text", "author": "Author name"},
      "speakerNotes": "Notes"
    },
    {
      "slideNumber": 7,
      "type": "conclusion",
      "title": "Conclusion title",
      "bullets": ["Summary point 1", "Summary point 2"],
      "speakerNotes": "Notes"
    }
  ]
}

Generate content for ALL ${outline.slides.length} slides based on their types.`;

    this.logger.log(`Generating content for: ${outline.title}`);

    const content =
      await this.provider.generateJson<FullPresentationContent>(
        prompt,
        systemPrompt,
        { temperature: 0.7, maxTokens: 4096 },
      );

    this.logger.log(`Generated content for ${content.slides.length} slides`);

    return content;
  }
}
