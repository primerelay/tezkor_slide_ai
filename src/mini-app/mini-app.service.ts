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

@Injectable()
export class MiniAppService {
  private readonly logger = new Logger(MiniAppService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Presentation)
    private readonly presentationRepository: Repository<Presentation>,
    @InjectQueue(PRESENTATION_QUEUE)
    private readonly presentationQueue: Queue,
    private readonly telegramService: TelegramService,
  ) {}

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

  async getPresentationById(id: string): Promise<Presentation | null> {
    return this.presentationRepository.findOne({
      where: { id },
    });
  }
}
