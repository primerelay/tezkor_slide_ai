import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { TranslatorAgent } from './translator.agent';

// Flat, cheap price — translation is high-frequency.
export const TRANSLATE_PRICE = 500;
export const TRANSLATE_MAX_CHARS = 4000;

@Injectable()
export class TranslatorService {
  private readonly logger = new Logger(TranslatorService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly agent: TranslatorAgent,
  ) {}

  getPrice(): number {
    return TRANSLATE_PRICE;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { telegramId } });
  }

  /** Translate text — deducts credits up front, refunds automatically on failure. */
  async translate(userId: number, text: string, targetLang: string): Promise<string> {
    const trimmed = (text || '').trim();
    if (trimmed.length < 2) throw new Error('Matn juda qisqa');
    if (trimmed.length > TRANSLATE_MAX_CHARS) {
      throw new Error(`Matn juda uzun (maksimum ${TRANSLATE_MAX_CHARS} belgi)`);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const price = TRANSLATE_PRICE;
    if (user.credits < price) {
      throw new Error(`Balans yetarli emas. Kerak: ${price} so'm, Mavjud: ${user.credits} so'm`);
    }

    user.credits -= price;
    await this.userRepository.save(user);

    try {
      const result = await this.agent.translate(trimmed, targetLang);
      this.logger.log(`Translation done for user ${userId} ($${result.cost.toFixed(5)})`);
      return result.text;
    } catch (error) {
      user.credits += price;
      await this.userRepository.save(user);
      await this.transactionRepository.save(
        this.transactionRepository.create({
          userId: user.id,
          type: 'refund',
          amount: price,
          status: 'approved',
          description: 'Tarjima amalga oshmadi, pul qaytarildi',
        }),
      );
      this.logger.error(`Translation failed, refunded ${price}:`, error);
      throw error;
    }
  }
}
