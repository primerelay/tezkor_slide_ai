import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterProvider } from '../providers/openrouter.provider';
import { GeminiProvider } from '../providers/gemini.provider';
import { AiProvider } from '../providers/ai-provider.interface';

export interface OutlineSlide {
  slideNumber: number;
  title: string;
  type: 'hero' | 'bullets' | 'timeline' | 'comparison' | 'statistics' | 'quote' | 'conclusion';
  keyPoints: string[];
}

export interface PresentationOutline {
  title: string;
  subtitle: string;
  targetAudience: string;
  slides: OutlineSlide[];
}

@Injectable()
export class OutlineAgent {
  private readonly logger = new Logger(OutlineAgent.name);
  private readonly provider: AiProvider;

  constructor(
    private readonly openRouterProvider: OpenRouterProvider,
    private readonly geminiProvider: GeminiProvider,
  ) {
    // Use OpenRouter if available, fallback to Gemini
    if (openRouterProvider.isAvailable()) {
      this.provider = openRouterProvider;
      this.logger.log('Using OpenRouter provider');
    } else {
      this.provider = geminiProvider;
      this.logger.log('Using Gemini provider');
    }
  }

  async generateOutline(
    topic: string,
    slideCount: number,
    language: 'uz' | 'ru' | 'en',
  ): Promise<PresentationOutline> {
    const languageNames: Record<string, string> = {
      uz: "O'zbek tili",
      ru: 'Русский язык',
      en: 'English',
    };

    const systemPrompt = `You are an expert academic presentation designer. Create presentation outlines for university students in Uzbekistan/CIS region.

RULES:
- Create exactly ${slideCount} slides
- Use ${languageNames[language]} for all content
- First slide must be "hero" (title slide)
- Last slide must be "conclusion"
- Vary slide types: bullets, timeline, comparison, statistics, quote
- Each slide should cover one clear concept
- Key points should be concise (max 10 words each)
- Focus on academic quality and educational value`;

    const prompt = `Create a presentation outline for the following topic:

TOPIC: ${topic}
NUMBER OF SLIDES: ${slideCount}
LANGUAGE: ${languageNames[language]}

Return JSON with this structure:
{
  "title": "Main presentation title",
  "subtitle": "Subtitle or tagline",
  "targetAudience": "Who is this for",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide title",
      "type": "hero|bullets|timeline|comparison|statistics|quote|conclusion",
      "keyPoints": ["point 1", "point 2", "point 3"]
    }
  ]
}`;

    this.logger.log(`Generating outline for: ${topic}`);

    const outline = await this.provider.generateJson<PresentationOutline>(
      prompt,
      systemPrompt,
      { temperature: 0.7, maxTokens: 2048 },
    );

    this.logger.log(`Generated outline with ${outline.slides.length} slides`);

    return outline;
  }
}
