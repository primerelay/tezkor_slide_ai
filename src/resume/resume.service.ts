import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import * as fs from 'fs';
import * as path from 'path';
import { Resume } from '../database/entities/resume.entity';
import { User } from '../database/entities/user.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { ResumeEnhancerAgent, ResumeInput } from './resume-enhancer.agent';
import { ResumeRendererService } from './resume-renderer.service';
import { StorageService } from '../storage/storage.service';

// Resume is a single high-value document — flat price.
export const RESUME_PRICE = 2500;

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  constructor(
    @InjectRepository(Resume)
    private readonly resumeRepository: Repository<Resume>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectBot()
    private readonly bot: Telegraf,
    private readonly enhancer: ResumeEnhancerAgent,
    private readonly renderer: ResumeRendererService,
    private readonly storage: StorageService,
  ) {}

  getPrice(): number {
    return RESUME_PRICE;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { telegramId } });
  }

  async create(userId: number, input: ResumeInput, telegramId?: string): Promise<Resume> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const price = RESUME_PRICE;
    if (user.credits < price) {
      throw new Error(`Balans yetarli emas. Kerak: ${price} so'm, Mavjud: ${user.credits} so'm`);
    }

    user.credits -= price;
    await this.userRepository.save(user);

    try {
      const enhanced = await this.enhancer.enhance(input);
      const buffer = await this.renderer.render(enhanced.data, input.language);
      const filename = `resume_${user.id}_${Date.now()}.docx`;
      const docxUrl = await this.storage.saveFile(filename, buffer);

      const resume = await this.resumeRepository.save(
        this.resumeRepository.create({
          userId,
          language: input.language,
          data: enhanced.data,
          docxUrl,
          price,
          generationCost: enhanced.cost,
        }),
      );

      await this.deliver(telegramId || user.telegramId, docxUrl, enhanced.data.fullName);
      this.logger.log(`Resume ${resume.id} created for user ${userId}`);
      return resume;
    } catch (error) {
      user.credits += price;
      await this.userRepository.save(user);
      await this.transactionRepository.save(
        this.transactionRepository.create({
          userId: user.id,
          type: 'refund',
          amount: price,
          status: 'approved',
          description: 'Rezyume yaratilmadi, pul qaytarildi',
        }),
      );
      this.logger.error(`Resume generation failed, refunded ${price}:`, error);
      throw error;
    }
  }

  private async deliver(telegramId: string, docxUrl: string, fullName: string): Promise<void> {
    try {
      const filePath = path.resolve(docxUrl);
      if (!fs.existsSync(filePath)) return;
      const safeName = fullName.replace(/["/\\<>|:*?]/g, '').substring(0, 40) || 'CV';
      await this.bot.telegram.sendDocument(
        telegramId,
        { source: filePath, filename: `${safeName} - CV.docx` },
        {
          caption: `✅ <b>${fullName} — Rezyume</b>\n\nProfessional CV Word (.docx) formatida tayyor! 🎉`,
          parse_mode: 'HTML',
        },
      );
    } catch (error) {
      this.logger.error('Failed to deliver resume:', error);
    }
  }

  async getResume(id: number): Promise<Resume> {
    const resume = await this.resumeRepository.findOne({ where: { id } });
    if (!resume) throw new NotFoundException('Resume not found');
    return resume;
  }
}
