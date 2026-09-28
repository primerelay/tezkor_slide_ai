import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Transaction } from '../database/entities/transaction.entity';

// Asia/Tashkent is UTC+5 year-round (no DST).
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

// Per-day reward ranges (so'm). Index 0 = day 1 … index 6 = day 7 (big chest).
const DAY_RANGES: Array<[number, number]> = [
  [500, 1000],
  [700, 1200],
  [900, 1400],
  [1100, 1600],
  [1300, 1800],
  [1500, 2000],
  [2500, 5000],
];
const JACKPOT_AMOUNT = 3000;
const JACKPOT_CHANCE = 0.04; // days 1–6 only

export interface DailyGiftStatus {
  day: number; // 1..7 — the day being (or that was) claimed today
  streak: number;
  claimable: boolean; // false if already claimed today
  claimedToday: boolean;
  min: number;
  max: number;
  jackpot: number;
  balance: number;
}

export interface DailyGiftClaim {
  reward: number;
  isJackpot: boolean;
  day: number;
  streak: number;
  balance: number;
  boxes: number[]; // the 3 box values; chosen index holds `reward`
}

@Injectable()
export class DailyGiftService {
  private readonly logger = new Logger(DailyGiftService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  /** YYYY-MM-DD in Asia/Tashkent for a given instant. */
  private dayKey(d: Date): string {
    return new Date(d.getTime() + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);
  }

  /** Which streak-day a claim right now would count as. */
  private computeDay(user: User, now: Date): number {
    if (!user.lastDailyClaimAt) return 1;
    const lastKey = this.dayKey(new Date(user.lastDailyClaimAt));
    const yesterdayKey = this.dayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    if (lastKey === yesterdayKey) {
      // Continued the streak: advance, cycling back to 1 after day 7.
      return user.dailyStreak >= 7 ? 1 : user.dailyStreak + 1;
    }
    // Skipped one or more days → restart.
    return 1;
  }

  private randReward(min: number, max: number): number {
    const raw = min + Math.random() * (max - min);
    return Math.round(raw / 50) * 50; // round to nearest 50 so'm
  }

  async getStatus(telegramId: string): Promise<DailyGiftStatus> {
    const user = await this.userRepository.findOne({ where: { telegramId } });
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    const todayKey = this.dayKey(now);
    const lastKey = user.lastDailyClaimAt ? this.dayKey(new Date(user.lastDailyClaimAt)) : null;
    const claimedToday = lastKey === todayKey;

    const day = claimedToday ? user.dailyStreak || 1 : this.computeDay(user, now);
    const [min, max] = DAY_RANGES[day - 1];

    return {
      day,
      streak: user.dailyStreak,
      claimable: !claimedToday,
      claimedToday,
      min,
      max,
      jackpot: JACKPOT_AMOUNT,
      balance: user.credits,
    };
  }

  async claim(telegramId: string, boxIndex: number): Promise<DailyGiftClaim> {
    const user = await this.userRepository.findOne({ where: { telegramId } });
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    const todayKey = this.dayKey(now);
    const lastKey = user.lastDailyClaimAt ? this.dayKey(new Date(user.lastDailyClaimAt)) : null;
    if (lastKey === todayKey) {
      throw new Error('Bugungi sovg\'a allaqachon olingan');
    }

    const day = this.computeDay(user, now);
    const [min, max] = DAY_RANGES[day - 1];
    const idx = Math.max(0, Math.min(2, Math.floor(boxIndex)));

    // Reward for the chosen box.
    let isJackpot = false;
    let reward: number;
    if (day < 7 && Math.random() < JACKPOT_CHANCE) {
      reward = JACKPOT_AMOUNT;
      isJackpot = true;
    } else {
      reward = this.randReward(min, max);
    }

    // Fill the three boxes; the chosen one holds the actual reward.
    const boxes = [0, 1, 2].map(() => this.randReward(min, max));
    boxes[idx] = reward;

    // Credit the user and advance the streak.
    user.credits += reward;
    user.dailyStreak = day;
    user.lastDailyClaimAt = now;
    await this.userRepository.save(user);

    await this.transactionRepository.save(
      this.transactionRepository.create({
        userId: user.id,
        type: 'bonus',
        amount: reward,
        status: 'approved',
        description: `Kunlik sovg'a (kun ${day})${isJackpot ? ' — JACKPOT' : ''}`,
      }),
    );

    this.logger.log(
      `Daily gift: user ${user.id} day ${day} won ${reward}${isJackpot ? ' (jackpot)' : ''}`,
    );

    return { reward, isJackpot, day, streak: day, balance: user.credits, boxes };
  }
}
