import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import * as fs from 'fs';
import * as path from 'path';
import { Presentation } from '../../database/entities/presentation.entity';
import { GenerationJob } from '../../database/entities/generation-job.entity';
import { User } from '../../database/entities/user.entity';
import { PresentationPipeline } from '../../ai/pipeline/presentation.pipeline';
import { RendererService } from '../../renderer/renderer.service';
import { StorageService } from '../../storage/storage.service';
import { PRESENTATION_QUEUE } from '../constants';
import { PresentationJobData } from '../types/job.types';
import { I18nService } from '../../common/i18n/i18n.service';

@Processor(PRESENTATION_QUEUE)
export class PresentationProcessor extends WorkerHost {
  private readonly logger = new Logger(PresentationProcessor.name);

  constructor(
    @InjectBot()
    private readonly bot: Telegraf,
    @InjectRepository(Presentation)
    private readonly presentationRepository: Repository<Presentation>,
    @InjectRepository(GenerationJob)
    private readonly generationJobRepository: Repository<GenerationJob>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly pipeline: PresentationPipeline,
    private readonly renderer: RendererService,
    private readonly storage: StorageService,
  ) {
    super();
  }

  async process(job: Job<PresentationJobData>): Promise<{ pptxUrl: string }> {
    const { presentationId, topic, studentName, teacherName, includeReja, slideCount, theme, language } = job.data;

    this.logger.log(`Processing presentation: ${presentationId}`);

    const startTime = Date.now();

    try {
      await this.updatePresentationStatus(presentationId, 'processing');
      await this.updateJobStage(presentationId, 'parsing', 5);

      const pipelineOutput = await this.pipeline.generate(
        { topic, studentName, teacherName, includeReja, slideCount, theme, language },
        (progress) => {
          this.updateJobProgress(presentationId, progress.stage, progress.progress);
        },
      );

      await this.updateJobStage(presentationId, 'rendering', 90);

      const pptxBuffer = await this.renderer.renderPresentation(pipelineOutput);

      await this.updateJobStage(presentationId, 'uploading', 95);

      const filename = `${presentationId}.pptx`;
      const pptxUrl = await this.storage.saveFile(filename, pptxBuffer);

      const generationTimeMs = Date.now() - startTime;

      await this.presentationRepository.update(presentationId, {
        status: 'completed',
        pptxUrl,
        generationTimeMs,
        generatedContent: JSON.parse(JSON.stringify(pipelineOutput)),
      });

      await this.updateJobStage(presentationId, 'done', 100);

      this.logger.log(
        `Presentation ${presentationId} completed in ${generationTimeMs}ms`,
      );

      // Send file to user via Telegram
      await this.sendFileToUser(presentationId, pptxUrl, topic);

      return { pptxUrl };
    } catch (error) {
      this.logger.error(`Error processing presentation ${presentationId}:`, error);

      await this.presentationRepository.update(presentationId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job<PresentationJobData>) {
    this.logger.log(`Job ${job.id} started for presentation ${job.data.presentationId}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<PresentationJobData>) {
    this.logger.log(`Job ${job.id} completed for presentation ${job.data.presentationId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<PresentationJobData> | undefined, error: Error) {
    this.logger.error(`Job failed: ${error.message}`, error.stack);
  }

  private async updatePresentationStatus(
    presentationId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
  ): Promise<void> {
    await this.presentationRepository.update(presentationId, { status });
  }

  private async updateJobStage(
    presentationId: string,
    stage: string,
    progress: number,
  ): Promise<void> {
    await this.generationJobRepository.update(
      { presentationId },
      {
        currentStage: stage as GenerationJob['currentStage'],
        progress,
      },
    );
  }

  private async updateJobProgress(
    presentationId: string,
    stage: string,
    progress: number,
  ): Promise<void> {
    try {
      await this.generationJobRepository.update(
        { presentationId },
        {
          currentStage: stage as GenerationJob['currentStage'],
          progress,
        },
      );
    } catch {
      // Ignore errors in progress updates
    }
  }

  private async sendFileToUser(
    presentationId: string,
    pptxUrl: string,
    topic: string,
  ): Promise<void> {
    try {
      // Get presentation with user
      const presentation = await this.presentationRepository.findOne({
        where: { id: presentationId },
      });

      if (!presentation) {
        this.logger.error(`Presentation not found: ${presentationId}`);
        return;
      }

      // Get user
      const user = await this.userRepository.findOne({
        where: { id: presentation.userId },
      });

      if (!user) {
        this.logger.error(`User not found for presentation: ${presentationId}`);
        return;
      }

      const i18n = new I18nService(user.language || 'uz');

      // Send file to user
      const filePath = path.resolve(pptxUrl);

      if (!fs.existsSync(filePath)) {
        this.logger.error(`File not found: ${filePath}`);
        return;
      }

      await this.bot.telegram.sendDocument(
        user.telegramId,
        { source: filePath, filename: `${topic.substring(0, 30)}.pptx` },
        {
          caption: i18n.t('presentationReady', { topic }),
          parse_mode: 'HTML',
        },
      );

      this.logger.log(`File sent to user ${user.telegramId}`);
    } catch (error) {
      this.logger.error(`Failed to send file to user:`, error);
    }
  }
}
