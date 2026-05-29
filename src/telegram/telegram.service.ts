import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';
import { User, UserLanguage } from '../database/entities/user.entity';
import { Presentation } from '../database/entities/presentation.entity';
import { I18nService, SupportedLanguage } from '../common/i18n/i18n.service';
import { InlineKeyboards } from './keyboards/inline.keyboards';
import { ConfigService } from '@nestjs/config';

// Pricing in so'm
const SLIDE_PRICES: Record<number, number> = {
  6: 1000,
  8: 1500,
  10: 1700,
  12: 2000,
  14: 2200,
  16: 2400,
  18: 2500,
};

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly adminTelegramIds: number[];

  constructor(
    @InjectBot()
    private readonly bot: Telegraf,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Presentation)
    private readonly presentationRepository: Repository<Presentation>,
    private readonly configService: ConfigService,
  ) {
    this.adminTelegramIds = this.configService.get<number[]>('admin.telegramIds') || [];
  }

  getPriceForSlideCount(slideCount: number): number {
    return SLIDE_PRICES[slideCount] || 2000;
  }

  async findOrCreateUser(telegramUser: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  }): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { telegramId: telegramUser.id.toString() },
    });

    if (!user) {
      user = this.userRepository.create({
        telegramId: telegramUser.id.toString(),
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        credits: 2500, // Start with 2500 so'm
        language: 'uz',
      });
      await this.userRepository.save(user);
    } else {
      user.username = telegramUser.username || user.username;
      user.firstName = telegramUser.first_name || user.firstName;
      user.lastName = telegramUser.last_name || user.lastName;
      await this.userRepository.save(user);
    }

    return user;
  }

  async updateUserLanguage(
    telegramId: string,
    language: UserLanguage,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { telegramId },
    });

    if (user) {
      user.language = language;
      return this.userRepository.save(user);
    }

    return null;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { telegramId },
    });
  }

  async deductCredits(userId: number, amount: number = 1): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || user.credits < amount) {
      return false;
    }

    user.credits -= amount;
    await this.userRepository.save(user);
    return true;
  }

  async addCredits(userId: number, amount: number): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (user) {
      user.credits += amount;
      return this.userRepository.save(user);
    }

    return null;
  }

  async createPresentation(data: {
    userId: number;
    topic: string;
    studentName?: string;
    teacherName?: string;
    includeReja?: boolean;
    slideCount: number;
    theme: 'academic_blue' | 'minimal_white' | 'modern_dark';
    language: SupportedLanguage;
  }): Promise<Presentation> {
    const presentation = this.presentationRepository.create({
      userId: data.userId,
      topic: data.topic,
      studentName: data.studentName,
      teacherName: data.teacherName,
      includeReja: data.includeReja || false,
      slideCount: data.slideCount,
      theme: data.theme,
      language: data.language,
      status: 'pending',
    });

    return this.presentationRepository.save(presentation);
  }

  async getPresentationById(id: string): Promise<Presentation | null> {
    return this.presentationRepository.findOne({
      where: { id },
    });
  }

  async getUserPresentations(userId: number): Promise<Presentation[]> {
    return this.presentationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  getI18n(language: UserLanguage): I18nService {
    return new I18nService(language);
  }

  async forwardPaymentToAdmin(ctx: Context, user: User): Promise<void> {
    const message = ctx.message;
    if (!message || !('photo' in message)) return;

    const photo = message.photo;
    const largestPhoto = photo[photo.length - 1];

    for (const adminId of this.adminTelegramIds) {
      try {
        await this.bot.telegram.sendPhoto(adminId, largestPhoto.file_id, {
          caption: `💳 <b>Yangi to'lov</b>\n\n👤 User: ${user.firstName || 'Unknown'} (@${user.username || 'N/A'})\n🆔 ID: ${user.id}\n📱 Telegram ID: ${user.telegramId}\n💰 Hozirgi balans: ${user.credits} so'm\n\n⏰ ${new Date().toLocaleString('uz-UZ')}`,
          parse_mode: 'HTML',
          reply_markup: InlineKeyboards.adminApprovePayment(user.id, 0),
        });
      } catch (error) {
        this.logger.error(`Failed to forward payment to admin ${adminId}:`, error);
      }
    }
  }

  async addCreditsById(userId: number, amount: number): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (user) {
      user.credits += amount;
      await this.userRepository.save(user);

      // Notify user
      try {
        const i18n = this.getI18n(user.language);
        await this.bot.telegram.sendMessage(
          user.telegramId,
          `✅ <b>Balans to'ldirildi!</b>\n\n💰 Qo'shildi: +${amount} so'm\n💳 Yangi balans: ${user.credits} so'm\n\nRahmat! 🙏`,
          { parse_mode: 'HTML' },
        );
      } catch (error) {
        this.logger.error(`Failed to notify user ${userId}:`, error);
      }

      return user;
    }

    return null;
  }

  async getUserById(userId: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
    });
  }

  isAdmin(telegramId: string): boolean {
    return this.adminTelegramIds.includes(parseInt(telegramId, 10));
  }

  async findUserByUsernameOrTelegramId(identifier: string): Promise<User | null> {
    // First try to find by username
    let user = await this.userRepository.findOne({
      where: { username: identifier },
    });

    if (user) return user;

    // Try to find by telegram ID
    user = await this.userRepository.findOne({
      where: { telegramId: identifier },
    });

    return user;
  }
}
