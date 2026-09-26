import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import axios from 'axios';
import { User } from '../database/entities/user.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { Presentation } from '../database/entities/presentation.entity';
import { GeneratedDocument } from '../database/entities/document.entity';
import { FlashcardSet } from '../database/entities/flashcard-set.entity';
import { GlossarySet } from '../database/entities/glossary-set.entity';
import { CrosswordSet } from '../database/entities/crossword-set.entity';
import { Resume } from '../database/entities/resume.entity';
import { Quiz } from '../database/entities/quiz.entity';

// Asia/Tashkent is UTC+5 year-round (no DST).
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
const MONTHS_UZ = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];

@Injectable()
export class DailyReportService {
  private readonly logger = new Logger(DailyReportService.name);
  private readonly botToken: string;
  private readonly groupId: string;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Presentation)
    private readonly presentationRepository: Repository<Presentation>,
    @InjectRepository(GeneratedDocument)
    private readonly documentRepository: Repository<GeneratedDocument>,
    @InjectRepository(FlashcardSet)
    private readonly flashcardRepository: Repository<FlashcardSet>,
    @InjectRepository(GlossarySet)
    private readonly glossaryRepository: Repository<GlossarySet>,
    @InjectRepository(CrosswordSet)
    private readonly crosswordRepository: Repository<CrosswordSet>,
    @InjectRepository(Resume)
    private readonly resumeRepository: Repository<Resume>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
  ) {
    this.botToken = this.config.get<string>('telegram.botToken') || '';
    this.groupId = this.config.get<string>('telegram.dailyReportGroupId') || '';
  }

  /** Every day at 09:00 Asia/Tashkent, report on the previous calendar day. */
  @Cron('0 9 * * *', { timeZone: 'Asia/Tashkent' })
  async handleDailyReport(): Promise<void> {
    if (!this.botToken || !this.groupId) {
      this.logger.warn('Daily report skipped: bot token or group id not set');
      return;
    }
    try {
      await this.sendDailyReport();
    } catch (err) {
      // Logger.error is forwarded to the error group by TelegramLogger.
      this.logger.error('Daily report failed', err as Error);
    }
  }

  /** Yesterday's window [start, end) in real UTC, for Asia/Tashkent days. */
  private getYesterdayRange(): { start: Date; end: Date; label: string } {
    const nowTashkent = new Date(Date.now() + TASHKENT_OFFSET_MS);
    const y = nowTashkent.getUTCFullYear();
    const m = nowTashkent.getUTCMonth();
    const d = nowTashkent.getUTCDate();
    // Today 00:00 Tashkent expressed in real UTC.
    const todayStart = new Date(Date.UTC(y, m, d) - TASHKENT_OFFSET_MS);
    const start = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const end = todayStart;
    // Label the day being reported (yesterday, Tashkent local).
    const yst = new Date(start.getTime() + TASHKENT_OFFSET_MS);
    const label = `${yst.getUTCDate()}-${MONTHS_UZ[yst.getUTCMonth()]} ${yst.getUTCFullYear()}`;
    return { start, end, label };
  }

  /** Count rows per userId within [start, end) for one feature table. */
  private async countByUser(
    repo: Repository<any>,
    start: Date,
    end: Date,
    into: Map<number, number>,
  ): Promise<void> {
    const rows = await repo
      .createQueryBuilder('e')
      .select('e.userId', 'userId')
      .addSelect('COUNT(*)', 'cnt')
      .where('e.createdAt >= :start AND e.createdAt < :end', { start, end })
      .groupBy('e.userId')
      .getRawMany();
    rows.forEach((r) => {
      const id = Number(r.userId);
      into.set(id, (into.get(id) || 0) + Number(r.cnt));
    });
  }

  /** Build and send the report for the previous day. Returns a short status. */
  async sendDailyReport(): Promise<string> {
    const { start, end, label } = this.getYesterdayRange();

    // Usage per user across every content feature.
    const usage = new Map<number, number>();
    await Promise.all([
      this.countByUser(this.presentationRepository, start, end, usage),
      this.countByUser(this.documentRepository, start, end, usage),
      this.countByUser(this.flashcardRepository, start, end, usage),
      this.countByUser(this.glossaryRepository, start, end, usage),
      this.countByUser(this.crosswordRepository, start, end, usage),
      this.countByUser(this.resumeRepository, start, end, usage),
      this.countByUser(this.quizRepository, start, end, usage),
    ]);

    // Translator has no entity — count its usage transactions.
    const trRows = await this.transactionRepository
      .createQueryBuilder('t')
      .select('t.userId', 'userId')
      .addSelect('COUNT(*)', 'cnt')
      .where('t.createdAt >= :start AND t.createdAt < :end', { start, end })
      .andWhere('t.type = :type', { type: 'usage' })
      .andWhere('t.description LIKE :d', { d: 'feature:translator%' })
      .groupBy('t.userId')
      .getRawMany();
    trRows.forEach((r) => {
      const id = Number(r.userId);
      usage.set(id, (usage.get(id) || 0) + Number(r.cnt));
    });

    const peopleCount = usage.size;
    const totalGenerations = [...usage.values()].reduce((a, b) => a + b, 0);

    // Money that came in yesterday (approved top-ups).
    const topups = await this.transactionRepository.find({
      where: { createdAt: Between(start, end), status: 'approved', type: 'topup' },
    });
    const income = topups.reduce((s, t) => s + (t.amount || 0), 0);

    // Top 50 users by usage count.
    const topEntries = [...usage.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);
    const topIds = topEntries.map(([id]) => id);
    const users = topIds.length
      ? await this.userRepository.findBy({ id: In(topIds) })
      : [];
    const userById = new Map(users.map((u) => [u.id, u]));

    const money = new Intl.NumberFormat('uz-UZ').format(income);

    const lines: string[] = [];
    lines.push(`📊 <b>Kunlik hisobot</b> — ${label}`);
    lines.push('');
    lines.push(`👥 Ishlatgan odamlar: <b>${peopleCount}</b> ta`);
    lines.push(`🧾 Jami yaratilgan: <b>${totalGenerations}</b> ta`);
    lines.push(`💰 Tushgan pul: <b>${money}</b> so'm`);

    if (topEntries.length) {
      lines.push('');
      lines.push(`🏆 <b>Top ${topEntries.length} (eng ko'p ishlatgan)</b>:`);
      topEntries.forEach(([id, cnt], i) => {
        const u = userById.get(id);
        const name = this.escapeHtml(
          [u?.firstName, u?.lastName].filter(Boolean).join(' ') || 'Nomaʼlum',
        );
        const handle = u?.username
          ? `@${u.username}`
          : `<code>${u?.telegramId ?? id}</code>`;
        lines.push(`${i + 1}. ${name} — ${handle} — <b>${cnt}</b> ta`);
      });
    } else {
      lines.push('');
      lines.push('Kecha hech kim ishlatmadi.');
    }

    await this.send(lines.join('\n'));
    this.logger.log(
      `Daily report sent: ${peopleCount} users, ${totalGenerations} generations, ${income} so'm`,
    );
    return `${peopleCount} ta odam, ${totalGenerations} ta natija, ${money} so'm`;
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private async send(text: string): Promise<void> {
    // Telegram hard-caps messages at 4096 chars; trim defensively.
    const body = text.length > 4000 ? text.slice(0, 3990) + '\n…' : text;
    await axios.post(
      `https://api.telegram.org/bot${this.botToken}/sendMessage`,
      {
        chat_id: this.groupId,
        text: body,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      },
      { timeout: 15000 },
    );
  }
}
