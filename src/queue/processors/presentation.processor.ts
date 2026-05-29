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

// Progress messages with emojis
const PROGRESS_MESSAGES: Record<number, { emoji: string; text: string }> = {
  0: { emoji: '🚀', text: 'Boshlanmoqda...' },
  20: { emoji: '🔍', text: 'Mavzu tahlil qilinmoqda...' },
  40: { emoji: '✍️', text: 'Kontent yaratilmoqda...' },
  60: { emoji: '📊', text: 'Slaydlar tayyorlanmoqda...' },
  80: { emoji: '🎨', text: 'Dizayn qo\'llanmoqda...' },
  100: { emoji: '✅', text: 'Tayyor!' },
};

@Processor(PRESENTATION_QUEUE)
export class PresentationProcessor extends WorkerHost {
  private readonly logger = new Logger(PresentationProcessor.name);
  private progressMessageIds: Map<string, { chatId: string; messageId: number }> = new Map();
  private lastProgressSent: Map<string, number> = new Map();

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

    // Get user for sending progress messages
    const presentation = await this.presentationRepository.findOne({
      where: { id: presentationId },
    });
    const user = presentation
      ? await this.userRepository.findOne({ where: { id: presentation.userId } })
      : null;

    try {
      await this.updatePresentationStatus(presentationId, 'processing');

      // Send initial progress message
      if (user) {
        await this.sendProgressMessage(presentationId, user.telegramId, topic, 0);
      }

      await this.updateJobStage(presentationId, 'parsing', 5);

      // Update to 20%
      if (user) {
        await this.sendProgressMessage(presentationId, user.telegramId, topic, 20);
      }

      const pipelineOutput = await this.pipeline.generate(
        { topic, studentName, teacherName, includeReja, slideCount, theme, language },
        async (progress) => {
          this.updateJobProgress(presentationId, progress.stage, progress.progress);

          // Send progress updates at key milestones
          if (user) {
            const milestone = this.getProgressMilestone(progress.progress);
            const lastSent = this.lastProgressSent.get(presentationId) || 0;
            if (milestone > lastSent && milestone <= 60) {
              await this.sendProgressMessage(presentationId, user.telegramId, topic, milestone);
            }
          }
        },
      );

      // Update to 80%
      if (user) {
        await this.sendProgressMessage(presentationId, user.telegramId, topic, 80);
      }

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

      // Update to 100%
      if (user) {
        await this.sendProgressMessage(presentationId, user.telegramId, topic, 100);
      }

      this.logger.log(
        `Presentation ${presentationId} completed in ${generationTimeMs}ms`,
      );

      // Send file to user via Telegram
      await this.sendFileToUser(presentationId, pptxUrl, topic);

      // Cleanup
      this.progressMessageIds.delete(presentationId);
      this.lastProgressSent.delete(presentationId);

      return { pptxUrl };
    } catch (error) {
      this.logger.error(`Error processing presentation ${presentationId}:`, error);

      // Send error message to user
      if (user) {
        await this.sendErrorMessage(user.telegramId, topic, error);
      }

      await this.presentationRepository.update(presentationId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      // Cleanup
      this.progressMessageIds.delete(presentationId);
      this.lastProgressSent.delete(presentationId);

      throw error;
    }
  }

  private getProgressMilestone(progress: number): number {
    if (progress >= 60) return 60;
    if (progress >= 40) return 40;
    if (progress >= 20) return 20;
    return 0;
  }

  private buildProgressBar(progress: number): string {
    const filledBlocks = Math.floor(progress / 10);
    const emptyBlocks = 10 - filledBlocks;
    return '▓'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  }

  private async sendProgressMessage(
    presentationId: string,
    telegramId: string,
    topic: string,
    progress: number,
  ): Promise<void> {
    try {
      const progressInfo = PROGRESS_MESSAGES[progress] || PROGRESS_MESSAGES[0];
      const progressBar = this.buildProgressBar(progress);

      const messageText = `${progressInfo.emoji} <b>Prezentatsiya yaratilmoqda</b>\n\n` +
        `📝 Mavzu: <i>${topic}</i>\n\n` +
        `${progressBar} ${progress}%\n\n` +
        `${progressInfo.text}`;

      const existing = this.progressMessageIds.get(presentationId);

      if (existing) {
        // Edit existing message
        try {
          await this.bot.telegram.editMessageText(
            existing.chatId,
            existing.messageId,
            undefined,
            messageText,
            { parse_mode: 'HTML' },
          );
        } catch (editError) {
          // If edit fails, send new message
          this.logger.warn(`Failed to edit message, sending new one`);
        }
      } else {
        // Send new message
        const sent = await this.bot.telegram.sendMessage(telegramId, messageText, {
          parse_mode: 'HTML',
        });
        this.progressMessageIds.set(presentationId, {
          chatId: telegramId,
          messageId: sent.message_id,
        });
      }

      this.lastProgressSent.set(presentationId, progress);
    } catch (error) {
      this.logger.error(`Failed to send progress message:`, error);
    }
  }

  private async sendErrorMessage(
    telegramId: string,
    topic: string,
    error: unknown,
  ): Promise<void> {
    try {
      const errorMessage = error instanceof Error ? error.message : 'Noma\'lum xatolik';
      await this.bot.telegram.sendMessage(
        telegramId,
        `❌ <b>Xatolik yuz berdi</b>\n\n` +
          `📝 Mavzu: <i>${topic}</i>\n\n` +
          `Xatolik: ${errorMessage}\n\n` +
          `Iltimos, qaytadan urinib ko'ring.`,
        { parse_mode: 'HTML' },
      );
    } catch (sendError) {
      this.logger.error(`Failed to send error message:`, sendError);
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

      // Delete progress message before sending file
      const progressMsg = this.progressMessageIds.get(presentationId);
      if (progressMsg) {
        try {
          await this.bot.telegram.deleteMessage(progressMsg.chatId, progressMsg.messageId);
        } catch {
          // Ignore delete errors
        }
      }

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
          caption: `✅ <b>Prezentatsiya tayyor!</b>\n\n` +
            `📝 Mavzu: <i>${topic}</i>\n` +
            `📊 Slaydlar: ${presentation.slideCount}\n` +
            `🎨 Tema: ${presentation.theme}\n\n` +
            `Yuklab oling va foydalaning! 🎉`,
          parse_mode: 'HTML',
        },
      );

      this.logger.log(`File sent to user ${user.telegramId}`);
    } catch (error) {
      this.logger.error(`Failed to send file to user:`, error);
    }
  }
}
