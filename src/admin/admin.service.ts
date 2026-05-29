import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Between } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Admin } from './admin.entity';
import { User } from '../database/entities/user.entity';
import { Presentation } from '../database/entities/presentation.entity';
import { Transaction } from '../database/entities/transaction.entity';

export type DateFilter = '7d' | '1m' | '2m' | '1y' | 'all';

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
  ) {}

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
