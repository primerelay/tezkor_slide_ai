import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Between, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Admin } from './admin.entity';
import { User } from '../database/entities/user.entity';
import { Presentation } from '../database/entities/presentation.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { GeneratedDocument } from '../database/entities/document.entity';
import { FlashcardSet } from '../database/entities/flashcard-set.entity';
import { GlossarySet } from '../database/entities/glossary-set.entity';
import { CrosswordSet } from '../database/entities/crossword-set.entity';
import { Resume } from '../database/entities/resume.entity';
import { Quiz } from '../database/entities/quiz.entity';

export type DateFilter = '7d' | '1m' | '2m' | '1y' | 'all';

export interface FeatureStat {
  key: string;
  label: string;
  emoji: string;
  count: number;
  revenue: number; // so'm
  aiCost: number; // so'm
  profit: number; // so'm
}

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Presentation)
    private presentationRepository: Repository<Presentation>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(GeneratedDocument)
    private documentRepository: Repository<GeneratedDocument>,
    @InjectRepository(FlashcardSet)
    private flashcardRepository: Repository<FlashcardSet>,
    @InjectRepository(GlossarySet)
    private glossaryRepository: Repository<GlossarySet>,
    @InjectRepository(CrosswordSet)
    private crosswordRepository: Repository<CrosswordSet>,
    @InjectRepository(Resume)
    private resumeRepository: Repository<Resume>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
  ) {}

  private static readonly USD_TO_UZS = 12500;

  // Presentation pricing by slide count (so'm) — presentations don't store a
  // price column, so revenue is derived from the selected slide count.
  private static readonly SLIDE_PRICES: Record<number, number> = {
    6: 1000, 8: 1500, 10: 1700, 12: 2000, 14: 2200, 16: 2400, 18: 2500,
  };

  /**
   * Per-feature breakdown: usage count, revenue (so'm), AI cost (so'm) and
   * profit for every content feature, within the selected date range.
   */
  async getFeatureStats(filter: DateFilter): Promise<{
    features: FeatureStat[];
    totals: { count: number; revenue: number; aiCost: number; profit: number };
  }> {
    const { start } = this.getDateRange(filter);
    const rate = AdminService.USD_TO_UZS;

    // Generic aggregate: count + sum(revenue col) + sum(AI cost col, USD→so'm).
    // Uses find()+JS (like getStats) to avoid raw-SQL camelCase column pitfalls.
    const agg = async (
      repo: Repository<any>,
      revenueCol: string | null,
      aiCol: string | null,
      hasStatus = false,
    ) => {
      const where: any = { createdAt: MoreThanOrEqual(start) };
      // Queue-based features keep failed (refunded) rows — exclude them so
      // revenue only counts successful generations.
      if (hasStatus) where.status = 'completed';
      const rows = await repo.find({ where });
      let revenue = 0;
      let aiUsd = 0;
      rows.forEach((r: any) => {
        if (revenueCol) revenue += Number(r[revenueCol]) || 0;
        if (aiCol) aiUsd += Number(r[aiCol]) || 0;
      });
      return {
        count: rows.length,
        revenue: Math.round(revenue),
        aiCost: Math.round(aiUsd * rate),
      };
    };

    // Presentations: revenue derived from slide count in JS (completed only).
    const presRows = await this.presentationRepository.find({
      where: { createdAt: MoreThanOrEqual(start), status: 'completed' },
    });
    let presRevenue = 0;
    let presAiUsd = 0;
    presRows.forEach((p) => {
      presRevenue +=
        AdminService.SLIDE_PRICES[p.slideCount] ??
        Math.round((p.slideCount || 8) * 150);
      presAiUsd += Number(p.aiCost) || 0;
    });

    // Translator: no entity — counted from its usage transactions.
    const trRows = await this.transactionRepository.find({
      where: {
        createdAt: MoreThanOrEqual(start),
        type: 'usage',
        description: Like('feature:translator%'),
      },
    });
    const trCount = trRows.length;
    const trRevenue = trRows.reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const [doc, flash, gloss, cross, resume, quiz] = await Promise.all([
      agg(this.documentRepository, 'price', 'aiCost', true),
      agg(this.flashcardRepository, 'price', 'generationCost', true),
      agg(this.glossaryRepository, 'price', 'generationCost'),
      agg(this.crosswordRepository, 'price', 'generationCost'),
      agg(this.resumeRepository, 'price', 'generationCost'),
      agg(this.quizRepository, null, 'generationCost', true),
    ]);

    const features: FeatureStat[] = [
      { key: 'presentation', label: 'Slaydlar', emoji: '📊', count: presRows.length, revenue: presRevenue, aiCost: Math.round(presAiUsd * rate), profit: 0 },
      { key: 'document', label: 'Hujjatlar', emoji: '📄', count: doc.count, revenue: doc.revenue, aiCost: doc.aiCost, profit: 0 },
      { key: 'flashcard', label: 'Flesh kartalar', emoji: '🎴', count: flash.count, revenue: flash.revenue, aiCost: flash.aiCost, profit: 0 },
      { key: 'glossary', label: 'Glossary', emoji: '📖', count: gloss.count, revenue: gloss.revenue, aiCost: gloss.aiCost, profit: 0 },
      { key: 'crossword', label: 'Krossvord', emoji: '🧩', count: cross.count, revenue: cross.revenue, aiCost: cross.aiCost, profit: 0 },
      { key: 'resume', label: 'Rezyume', emoji: '📇', count: resume.count, revenue: resume.revenue, aiCost: resume.aiCost, profit: 0 },
      { key: 'quiz', label: 'Quiz', emoji: '🧠', count: quiz.count, revenue: quiz.revenue, aiCost: quiz.aiCost, profit: 0 },
      { key: 'translator', label: 'Tarjimon', emoji: '🌍', count: trCount, revenue: Math.round(trRevenue), aiCost: 0, profit: 0 },
    ];
    features.forEach((f) => (f.profit = f.revenue - f.aiCost));
    features.sort((a, b) => b.revenue - a.revenue);

    const totals = features.reduce(
      (acc, f) => ({
        count: acc.count + f.count,
        revenue: acc.revenue + f.revenue,
        aiCost: acc.aiCost + f.aiCost,
        profit: acc.profit + f.profit,
      }),
      { count: 0, revenue: 0, aiCost: 0, profit: 0 },
    );

    return { features, totals };
  }

  async onModuleInit() {
    // Create or update default admin from env
    const adminPhone = process.env.ADMIN_PHONE || '998901234567';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Admin';

    const existingAdmin = await this.adminRepository.findOne({ where: { phone: adminPhone } });

    if (!existingAdmin) {
      // Create new admin
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await this.adminRepository.save({
        phone: adminPhone,
        password: hashedPassword,
        name: adminName,
      });
      console.log(`Default admin created: phone=${adminPhone}`);
    } else {
      // Update password if ADMIN_PASSWORD is set in env (not default)
      if (process.env.ADMIN_PASSWORD) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await this.adminRepository.update(existingAdmin.id, {
          password: hashedPassword,
          name: adminName,
        });
        console.log(`Admin password updated for phone=${adminPhone}`);
      }
    }
  }

  private getJwtSecret(): string {
    return process.env.JWT_SECRET || 'tezkor-slide-secret-key-change-in-production';
  }

  async login(phone: string, password: string): Promise<{ token: string; admin: Partial<Admin> }> {
    const cleanPhone = phone.replace(/\D/g, '');
    const admin = await this.adminRepository.findOne({ where: { phone: cleanPhone } });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Telefon raqam yoki parol noto\'g\'ri');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Telefon raqam yoki parol noto\'g\'ri');
    }

    const token = jwt.sign(
      { id: admin.id, phone: admin.phone },
      this.getJwtSecret(),
      { expiresIn: '7d' },
    );

    return {
      token,
      admin: { id: admin.id, phone: admin.phone, name: admin.name },
    };
  }

  async verifyToken(token: string): Promise<{ admin: Partial<Admin> }> {
    try {
      const decoded = jwt.verify(token, this.getJwtSecret()) as { id: number };
      const admin = await this.adminRepository.findOne({ where: { id: decoded.id } });

      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Invalid token');
      }

      return { admin: { id: admin.id, phone: admin.phone, name: admin.name } };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private getDateRange(filter: DateFilter): { start: Date; end: Date } {
    const end = new Date();
    let start = new Date();

    switch (filter) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '1m':
        start.setMonth(start.getMonth() - 1);
        break;
      case '2m':
        start.setMonth(start.getMonth() - 2);
        break;
      case '1y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      case 'all':
        start = new Date('2020-01-01');
        break;
    }

    return { start, end };
  }

  private getPreviousDateRange(filter: DateFilter): { start: Date; end: Date } {
    const current = this.getDateRange(filter);
    const diff = current.end.getTime() - current.start.getTime();

    return {
      start: new Date(current.start.getTime() - diff),
      end: current.start,
    };
  }

  async getStats(filter: DateFilter) {
    const { start, end } = this.getDateRange(filter);
    const previous = this.getPreviousDateRange(filter);

    // Current period stats
    const [totalUsers, totalPresentations, presentations, transactions] = await Promise.all([
      this.userRepository.count({ where: { createdAt: MoreThanOrEqual(start) } }),
      this.presentationRepository.count({ where: { createdAt: MoreThanOrEqual(start) } }),
      this.presentationRepository.find({ where: { createdAt: MoreThanOrEqual(start) } }),
      this.transactionRepository.find({
        where: {
          createdAt: MoreThanOrEqual(start),
          status: 'approved',
          type: 'topup'
        }
      }),
    ]);

    // Previous period stats for comparison
    const [prevUsers, prevPresentations, prevTransactions] = await Promise.all([
      this.userRepository.count({ where: { createdAt: Between(previous.start, previous.end) } }),
      this.presentationRepository.count({ where: { createdAt: Between(previous.start, previous.end) } }),
      this.transactionRepository.find({
        where: {
          createdAt: Between(previous.start, previous.end),
          status: 'approved',
          type: 'topup'
        }
      }),
    ]);

    // Calculate real income from approved topup transactions
    let totalIncome = 0;
    transactions.forEach((t) => {
      totalIncome += t.amount || 0;
    });

    let prevIncome = 0;
    prevTransactions.forEach((t) => {
      prevIncome += t.amount || 0;
    });

    // Calculate real AI costs from presentations
    let totalAiCost = 0;
    let totalSlides = 0;
    presentations.forEach((p) => {
      // aiCost is stored as decimal, convert to number
      totalAiCost += Number(p.aiCost) || 0;
      totalSlides += p.slideCount || 0;
    });

    // Convert AI cost from dollars to so'm (approximate rate)
    const usdToUzs = 12500; // 1 USD ≈ 12,500 so'm
    const totalAiCostUzs = Math.round(totalAiCost * usdToUzs);

    const profit = totalIncome - totalAiCostUzs;

    // Calculate growth percentages
    const userGrowth = prevUsers > 0 ? Math.round(((totalUsers - prevUsers) / prevUsers) * 100) : (totalUsers > 0 ? 100 : 0);
    const presentationGrowth = prevPresentations > 0 ? Math.round(((totalPresentations - prevPresentations) / prevPresentations) * 100) : (totalPresentations > 0 ? 100 : 0);
    const incomeGrowth = prevIncome > 0 ? Math.round(((totalIncome - prevIncome) / prevIncome) * 100) : (totalIncome > 0 ? 100 : 0);

    // Get total counts (all time)
    const [allUsers, allPresentations] = await Promise.all([
      this.userRepository.count(),
      this.presentationRepository.count(),
    ]);

    return {
      totalUsers: filter === 'all' ? allUsers : totalUsers,
      totalPresentations: filter === 'all' ? allPresentations : totalPresentations,
      totalSlides,
      totalIncome,
      totalAiCost: totalAiCostUzs,
      profit,
      userGrowth,
      presentationGrowth,
      incomeGrowth,
    };
  }

  async getChartData(filter: DateFilter) {
    const { start, end } = this.getDateRange(filter);
    const data: any[] = [];

    let interval: 'day' | 'week' | 'month' = 'day';
    if (filter === '1y' || filter === 'all') {
      interval = 'month';
    } else if (filter === '2m') {
      interval = 'week';
    }

    const usdToUzs = 12500;
    const current = new Date(start);

    while (current <= end) {
      const dateStr = this.formatDate(current, interval);
      const nextDate = this.getNextDate(current, interval);

      // Get real data for this period
      const [users, presentations, transactions] = await Promise.all([
        this.userRepository.count({
          where: { createdAt: Between(current, nextDate) },
        }),
        this.presentationRepository.find({
          where: { createdAt: Between(current, nextDate) },
        }),
        this.transactionRepository.find({
          where: {
            createdAt: Between(current, nextDate),
            status: 'approved',
            type: 'topup'
          },
        }),
      ]);

      // Calculate real income
      let income = 0;
      transactions.forEach((t) => {
        income += t.amount || 0;
      });

      // Calculate real AI cost
      let aiCost = 0;
      presentations.forEach((p) => {
        aiCost += Number(p.aiCost) || 0;
      });
      const aiCostUzs = Math.round(aiCost * usdToUzs);

      data.push({
        date: dateStr,
        income,
        presentations: presentations.length,
        users,
        aiCost: aiCostUzs,
      });

      current.setTime(nextDate.getTime());
    }

    return data;
  }

  private formatDate(date: Date, interval: 'day' | 'week' | 'month'): string {
    const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

    if (interval === 'month') {
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    } else if (interval === 'week') {
      return `${date.getDate()} ${months[date.getMonth()]}`;
    } else {
      return `${date.getDate()} ${months[date.getMonth()]}`;
    }
  }

  private getNextDate(date: Date, interval: 'day' | 'week' | 'month'): Date {
    const next = new Date(date);
    if (interval === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (interval === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  async getRecentPresentations(limit: number) {
    const presentations = await this.presentationRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });

    return presentations.map((p) => ({
      id: p.id,
      title: p.topic,
      userName: p.user?.firstName || 'Unknown',
      createdAt: this.formatRelativeTime(p.createdAt),
      slidesCount: p.slideCount || 0,
    }));
  }

  async getRecentUsers(limit: number) {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });

    // Get presentation counts
    const result = await Promise.all(
      users.map(async (user) => {
        const count = await this.presentationRepository.count({
          where: { user: { id: user.id } },
        });
        return {
          id: user.id,
          firstName: user.firstName,
          telegramId: user.telegramId.toString(),
          language: user.language,
          credits: user.credits,
          createdAt: this.formatRelativeTime(user.createdAt),
          presentationsCount: count,
        };
      }),
    );

    return result;
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} daqiqa oldin`;
    if (hours < 24) return `${hours} soat oldin`;
    if (days < 7) return `${days} kun oldin`;
    return date.toLocaleDateString('uz-UZ');
  }

  // Admin management methods
  async createAdmin(phone: string, password: string, name: string): Promise<Admin> {
    const cleanPhone = phone.replace(/\D/g, '');
    const existing = await this.adminRepository.findOne({ where: { phone: cleanPhone } });

    if (existing) {
      throw new Error('Bu telefon raqam bilan admin mavjud');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = this.adminRepository.create({
      phone: cleanPhone,
      password: hashedPassword,
      name,
    });

    return this.adminRepository.save(admin);
  }

  async getAllAdmins(): Promise<Partial<Admin>[]> {
    const admins = await this.adminRepository.find();
    return admins.map(a => ({
      id: a.id,
      phone: a.phone,
      name: a.name,
      isActive: a.isActive,
      createdAt: a.createdAt,
    }));
  }

  async deactivateAdmin(adminId: number): Promise<void> {
    await this.adminRepository.update(adminId, { isActive: false });
  }

  async activateAdmin(adminId: number): Promise<void> {
    await this.adminRepository.update(adminId, { isActive: true });
  }
}
