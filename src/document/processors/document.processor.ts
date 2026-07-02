import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import * as fs from 'fs';
import * as path from 'path';
import { GeneratedDocument } from '../../database/entities/document.entity';
import { User } from '../../database/entities/user.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { DocumentPipeline } from '../pipeline/document.pipeline';
import { DocxRendererService } from '../renderer/docx-renderer.service';
import { StorageService } from '../../storage/storage.service';
import { DOCUMENT_QUEUE } from '../../queue/constants';
import { DocumentJobData } from '../types/document-job.types';
import { I18nService, SupportedLanguage } from '../../common/i18n/i18n.service';

@Processor(DOCUMENT_QUEUE)
export class DocumentProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentProcessor.name);
  private progressMessages: Map<string, { chatId: string; messageId: number }> = new Map();

  constructor(
    @InjectBot()
    private readonly bot: Telegraf,
    @InjectRepository(GeneratedDocument)
    private readonly documentRepository: Repository<GeneratedDocument>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly pipeline: DocumentPipeline,
    private readonly renderer: DocxRendererService,
    private readonly storage: StorageService,
  ) {
    super();
  }

  async process(job: Job<DocumentJobData>): Promise<{ docxUrl: string }> {
    const { documentId, topic, docType, pageCount, language } = job.data;

    this.logger.log(`Processing document: ${documentId}`);
    const startTime = Date.now();

    const lang = (language || 'uz') as SupportedLanguage;
    const i18n = I18nService.create(lang);

    const user = await this.userRepository.findOne({
      where: { id: job.data.userId },
    });

    try {
      await this.documentRepository.update(documentId, { status: 'processing' });

      if (user) {
        await this.sendProgress(documentId, user.telegramId, topic, 0, i18n);
      }

      let lastMilestone = 0;
      const pipelineOutput = await this.pipeline.generate(
        {
          topic,
          docType,
          pageCount,
          language: lang,
          institution: job.data.institution,
          studentName: job.data.studentName,
          teacherName: job.data.teacherName,
        },
        async ({ progress }) => {
          // Update the Telegram progress message every ~20%.
          const milestone = Math.floor(progress / 20) * 20;
          if (user && milestone > lastMilestone) {
            lastMilestone = milestone;
            await this.sendProgress(documentId, user.telegramId, topic, milestone, i18n);
          }
        },
      );

      const docxBuffer = await this.renderer.renderDocument(pipelineOutput);

      const filename = `${documentId}.docx`;
      const docxUrl = await this.storage.saveFile(filename, docxBuffer);

      const generationTimeMs = Date.now() - startTime;

      await this.documentRepository.update(documentId, {
        status: 'completed',
        docxUrl,
        generationTimeMs,
        aiCost: pipelineOutput.metadata.totalCost || 0,
        generatedContent: JSON.parse(JSON.stringify(pipelineOutput)),
      });

      if (user) {
        await this.sendProgress(documentId, user.telegramId, topic, 100, i18n);
        await this.sendFileToUser(user, docxUrl, pipelineOutput.title, docType, pageCount, i18n);
      }

      this.progressMessages.delete(documentId);
      this.logger.log(`Document ${documentId} completed in ${generationTimeMs}ms`);

      return { docxUrl };
    } catch (error) {
      this.logger.error(`Error processing document ${documentId}:`, error);

      await this.documentRepository.update(documentId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      // Automatic refund — the user must not lose money on a failed job.
      const refunded = await this.refund(documentId, job.data.userId);

      if (user) {
        await this.sendErrorMessage(user.telegramId, topic, refunded, i18n);
      }

      this.progressMessages.delete(documentId);
      throw error;
    }
  }

  private async refund(documentId: string, userId: number): Promise<number> {
    try {
      const document = await this.documentRepository.findOne({
        where: { id: documentId },
      });
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!document || !user || !document.price) return 0;

      user.credits += document.price;
      await this.userRepository.save(user);

      const transaction = this.transactionRepository.create({
        userId,
        type: 'refund',
        amount: document.price,
        status: 'approved',
        description: `Hujjat yaratilmadi, pul qaytarildi (${documentId})`,
      });
      await this.transactionRepository.save(transaction);

      this.logger.log(`Refunded ${document.price} so'm to user ${userId}`);
      return document.price;
    } catch (refundError) {
      this.logger.error(`Refund failed for document ${documentId}:`, refundError);
      return 0;
    }
  }

  private buildProgressBar(progress: number): string {
    const filled = Math.floor(progress / 10);
    return '▓'.repeat(filled) + '░'.repeat(10 - filled);
  }

  private async sendProgress(
    documentId: string,
    telegramId: string,
    topic: string,
    progress: number,
    i18n: I18nService,
  ): Promise<void> {
    try {
      const messageText =
        `📄 <b>${i18n.t('document.progressTitle')}</b>\n\n` +
        `📝 ${i18n.t('presentation.topic')}: <i>${topic}</i>\n\n` +
        `${this.buildProgressBar(progress)} ${progress}%\n\n` +
        `${i18n.t(`document.progress.${progress}`)}`;

      const existing = this.progressMessages.get(documentId);

      if (existing) {
        try {
          await this.bot.telegram.editMessageText(
            existing.chatId,
            existing.messageId,
            undefined,
            messageText,
            { parse_mode: 'HTML' },
          );
        } catch {
          this.logger.warn('Failed to edit document progress message');
        }
      } else {
        const sent = await this.bot.telegram.sendMessage(telegramId, messageText, {
          parse_mode: 'HTML',
        });
        this.progressMessages.set(documentId, {
          chatId: telegramId,
          messageId: sent.message_id,
        });
      }
    } catch (error) {
      this.logger.error('Failed to send document progress:', error);
    }
  }

  private async sendErrorMessage(
    telegramId: string,
    topic: string,
    refundedAmount: number,
    i18n: I18nService,
  ): Promise<void> {
    try {
      let message =
        `❌ <b>${i18n.t('errors.unknown')}</b>\n\n` +
        `📝 ${i18n.t('presentation.topic')}: <i>${topic}</i>\n\n`;

      if (refundedAmount > 0) {
        message += i18n.t('document.refunded', {
          amount: refundedAmount.toLocaleString(),
        }) + '\n\n';
      }

      message += i18n.t('errors.tryAgain');

      await this.bot.telegram.sendMessage(telegramId, message, {
        parse_mode: 'HTML',
      });
    } catch (sendError) {
      this.logger.error('Failed to send document error message:', sendError);
    }
  }

  private async sendFileToUser(
    user: User,
    docxUrl: string,
    title: string,
    docType: string,
    pageCount: number,
    i18n: I18nService,
  ): Promise<void> {
    try {
      const progressMsg = [...this.progressMessages.entries()].find(
        ([, v]) => v.chatId === user.telegramId,
      );
      if (progressMsg) {
        try {
          await this.bot.telegram.deleteMessage(progressMsg[1].chatId, progressMsg[1].messageId);
        } catch {
          // Ignore delete errors
        }
      }

      const filePath = path.resolve(docxUrl);
      if (!fs.existsSync(filePath)) {
        this.logger.error(`Document file not found: ${filePath}`);
        return;
      }

      const safeTitle = title.replace(/["/\\<>|:*?]/g, '').substring(0, 40);

      await this.bot.telegram.sendDocument(
        user.telegramId,
        { source: filePath, filename: `${safeTitle}.docx` },
        {
          caption:
            `✅ <b>${i18n.t('document.ready')}</b>\n\n` +
            `📝 ${i18n.t('presentation.topic')}: <i>${title}</i>\n` +
            `📄 ${i18n.t(`document.typeNames.${docType}`)}\n` +
            `📃 ${i18n.t('document.pages')}: ~${pageCount}\n\n` +
            `${i18n.t('presentation.download')} 🎉`,
          parse_mode: 'HTML',
        },
      );

      this.logger.log(`Document sent to user ${user.telegramId}`);
    } catch (error) {
      this.logger.error('Failed to send document to user:', error);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<DocumentJobData> | undefined, error: Error) {
    this.logger.error(`Document job failed: ${error.message}`, error.stack);
  }
}
