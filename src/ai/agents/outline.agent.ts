import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterProvider } from '../providers/openrouter.provider';
import { GeminiProvider } from '../providers/gemini.provider';
import { AiProvider } from '../providers/ai-provider.interface';
import { SupportedLanguage } from '../../common/i18n/i18n.service';

export interface OutlineSlide {
  slideNumber: number;
  title: string;
  type: 'hero' | 'reja' | 'bullets' | 'timeline' | 'comparison' | 'statistics' | 'quote' | 'conclusion';
  keyPoints: string[];
}

export interface PresentationOutline {
  title: string;
  subtitle: string;
  studentName?: string;
  teacherName?: string;
  targetAudience: string;
  slides: OutlineSlide[];
}

export interface OutlineResult {
  outline: PresentationOutline;
  cost?: number;
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
    language: SupportedLanguage,
    studentName?: string,
    teacherName?: string,
    includeReja?: boolean,
  ): Promise<OutlineResult> {
    const languageNames: Record<string, string> = {
      uz: "O'zbek tili",
      de: "Deutsch",
      ru: 'Русский язык',
      en: 'English',
    };

    // Calculate actual content slides (excluding title and reja)
    let contentSlides = slideCount;
    if (includeReja) {
      contentSlides = slideCount; // User requested slides + title + reja = total
    }

    const systemPrompt = `You are an expert academic presentation designer creating PROFESSIONAL university-level presentations for students in Uzbekistan/CIS region.

CRITICAL REQUIREMENTS:
1. Use ${languageNames[language]} for ALL content
2. Create DETAILED, COMPREHENSIVE content - NOT simple or basic
3. Each bullet point should be 15-25 words with full explanation
4. Include specific facts, dates, statistics, and examples
5. Use academic vocabulary and professional terminology
6. Every slide should have 4-6 detailed bullet points
7. Include real-world examples and applications

SLIDE STRUCTURE:
- Slide 1: "hero" (Title slide with topic, student name, teacher name)
${includeReja ? '- Slide 2: "reja" (Table of contents/outline)' : ''}
- Middle slides: Mix of bullets, timeline, comparison, statistics, quote
- Last slide: "conclusion" (Summary with key takeaways)

QUALITY STANDARDS:
- Professional academic language
- Detailed explanations, not just keywords
- Factual accuracy with specific examples
- Each point should be informative and educational`;

    const prompt = `Create a PROFESSIONAL academic presentation outline:

TOPIC: ${topic}
STUDENT NAME: ${studentName || 'Talaba'}
TEACHER NAME: ${teacherName || 'Ustoz'}
TOTAL SLIDES: ${contentSlides}${includeReja ? ' + title + reja = ' + (contentSlides + 2) : ' + title = ' + (contentSlides + 1)}
INCLUDE REJA (OUTLINE) PAGE: ${includeReja ? 'YES' : 'NO'}
LANGUAGE: ${languageNames[language]}

IMPORTANT: Generate DETAILED, PROFESSIONAL content. Each keyPoint should be a complete sentence with 15-25 words explaining the concept thoroughly.

Return JSON:
{
  "title": "Professional presentation title",
  "subtitle": "Descriptive subtitle",
  "studentName": "${studentName || 'Talaba'}",
  "teacherName": "${teacherName || 'Ustoz'}",
  "targetAudience": "University students",
  "slides": [
    {
      "slideNumber": 1,
      "title": "${topic}",
      "type": "hero",
      "keyPoints": ["Professional title slide"]
    },
    ${includeReja ? `{
      "slideNumber": 2,
      "title": "Reja / Mundarija",
      "type": "reja",
      "keyPoints": ["List of all main sections covered in this presentation"]
    },` : ''}
    // ... content slides with detailed keyPoints (15-25 words each)
    {
      "slideNumber": ${contentSlides + (includeReja ? 2 : 1)},
      "title": "Xulosa",
      "type": "conclusion",
      "keyPoints": ["Comprehensive summary points"]
    }
  ]
}`;

    this.logger.log(`Generating professional outline for: ${topic}`);

    const result = await this.provider.generateJson<PresentationOutline>(
      prompt,
      systemPrompt,
      { temperature: 0.7, maxTokens: 4096 },
    );

    const outline = result.data;

    // Ensure student and teacher names are included
    outline.studentName = studentName;
    outline.teacherName = teacherName;

    this.logger.log(`Generated outline with ${outline.slides.length} slides, cost: $${result.cost?.toFixed(6) || '0'}`);

    return { outline, cost: result.cost };
  }
}
