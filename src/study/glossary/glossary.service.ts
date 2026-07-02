import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import * as fs from 'fs';
import * as path from 'path';
import { GlossarySet } from '../../database/entities/glossary-set.entity';
import { User } from '../../database/entities/user.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { GlossaryGeneratorAgent } from './glossary-generator.agent';
import { GlossaryRendererService } from './glossary-renderer.service';
import { StorageService } from '../../storage/storage.service';

// Pricing in so'm by term count.
export const GLOSSARY_PRICES: Record<number, number> = {
  20: 500,
  30: 800,
  50: 1200,
};

export function glossaryPrice(count: number): number {
  return GLOSSARY_PRICES[count] ?? 800;
}

export interface CreateGlossaryInput {
  userId: number;
  sourceContent: string;
  termCount: number;
  language?: string;
  telegramId?: string;
}

@Injectable()
export class GlossaryService {
  private readonly logger = new Logger(GlossaryService.name);

  constructor(
    @InjectRepository(GlossarySet)
    private readonly setRepository: Repository<GlossarySet>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectBot()
    private readonly bot: Telegraf,
    private readonly generator: GlossaryGeneratorAgent,
    private readonly renderer: GlossaryRendererService,
    private readonly storage: StorageService,
  ) {}

  getPrice(count: number): number {
    return glossaryPrice(count);
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { telegramId } });
  }

  /**
   * Generate a glossary synchronously (one AI call), render a DOCX, save it and
   * deliver it to the user's Telegram chat. Credits are deducted up front and
   * refunded automatically if anything fails.
   */
  async createSet(input: CreateGlossaryInput): Promise<GlossarySet> {
    const user = await this.userRepository.findOne({ where: { id: input.userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const price = glossaryPrice(input.termCount);
    if (user.credits < price) {
      throw new Error(
        `Balans yetarli emas. Kerak: ${price} so'm, Mavjud: ${user.credits} so'm`,
      );
    }

    user.credits -= price;
    await this.userRepository.save(user);

    try {
      const result = await this.generator.generate(
        input.sourceContent,
        input.termCount,
        input.language || 'uz',
      );

      const buffer = await this.renderer.render(result.title, result.entries);
      const filename = `glossary_${user.id}_${Date.now()}.docx`;
      const docxUrl = await this.storage.saveFile(filename, buffer);

      const set = await this.setRepository.save(
        this.setRepository.create({
          userId: input.userId,
          title: result.title,
          sourceContent: input.sourceContent,
          language: input.language || 'uz',
          termCount: result.entries.length,
          entries: result.entries,
          docxUrl,
          price,
          generationCost: result.cost,
        }),
      );

      // Deliver the DOCX to Telegram.
      const chatId = input.telegramId || user.telegramId;
      await this.deliver(chatId, docxUrl, result.title, result.entries.length);

      this.logger.log(`Glossary ${set.id} created (${result.entries.length} terms)`);
      return set;
    } catch (error) {
      user.credits += price;
      await this.userRepository.save(user);
      await this.transactionRepository.save(
        this.transactionRepository.create({
          userId: user.id,
          type: 'refund',
          amount: price,
          status: 'approved',
          description: 'Glossary yaratilmadi, pul qaytarildi',
        }),
      );
      this.logger.error(`Glossary generation failed, refunded ${price}:`, error);
      throw error;
    }
  }

  private async deliver(
    telegramId: string,
    docxUrl: string,
    title: string,
    count: number,
  ): Promise<void> {
    try {
      const filePath = path.resolve(docxUrl);
      if (!fs.existsSync(filePath)) return;
      const safeTitle = title.replace(/["/\\<>|:*?]/g, '').substring(0, 40);
      await this.bot.telegram.sendDocument(
        telegramId,
        { source: filePath, filename: `${safeTitle}.docx` },
        {
          caption: `✅ <b>${title}</b>\n📖 ${count} ta atama\n\nWord (.docx) faylini yuklab oling! 🎉`,
          parse_mode: 'HTML',
        },
      );
    } catch (error) {
      this.logger.error('Failed to deliver glossary:', error);
    }
  }

  async getSet(id: number): Promise<GlossarySet> {
    const set = await this.setRepository.findOne({ where: { id } });
    if (!set) throw new NotFoundException('Glossary not found');
    return set;
  }
}
