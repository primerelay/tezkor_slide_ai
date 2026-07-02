import { Injectable, Logger } from '@nestjs/common';
import { DocPlannerAgent, DocumentPlan } from '../agents/doc-planner.agent';
import { DocWriterAgent, WrittenSection } from '../agents/doc-writer.agent';
import { ImageService } from '../../ai/services/image.service';
import { SupportedLanguage } from '../../common/i18n/i18n.service';
import { DocumentType } from '../../database/entities/document.entity';

// Cap how many chapters get an illustration — keeps it professional, not busy.
const MAX_IMAGES = 4;

export interface DocPipelineInput {
  topic: string;
  docType: DocumentType;
  pageCount: number;
  language: SupportedLanguage;
  institution?: string;
  studentName?: string;
  teacherName?: string;
}

export interface DocPipelineOutput {
  title: string;
  docType: DocumentType;
  /**
   * Layout family:
   *  - academic: title page + TOC + numbered chapters + refs + images
   *  - essay: clean continuous prose
   *  - article: abstract + keywords + titled sections + refs (no title page/TOC)
   */
  format: 'academic' | 'essay' | 'article';
  language: SupportedLanguage;
  institution?: string;
  studentName?: string;
  teacherName?: string;
  sections: WrittenSection[];
  references: string[];
  metadata: {
    generatedAt: Date;
    totalCost: number;
    plan: DocumentPlan;
  };
}

export interface DocPipelineProgress {
  progress: number;
  message: string;
}

@Injectable()
export class DocumentPipeline {
  private readonly logger = new Logger(DocumentPipeline.name);

  constructor(
    private readonly planner: DocPlannerAgent,
    private readonly writer: DocWriterAgent,
    private readonly imageService: ImageService,
  ) {}

  async generate(
    input: DocPipelineInput,
    onProgress?: (progress: DocPipelineProgress) => void,
  ): Promise<DocPipelineOutput> {
    this.logger.log(`Starting document pipeline for: ${input.topic}`);
    const isEssay = input.docType === 'insho';
    const isArticle = input.docType === 'maqola' || input.docType === 'tezis';
    const format: DocPipelineOutput['format'] = isEssay
      ? 'essay'
      : isArticle
        ? 'article'
        : 'academic';
    let totalCost = 0;

    onProgress?.({ progress: 10, message: 'Planning document structure...' });

    const planResult = await this.planner.generatePlan(
      input.topic,
      input.docType,
      input.pageCount,
      input.language,
    );
    const plan = planResult.plan;
    totalCost += planResult.cost;

    onProgress?.({ progress: 20, message: 'Writing sections...' });

    // Sections are written sequentially: each call's input stays tiny (plan
    // titles only), so cost stays low and OpenRouter isn't hit in bursts.
    const sections: WrittenSection[] = [];
    const total = plan.sections.length;

    for (let i = 0; i < total; i++) {
      const writeResult = await this.writer.writeSection(
        input.topic,
        plan,
        plan.sections[i],
        i,
        input.language,
        isEssay,
      );
      sections.push(writeResult.section);
      totalCost += writeResult.cost;

      const progress = 20 + Math.round(((i + 1) / total) * 60);
      onProgress?.({
        progress,
        message: `Section ${i + 1}/${total} written`,
      });
    }

    // Only full academic docs get illustrations; essays and articles stay clean.
    if (format === 'academic') {
      onProgress?.({ progress: 85, message: 'Fetching illustrations...' });
      await this.attachImages(input.topic, sections);
    }

    this.logger.log(
      `Document pipeline complete, total AI cost: $${totalCost.toFixed(6)}`,
    );

    return {
      title: plan.title,
      docType: input.docType,
      format,
      language: input.language,
      institution: input.institution,
      studentName: input.studentName,
      teacherName: input.teacherName,
      sections,
      references: plan.references || [],
      metadata: {
        generatedAt: new Date(),
        totalCost,
        plan,
      },
    };
  }

  private async attachImages(
    topic: string,
    sections: WrittenSection[],
  ): Promise<void> {
    const chapters = sections.filter((s) => s.type === 'bob').slice(0, MAX_IMAGES);
    if (chapters.length === 0) return;

    const used = new Set<string>();
    for (const chapter of chapters) {
      try {
        const image = await this.imageService.getImageForTopic(
          topic,
          chapter.title,
          used,
        );
        if (image?.localPath) {
          chapter.image = {
            path: image.localPath,
            // Caption in the document's own language (chapter title), not the
            // English stock-photo alt text.
            description: chapter.title,
            width: image.width,
            height: image.height,
          };
        }
      } catch (error) {
        this.logger.warn(`Image fetch failed for "${chapter.title}": ${error}`);
      }
    }
  }
}
