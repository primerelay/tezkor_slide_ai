import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';
import { User, UserLanguage } from '../database/entities/user.entity';
import { Presentation } from '../database/entities/presentation.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { I18nService, SupportedLanguage } from '../common/i18n/i18n.service';
import { InlineKeyboards } from './keyboards/inline.keyboards';
import { ConfigService } from '@nestjs/config';
import { PresentationTheme } from '../renderer/themes/theme-registry';
import { QuizService } from '../quiz/quiz.service';
import { CreateQuizDto } from '../quiz/dto/create-quiz.dto';

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
  private readonly requiredChannelUsername: string;
  private readonly requiredChannelUrl: string;
  // Short-lived cache so tapping several buttons doesn't hit the Telegram API
  // for the same membership check each time. Membership rarely changes in 60s.
  private readonly membershipCache = new Map<string, { member: boolean; expires: number }>();
  private static readonly MEMBERSHIP_TTL_MS = 60_000;

  constructor(
    @InjectBot()
    private readonly bot: Telegraf,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Presentation)
    private readonly presentationRepository: Repository<Presentation>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => QuizService))
    private readonly quizService: QuizService,
  ) {
    this.adminTelegramIds = this.configService.get<number[]>('admin.telegramIds') || [];
    this.requiredChannelUsername = this.configService.get<string>('requiredChannel.username') || '';
    this.requiredChannelUrl = this.configService.get<string>('requiredChannel.url') || '';
  }

  /**
   * Check if user is a member of the required channel
   */
  async isChannelMember(telegramId: string | number): Promise<boolean> {
    if (!this.requiredChannelUsername) {
      return true; // No channel required
    }

    const key = String(telegramId);
    const cached = this.membershipCache.get(key);
    const now = Date.now();
    if (cached && cached.expires > now) {
      return cached.member;
    }

    try {
      const chatMember = await this.bot.telegram.getChatMember(
        `@${this.requiredChannelUsername}`,
        Number(telegramId),
      );

      // User is a member if status is 'member', 'administrator', or 'creator'
      const member = ['member', 'administrator', 'creator'].includes(chatMember.status);
      this.membershipCache.set(key, { member, expires: now + TelegramService.MEMBERSHIP_TTL_MS });
      return member;
    } catch (error) {
      this.logger.warn(`Failed to check channel membership for ${telegramId}:`, error);
      return false;
    }
  }

  /** Drop a cached membership result (e.g. right after the user joins). */
  invalidateMembership(telegramId: string | number): void {
    this.membershipCache.delete(String(telegramId));
  }

  /**
   * Get required channel info
   */
  getRequiredChannel(): { username: string; url: string } | null {
    if (!this.requiredChannelUsername) {
      return null;
    }
    return {
      username: this.requiredChannelUsername,
      url: this.requiredChannelUrl || `https://t.me/${this.requiredChannelUsername}`,
    };
  }

  getPriceForSlideCount(slideCount: number): number {
    return SLIDE_PRICES[slideCount] || 2000;
  }

  async findOrCreateUser(
    telegramUser: {
      id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    },
    referrerId?: number,
  ): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { telegramId: telegramUser.id.toString() },
    });

    if (!user) {
      // Generate unique referral code
      const referralCode = `ref_${telegramUser.id}_${Math.random().toString(36).substring(2, 10)}`;

      user = this.userRepository.create({
        telegramId: telegramUser.id.toString(),
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        credits: 2500, // Start with 2500 so'm
        language: 'uz',
        referralCode,
        referredBy: referrerId,
      });
      await this.userRepository.save(user);
    } else {
      user.username = telegramUser.username || user.username;
      user.firstName = telegramUser.first_name || user.firstName;
      user.lastName = telegramUser.last_name || user.lastName;

      // Generate referral code if doesn't exist
      if (!user.referralCode) {
        user.referralCode = `ref_${telegramUser.id}_${Math.random().toString(36).substring(2, 10)}`;
      }

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

  /** Send a generated presentation file to a user's Telegram chat. */
  async sendDocumentToUser(
    telegramId: string,
    filePath: string,
    caption: string,
    filename: string,
  ): Promise<void> {
    await this.bot.telegram.sendDocument(
      telegramId,
      { source: filePath, filename },
      { caption, parse_mode: 'HTML' },
    );
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
    theme: PresentationTheme;
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

  async createQuiz(data: CreateQuizDto & { userId: number }) {
    return this.quizService.createQuiz(data.userId, data);
  }

  getMiniAppUrl(): string | undefined {
    return this.configService.get<string>('MINI_APP_URL');
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

  async addCreditsById(userId: number, amount: number, description?: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (user) {
      user.credits += amount;
      await this.userRepository.save(user);

      // Create transaction record for income tracking
      const transaction = this.transactionRepository.create({
        userId: user.id,
        type: 'topup',
        amount: amount,
        status: 'approved',
        description: description || 'Admin tomonidan qo\'shildi',
      });
      await this.transactionRepository.save(transaction);

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

  /**
   * Send Quiz Bot creation request to admin
   */
  async sendQuizBotRequestToAdmin(user: User): Promise<void> {
    const i18n = this.getI18n(user.language);

    const message = i18n.t('quizBot.adminNotification', {
      name: user.firstName || 'N/A',
      username: user.username || 'N/A',
      telegramId: user.telegramId,
    });

    for (const adminId of this.adminTelegramIds) {
      try {
        await this.bot.telegram.sendMessage(adminId, message, {
          parse_mode: 'HTML',
        });
      } catch (error) {
        this.logger.error(`Failed to send Quiz Bot request to admin ${adminId}:`, error);
      }
    }
  }

  /**
   * Get referral link for a user
   */
  getReferralLink(user: User): string {
    const botUsername = this.configService.get<string>('telegram.botUsername');
    if (!botUsername) {
      this.logger.warn('TELEGRAM_BOT_USERNAME not set in environment variables');
      return `https://t.me/YOUR_BOT?start=${user.referralCode}`;
    }
    return `https://t.me/${botUsername}?start=${user.referralCode}`;
  }

  /**
   * Build a shareable deep link that opens the bot and displays a flashcard set.
   */
  getFlashcardShareLink(setId: number): string {
    const botUsername = this.configService.get<string>('telegram.botUsername');
    if (!botUsername) {
      return `https://t.me/YOUR_BOT?start=fc_${setId}`;
    }
    return `https://t.me/${botUsername}?start=fc_${setId}`;
  }

  /**
   * Find user by referral code
   */
  async getUserByReferralCode(referralCode: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { referralCode },
    });
  }

  /**
   * Get referral statistics for a user
   */
  async getReferralStats(userId: number): Promise<{
    referralCount: number;
    totalEarned: number;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return { referralCount: 0, totalEarned: 0 };
    }

    // Each successful referral earns 1000 som
    const totalEarned = user.referralCount * 1000;

    return {
      referralCount: user.referralCount,
      totalEarned,
    };
  }
}
