import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlashcardSet } from '../database/entities/flashcard-set.entity';
import { User } from '../database/entities/user.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { FlashcardGeneratorAgent } from './flashcard-generator.agent';

// Pricing in so'm by card count.
export const FLASHCARD_PRICES: Record<number, number> = {
  10: 500,
  20: 800,
  30: 1000,
};

export function flashcardPrice(count: number): number {
  return FLASHCARD_PRICES[count] ?? 800;
}

export interface CreateFlashcardInput {
  userId: number;
  sourceContent: string;
  cardCount: number;
  language?: string;
}

@Injectable()
export class FlashcardService {
  private readonly logger = new Logger(FlashcardService.name);

  constructor(
    @InjectRepository(FlashcardSet)
    private readonly setRepository: Repository<FlashcardSet>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly generator: FlashcardGeneratorAgent,
  ) {}

  getPrice(count: number): number {
    return flashcardPrice(count);
  }

  /**
   * Generate a flashcard set synchronously (one AI call). Credits are deducted
   * up front and refunded automatically if generation fails.
   */
  async createSet(input: CreateFlashcardInput): Promise<FlashcardSet> {
    const user = await this.userRepository.findOne({ where: { id: input.userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const price = flashcardPrice(input.cardCount);
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
        input.cardCount,
        input.language || 'uz',
      );

      const set = this.setRepository.create({
        userId: input.userId,
        title: result.title,
        sourceContent: input.sourceContent,
        language: input.language || 'uz',
        cardCount: result.cards.length,
        status: 'completed',
        cards: result.cards,
        price,
        generationCost: result.cost,
      });

      const saved = await this.setRepository.save(set);
      this.logger.log(`Flashcard set ${saved.id} created (${result.cards.length} cards, $${result.cost.toFixed(5)})`);
      return saved;
    } catch (error) {
      // Refund on failure — the user must not lose money.
      user.credits += price;
      await this.userRepository.save(user);
      await this.transactionRepository.save(
        this.transactionRepository.create({
          userId: user.id,
          type: 'refund',
          amount: price,
          status: 'approved',
          description: 'Flesh kartalar yaratilmadi, pul qaytarildi',
        }),
      );
      this.logger.error(`Flashcard generation failed, refunded ${price}:`, error);
      throw error;
    }
  }

  async getSet(id: number): Promise<FlashcardSet> {
    const set = await this.setRepository.findOne({ where: { id } });
    if (!set) {
      throw new NotFoundException('Flashcard set not found');
    }
    return set;
  }

  async getUserSets(userId: number): Promise<FlashcardSet[]> {
    return this.setRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { telegramId } });
  }
}
