import { Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';

export interface BroadcastResult {
  total: number;
  sent: number;
  blocked: number;
  failed: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);
  // ~22 msg/sec — safely under Telegram's ~30/sec broadcast limit.
  private static readonly SEND_INTERVAL_MS = 45;

  constructor(
    @InjectBot() private readonly bot: Telegraf,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  /** How many users a broadcast would reach (non-banned). */
  async countRecipients(): Promise<number> {
    return this.userRepository.count({ where: { isBanned: false } });
  }

  /**
   * Copy one message (text or photo+caption, formatting preserved) to every
   * non-banned user. Users who blocked the bot are skipped. Progress is pushed
   * to `adminChatId` every 100 recipients. Runs to completion; call without
   * awaiting to run it in the background.
   */
  async broadcast(
    fromChatId: number,
    messageId: number,
    adminChatId?: number | string,
  ): Promise<BroadcastResult> {
    const users = await this.userRepository.find({
      where: { isBanned: false },
      select: ['telegramId'],
    });
    const total = users.length;
    let sent = 0;
    let blocked = 0;
    let failed = 0;

    for (const user of users) {
      const ok = await this.copyOnce(user.telegramId, fromChatId, messageId);
      if (ok === 'sent') sent++;
      else if (ok === 'blocked') blocked++;
      else failed++;

      const done = sent + blocked + failed;
      if (adminChatId && done % 100 === 0 && done < total) {
        this.bot.telegram
          .sendMessage(adminChatId, `⏳ ${done}/${total} yuborildi...`)
          .catch(() => undefined);
      }

      await sleep(BroadcastService.SEND_INTERVAL_MS);
    }

    const result: BroadcastResult = { total, sent, blocked, failed };
    this.logger.log(
      `Broadcast done: ${sent} sent, ${blocked} blocked, ${failed} failed of ${total}`,
    );

    if (adminChatId) {
      this.bot.telegram
        .sendMessage(
          adminChatId,
          `✅ E'lon yakunlandi.\n\n` +
            `📨 Yuborildi: ${sent}\n` +
            `🚫 Bloklagan: ${blocked}\n` +
            `⚠️ Xato: ${failed}\n` +
            `👥 Jami: ${total}`,
        )
        .catch(() => undefined);
    }

    return result;
  }

  /** Send once; on 429 wait retry_after and retry a single time. */
  private async copyOnce(
    chatId: string,
    fromChatId: number,
    messageId: number,
  ): Promise<'sent' | 'blocked' | 'failed'> {
    try {
      await this.bot.telegram.copyMessage(chatId, fromChatId, messageId);
      return 'sent';
    } catch (err: any) {
      const code = err?.response?.error_code ?? err?.code;
      // 403: user blocked the bot / deactivated account — expected, skip.
      if (code === 403) return 'blocked';
      // 429: rate limited — honour retry_after once.
      if (code === 429) {
        const retry = err?.response?.parameters?.retry_after ?? 1;
        await sleep((retry + 1) * 1000);
        try {
          await this.bot.telegram.copyMessage(chatId, fromChatId, messageId);
          return 'sent';
        } catch {
          return 'failed';
        }
      }
      return 'failed';
    }
  }
}
