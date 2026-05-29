import { Injectable, Logger } from '@nestjs/common';
import { OutlineAgent, PresentationOutline } from '../agents/outline.agent';
import { ContentAgent, FullPresentationContent } from '../agents/content.agent';
import { LayoutAgent, SlideLayout } from '../agents/layout.agent';
import { AssetAgent, SlideWithAssets } from '../agents/asset.agent';
import { SupportedLanguage } from '../../common/i18n/i18n.service';
import { PresentationTheme } from '../../renderer/themes/theme-registry';

export interface PipelineInput {
  topic: string;
  studentName?: string;
  teacherName?: string;
  includeReja?: boolean;
  slideCount: number;
  theme: PresentationTheme;
  language: SupportedLanguage;
}

export interface PipelineOutput {
  title: string;
  subtitle: string;
  studentName?: string;
  teacherName?: string;
  theme: string;
  language: string;
  slides: SlideWithAssets[];
  metadata: {
    generatedAt: Date;
    pipelineVersion: string;
    totalCost?: number;
    stages: {
      outline: { durationMs: number; cost?: number };
      content: { durationMs: number; cost?: number };
      layout: { durationMs: number };
      assets: { durationMs: number };
    };
  };
}

export type PipelineStage =
  | 'idle'
  | 'outline'
  | 'content'
  | 'layout'
  | 'assets'
  | 'complete'
  | 'error';

export interface PipelineProgress {
  stage: PipelineStage;
  progress: number;
  message: string;
}

@Injectable()
export class PresentationPipeline {
  private readonly logger = new Logger(PresentationPipeline.name);
  private readonly version = '1.0.0';

  constructor(
    private readonly outlineAgent: OutlineAgent,
    private readonly contentAgent: ContentAgent,
    private readonly layoutAgent: LayoutAgent,
    private readonly assetAgent: AssetAgent,
  ) {}

  async generate(
    input: PipelineInput,
    onProgress?: (progress: PipelineProgress) => void,
  ): Promise<PipelineOutput> {
    this.logger.log(`Starting pipeline for: ${input.topic}`);

    const stages: PipelineOutput['metadata']['stages'] = {
      outline: { durationMs: 0, cost: 0 },
      content: { durationMs: 0, cost: 0 },
      layout: { durationMs: 0 },
      assets: { durationMs: 0 },
    };

    let totalCost = 0;

    try {
      onProgress?.({
        stage: 'outline',
        progress: 10,
        message: 'Generating presentation outline...',
      });

      const outlineStart = Date.now();
      const outlineResult = await this.outlineAgent.generateOutline(
        input.topic,
        input.slideCount,
        input.language,
        input.studentName,
        input.teacherName,
        input.includeReja,
      );
      const outline = outlineResult.outline;
      stages.outline.durationMs = Date.now() - outlineStart;
      stages.outline.cost = outlineResult.cost || 0;
      totalCost += outlineResult.cost || 0;

      this.logger.log(`Outline generated in ${stages.outline.durationMs}ms, cost: $${stages.outline.cost.toFixed(6)}`);

      onProgress?.({
        stage: 'content',
        progress: 40,
        message: 'Generating slide content...',
      });

      const contentStart = Date.now();
      const contentResult = await this.contentAgent.generateContent(
        outline,
        input.language,
      );
      const content = contentResult.content;
      stages.content.durationMs = Date.now() - contentStart;
      stages.content.cost = contentResult.cost || 0;
      totalCost += contentResult.cost || 0;

      this.logger.log(`Content generated in ${stages.content.durationMs}ms, cost: $${stages.content.cost.toFixed(6)}`);

      onProgress?.({
        stage: 'layout',
        progress: 70,
        message: 'Designing slide layouts...',
      });

      const layoutStart = Date.now();
      const layouts = this.layoutAgent.classifyLayouts(content.slides);
      stages.layout.durationMs = Date.now() - layoutStart;

      this.logger.log(`Layouts classified in ${stages.layout.durationMs}ms`);

      onProgress?.({
        stage: 'assets',
        progress: 85,
        message: 'Selecting visual assets and images...',
      });

      const assetsStart = Date.now();
      const slidesWithAssets = await this.assetAgent.selectAssets(
        content.slides,
        layouts,
        input.theme,
        input.topic,
      );
      stages.assets.durationMs = Date.now() - assetsStart;

      this.logger.log(`Assets and images selected in ${stages.assets.durationMs}ms`);

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Pipeline complete!',
      });

      const output: PipelineOutput = {
        title: content.title,
        subtitle: content.subtitle,
        studentName: input.studentName,
        teacherName: input.teacherName,
        theme: input.theme,
        language: input.language,
        slides: slidesWithAssets,
        metadata: {
          generatedAt: new Date(),
          pipelineVersion: this.version,
          totalCost,
          stages,
        },
      };

      const totalDuration =
        stages.outline.durationMs +
        stages.content.durationMs +
        stages.layout.durationMs +
        stages.assets.durationMs;

      this.logger.log(`Pipeline completed in ${totalDuration}ms, total AI cost: $${totalCost.toFixed(6)}`);

      return output;
    } catch (error) {
      this.logger.error('Pipeline error:', error);

      onProgress?.({
        stage: 'error',
        progress: 0,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });

      throw error;
    }
  }
}
