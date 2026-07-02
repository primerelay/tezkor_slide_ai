import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { User } from '../database/entities/user.entity';
import { Presentation } from '../database/entities/presentation.entity';
import { TelegramService } from '../telegram/telegram.service';
import { CreatePresentationDto, TemplateDto } from './dto/mini-app.dto';
import { PRESENTATION_QUEUE } from '../queue/constants';
import { PresentationTheme, normalizeTheme } from '../renderer/themes/theme-registry';
import { GenerationJob } from '../database/entities/generation-job.entity';
import { RendererService } from '../renderer/renderer.service';
import { StorageService } from '../storage/storage.service';
import { SupportedLanguage } from '../common/i18n/i18n.service';
import { ImageService } from '../ai/services/image.service';
import { DocumentService } from '../document/document.service';
import { CreateDocumentDto } from './dto/mini-app.dto';

@Injectable()
export class MiniAppService {
  private readonly logger = new Logger(MiniAppService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Presentation)
    private readonly presentationRepository: Repository<Presentation>,
    @InjectRepository(GenerationJob)
    private readonly generationJobRepository: Repository<GenerationJob>,
    @InjectQueue(PRESENTATION_QUEUE)
    private readonly presentationQueue: Queue,
    private readonly telegramService: TelegramService,
    private readonly rendererService: RendererService,
    private readonly storageService: StorageService,
    private readonly imageService: ImageService,
    private readonly documentService: DocumentService,
  ) {}

  /**
   * Create a document (mustaqil ish / referat) from the mini-app. Deducts
   * credits up front; the finished .docx is delivered to the user's Telegram
   * chat by the document processor (which also auto-refunds on failure).
   */
  async createDocument(dto: CreateDocumentDto): Promise<{ documentId: string; price: number }> {
    const user = await this.userRepository.findOne({
      where: { telegramId: dto.telegramId.toString() },
    });
    if (!user) {
      throw new Error('User not found');
    }

    const price = this.documentService.getPriceForPageCount(dto.pageCount);
    if (user.credits < price) {
      throw new Error(
        `Balansingiz yetarli emas. Kerak: ${price} so'm, Balans: ${user.credits} so'm`,
      );
    }

    await this.telegramService.deductCredits(user.id, price);

    try {
      const document = await this.documentService.createDocument({
        userId: user.id,
        topic: dto.topic,
        docType: dto.docType,
        pageCount: dto.pageCount,
        language: dto.language || user.language || 'uz',
        institution: dto.institution,
        studentName: dto.studentName,
        teacherName: dto.teacherName,
        price,
        telegramChatId: user.telegramId,
      });
      return { documentId: document.id, price };
    } catch (error) {
      // Queueing failed before any work started — return the money.
      await this.telegramService.addCredits(user.id, price);
      throw error;
    }
  }

  async getDocumentById(id: string) {
    const doc = await this.documentService.getDocumentById(id);
    if (!doc) return null;
    return {
      id: doc.id,
      type: doc.type,
      topic: doc.topic,
      status: doc.status,
      pageCount: doc.pageCount,
      errorMessage: doc.errorMessage,
    };
  }

  /** Editor image picker — search stock photos (no download yet). */
  async searchImages(query: string) {
    return this.imageService.searchImages(query, 12);
  }

  /**
   * Save the user's edited slide content, re-render the PPTX, and deliver it
   * to their Telegram chat. Called from the in-app editor's "Download" button.
   */
  async finalizePresentation(
    id: string,
    content: any,
  ): Promise<{ success: boolean }> {
    const presentation = await this.presentationRepository.findOne({ where: { id } });
    if (!presentation) {
      throw new Error('Presentation not found');
    }
    const user = await this.userRepository.findOne({
      where: { id: presentation.userId },
    });
    if (!user) {
      throw new Error('User not found');
    }

    const language = (presentation.language || 'uz') as SupportedLanguage;

    // Normalize the edited content into the shape the renderer expects.
    const pipelineOutput = {
      title: content?.title || presentation.topic,
      subtitle: content?.subtitle || '',
      studentName: content?.studentName ?? presentation.studentName,
      teacherName: content?.teacherName ?? presentation.teacherName,
      theme: presentation.theme,
      language,
      slides: Array.isArray(content?.slides) ? content.slides : [],
      metadata: { generatedAt: new Date(), pipelineVersion: 'editor' },
    };

    // Download any editor-added images (assets.image.url) so the renderer
    // can embed them as local files.
    for (const slide of pipelineOutput.slides as any[]) {
      const img = slide?.assets?.image;
      if (img?.url && !img.localPath) {
        try {
          const fname = `editimg_${id}_${slide.slideNumber || 0}_${Date.now()}.jpg`;
          const localPath = await this.imageService.downloadImage(img.url, fname);
          if (localPath) slide.assets.image.localPath = localPath;
        } catch (e) {
          this.logger.warn(`Failed to download editor image: ${e}`);
        }
      }
    }

    const buffer = await this.rendererService.renderPresentation(
      pipelineOutput as any,
      language,
    );
    const filename = `${id}.pptx`;
    const pptxUrl = await this.storageService.saveFile(filename, buffer);

    await this.presentationRepository.update(id, {
      generatedContent: JSON.parse(JSON.stringify(pipelineOutput)),
      pptxUrl,
      slideCount: pipelineOutput.slides.length,
      status: 'completed',
    });

    // Deliver the edited file to the user's Telegram chat.
    await this.telegramService.sendDocumentToUser(
      user.telegramId,
      pptxUrl,
      `✅ <b>${pipelineOutput.title}</b>`,
      `${pipelineOutput.title.substring(0, 40)}.pptx`,
    );

    return { success: true };
  }

  getTemplates(): TemplateDto[] {
    return [
      {
        id: 'academic-blue',
        name: 'Academic Blue',
        nameUz: "Akademik ko'k",
        category: 'academic',
        colors: {
          primary: '#1e40af',
          secondary: '#3b82f6',
          accent: '#f59e0b',
          background: '#ffffff',
          text: '#1f2937',
        },
      },
      {
        id: 'minimal-white',
        name: 'Minimal White',
        nameUz: 'Minimalist oq',
        category: 'minimal',
        colors: {
          primary: '#000000',
          secondary: '#6b7280',
          accent: '#3b82f6',
          background: '#ffffff',
          text: '#111827',
        },
      },
      {
        id: 'modern-dark',
        name: 'Modern Dark',
        nameUz: 'Zamonaviy qora',
        category: 'creative',
        colors: {
          primary: '#8b5cf6',
          secondary: '#a78bfa',
          accent: '#f59e0b',
          background: '#1f2937',
          text: '#f9fafb',
        },
      },
      {
        id: 'gradient-purple',
        name: 'Gradient Purple',
        nameUz: 'Gradient binafsha',
        category: 'creative',
        colors: {
          primary: '#7c3aed',
          secondary: '#a855f7',
          accent: '#ec4899',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          text: '#ffffff',
        },
      },
      {
        id: 'professional-green',
        name: 'Professional Green',
        nameUz: 'Professional yashil',
        category: 'business',
        colors: {
          primary: '#059669',
          secondary: '#10b981',
          accent: '#f59e0b',
          background: '#ffffff',
          text: '#1f2937',
        },
      },
      {
        id: 'warm-orange',
        name: 'Warm Orange',
        nameUz: "Iliq to'q sariq",
        category: 'creative',
        colors: {
          primary: '#ea580c',
          secondary: '#f97316',
          accent: '#fbbf24',
          background: '#fffbeb',
          text: '#1f2937',
        },
      },
    ];
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { telegramId },
    });
  }

  async createPresentation(dto: CreatePresentationDto): Promise<{ presentationId: string }> {
    // Get user by telegram ID
    const user = await this.userRepository.findOne({
      where: { telegramId: dto.userId.toString() },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate price based on slide count
    const slideCount = dto.presentation.slides?.length || 8;
    const price = this.telegramService.getPriceForSlideCount(slideCount);

    // Check balance
    if (user.credits < price) {
      throw new Error(`Balansingiz yetarli emas. Kerak: ${price} so'm, Balans: ${user.credits} so'm`);
    }

    // The mini-app sends template.id equal to a backend theme id
    // (e.g. 'gradient_violet'). Older builds used hyphenated/legacy ids,
    // so map those first, then normalize (unknown -> default theme).
    const legacy: Record<string, PresentationTheme> = {
      'academic-blue': 'academic_blue',
      'minimal-white': 'minimal_white',
      'modern-dark': 'modern_dark',
      'gradient-purple': 'gradient_violet',
      'professional-green': 'scholar_green',
      'warm-orange': 'warm_sand',
      editorial: 'editorial_serif',
    };
    const rawId = dto.presentation.template?.id || '';
    const theme = normalizeTheme(legacy[rawId] || rawId);

    // Create presentation record
    const presentation = await this.telegramService.createPresentation({
      userId: user.id,
      topic: dto.presentation.title,
      studentName: dto.presentation.studentName,
      teacherName: dto.presentation.teacherName,
      includeReja: dto.presentation.includeReja || false,
      slideCount: slideCount,
      theme: theme,
      language: dto.presentation.language || 'uz',
    });

    // Deduct credits
    await this.telegramService.deductCredits(user.id, price);

    // Add to queue
    await this.presentationQueue.add('generate', {
      presentationId: presentation.id,
      topic: dto.presentation.title,
      studentName: dto.presentation.studentName,
      teacherName: dto.presentation.teacherName,
      includeReja: dto.presentation.includeReja || false,
      slideCount: slideCount,
      theme: theme,
      language: dto.presentation.language || 'uz',
      userId: user.id,
      // Pass custom slides if provided from Mini App
      customSlides: dto.presentation.slides,
      // Mini-app decks are reviewed/edited in the app; bot must not auto-send.
      source: 'mini_app',
    });

    this.logger.log(`Presentation ${presentation.id} queued for user ${user.id}`);

    return { presentationId: presentation.id };
  }

  async getUserPresentations(userId: number): Promise<Presentation[]> {
    return this.presentationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getPresentationById(id: string): Promise<any | null> {
    const p = await this.presentationRepository.findOne({ where: { id } });
    if (!p) return null;
    const job = await this.generationJobRepository.findOne({ where: { presentationId: id } });
    // Spread into a plain object so NestJS serializes ALL fields (including jobProgress).
    return {
      ...p,
      jobProgress: job?.progress ?? (p.status === 'completed' ? 100 : 0),
      jobStage: job?.currentStage ?? p.status,
    };
  }
}
