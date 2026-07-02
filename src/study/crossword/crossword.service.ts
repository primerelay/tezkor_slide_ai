import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import * as fs from 'fs';
import * as path from 'path';
import { CrosswordSet } from '../../database/entities/crossword-set.entity';
import { User } from '../../database/entities/user.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { CrosswordGeneratorAgent } from './crossword-generator.agent';
import { CrosswordRendererService } from './crossword-renderer.service';
import { buildCrossword } from './crossword.builder';
import { StorageService } from '../../storage/storage.service';

// Pricing in so'm by word count.
export const CROSSWORD_PRICES: Record<number, number> = {
  10: 800,
  15: 1200,
};

export function crosswordPrice(count: number): number {
  return CROSSWORD_PRICES[count] ?? 800;
}

export interface CreateCrosswordInput {
  userId: number;
  sourceContent: string;
  wordCount: number;
  language?: string;
  telegramId?: string;
}

@Injectable()
export class CrosswordService {
  private readonly logger = new Logger(CrosswordService.name);

  constructor(
    @InjectRepository(CrosswordSet)
    private readonly setRepository: Repository<CrosswordSet>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectBot()
    private readonly bot: Telegraf,
    private readonly generator: CrosswordGeneratorAgent,
    private readonly renderer: CrosswordRendererService,
    private readonly storage: StorageService,
  ) {}

  getPrice(count: number): number {
    return crosswordPrice(count);
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { telegramId } });
  }

  async createSet(input: CreateCrosswordInput): Promise<CrosswordSet> {
    const user = await this.userRepository.findOne({ where: { id: input.userId } });
    if (!user) throw new Error('User not found');

    const price = crosswordPrice(input.wordCount);
    if (user.credits < price) {
      throw new Error(
        `Balans yetarli emas. Kerak: ${price} so'm, Mavjud: ${user.credits} so'm`,
      );
    }

    user.credits -= price;
    await this.userRepository.save(user);

    try {
      const gen = await this.generator.generate(
        input.sourceContent,
        input.wordCount,
        input.language || 'uz',
      );

      const built = buildCrossword(gen.words, input.wordCount);
      if (!built) {
        throw new Error('Krossvord tuzib bo\'lmadi (so\'zlar kesishmadi)');
      }

      const buffer = await this.renderer.render(gen.title, built.data);
      const filename = `crossword_${user.id}_${Date.now()}.docx`;
      const docxUrl = await this.storage.saveFile(filename, buffer);

      const set = await this.setRepository.save(
        this.setRepository.create({
          userId: input.userId,
          title: gen.title,
          sourceContent: input.sourceContent,
          language: input.language || 'uz',
          wordCount: built.placedCount,
          data: built.data,
          docxUrl,
          price,
          generationCost: gen.cost,
        }),
      );

      const chatId = input.telegramId || user.telegramId;
      await this.deliver(chatId, docxUrl, gen.title, built.placedCount);

      this.logger.log(`Crossword ${set.id} created (${built.placedCount} words, ${built.dropped} dropped)`);
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
          description: 'Krossvord yaratilmadi, pul qaytarildi',
        }),
      );
      this.logger.error(`Crossword generation failed, refunded ${price}:`, error);
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
          caption: `✅ <b>${title}</b>\n🧩 ${count} ta so'z\n\nKrossvord + javoblar kaliti ichida. Word (.docx) faylini yuklab oling! 🎉`,
          parse_mode: 'HTML',
        },
      );
    } catch (error) {
      this.logger.error('Failed to deliver crossword:', error);
    }
  }

  async getSet(id: number): Promise<CrosswordSet> {
    const set = await this.setRepository.findOne({ where: { id } });
    if (!set) throw new NotFoundException('Crossword not found');
    return set;
  }
}
