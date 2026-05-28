import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserLanguage } from '../database/entities/user.entity';
import { Presentation } from '../database/entities/presentation.entity';
import { I18nService } from '../common/i18n/i18n.service';

@Injectable()
export class TelegramService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Presentation)
    private readonly presentationRepository: Repository<Presentation>,
  ) {}

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
        credits: 3,
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
    slideCount: number;
    theme: 'academic_blue' | 'minimal_white' | 'modern_dark';
    language: 'uz' | 'ru' | 'en';
  }): Promise<Presentation> {
    const presentation = this.presentationRepository.create({
      userId: data.userId,
      topic: data.topic,
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
}
