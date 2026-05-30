import { Injectable, Logger } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import { PipelineOutput } from '../ai/pipeline/presentation.pipeline';
import { SlideWithAssets } from '../ai/agents/asset.agent';
import { ThemeConfig } from './themes/theme.interface';
import { THEME_CATALOG } from './themes/theme-catalog';
import { HeroLayout } from './layouts/hero.layout';
import { BulletsLayout } from './layouts/bullets.layout';
import { TimelineLayout } from './layouts/timeline.layout';
import { ComparisonLayout } from './layouts/comparison.layout';
import { StatisticsLayout } from './layouts/statistics.layout';
import { QuoteLayout } from './layouts/quote.layout';
import { ConclusionLayout } from './layouts/conclusion.layout';
import { RejaLayout } from './layouts/reja.layout';
import { LayoutRenderer, PresentationMeta } from './layouts/layout.interface';
import { I18nService, SupportedLanguage } from '../common/i18n/i18n.service';

@Injectable()
export class RendererService {
  private readonly logger = new Logger(RendererService.name);
  private readonly themes: Map<string, ThemeConfig>;
  private readonly layouts: Map<string, LayoutRenderer>;

  constructor(
    private readonly heroLayout: HeroLayout,
    private readonly bulletsLayout: BulletsLayout,
    private readonly timelineLayout: TimelineLayout,
    private readonly comparisonLayout: ComparisonLayout,
    private readonly statisticsLayout: StatisticsLayout,
    private readonly quoteLayout: QuoteLayout,
    private readonly conclusionLayout: ConclusionLayout,
    private readonly rejaLayout: RejaLayout,
  ) {
    this.themes = new Map(Object.entries(THEME_CATALOG));

    this.layouts = new Map<string, LayoutRenderer>([
      ['hero', this.heroLayout],
      ['reja', this.rejaLayout],
      ['bullets', this.bulletsLayout],
      ['timeline', this.timelineLayout],
      ['comparison', this.comparisonLayout],
      ['statistics', this.statisticsLayout],
      ['quote', this.quoteLayout],
      ['conclusion', this.conclusionLayout],
    ]);
  }

  async renderPresentation(
    pipelineOutput: PipelineOutput,
    language: SupportedLanguage = 'uz',
  ): Promise<Buffer> {
    this.logger.log(`Rendering presentation: ${pipelineOutput.title} (lang: ${language})`);

    let theme = this.themes.get(pipelineOutput.theme);
    if (!theme) {
      this.logger.warn(
        `Unknown theme "${pipelineOutput.theme}", falling back to academic_blue`,
      );
      theme = this.themes.get('academic_blue')!;
    }

    // Create i18n service for this language
    const i18n = I18nService.create(language);

    const pptx = new PptxGenJS();

    pptx.layout = 'LAYOUT_16x9';
    pptx.title = pipelineOutput.title;
    pptx.subject = pipelineOutput.subtitle;
    pptx.author = 'SliderAI UZ';
    pptx.company = 'SliderAI';

    // Create presentation metadata for layouts
    const presentationMeta: PresentationMeta = {
      studentName: pipelineOutput.studentName,
      teacherName: pipelineOutput.teacherName,
      language,
      i18n,
    };

    for (const slideData of pipelineOutput.slides) {
      this.renderSlide(pptx, slideData, theme, presentationMeta);
    }

    this.logger.log(`Rendered ${pipelineOutput.slides.length} slides`);

    const uint8Array = (await pptx.write({ outputType: 'uint8array' })) as Uint8Array;
    return Buffer.from(uint8Array);
  }

  private renderSlide(
    pptx: PptxGenJS,
    slideData: SlideWithAssets,
    theme: ThemeConfig,
    presentationMeta?: PresentationMeta,
  ): void {
    const layoutRenderer = this.layouts.get(slideData.type);

    if (layoutRenderer) {
      layoutRenderer.render(pptx, slideData, theme, presentationMeta);
    } else {
      this.logger.warn(
        `Unknown slide type: ${slideData.type}, using bullets layout`,
      );
      this.bulletsLayout.render(pptx, slideData, theme, presentationMeta);
    }
  }

  async renderToBuffer(
    pipelineOutput: PipelineOutput,
    language: SupportedLanguage = 'uz',
  ): Promise<Buffer> {
    return this.renderPresentation(pipelineOutput, language);
  }

  getAvailableThemes(): string[] {
    return Array.from(this.themes.keys());
  }

  getAvailableLayouts(): string[] {
    return Array.from(this.layouts.keys());
  }
}
