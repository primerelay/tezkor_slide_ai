import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Sends application errors to a Telegram group so the team sees failures
 * (generation errors, provider/subscription outages, unexpected crashes)
 * in real time. Deduped + rate-limited so an error storm can't flood the group.
 *
 * Enabled only when TELEGRAM_BOT_TOKEN and ERROR_LOG_GROUP_ID are set.
 */
@Injectable()
export class ErrorReporterService {
  private readonly botToken: string;
  private readonly groupId: string;

  // Last time a given error signature was sent — collapses repeats.
  private readonly lastSent = new Map<string, number>();
  private windowStart = 0;
  private windowCount = 0;

  private static readonly DEDUPE_MS = 60_000;
  private static readonly WINDOW_MS = 60_000;
  private static readonly MAX_PER_WINDOW = 15;

  constructor(private readonly config: ConfigService) {
    this.botToken = this.config.get<string>('telegram.botToken') || '';
    this.groupId = this.config.get<string>('telegram.errorGroupId') || '';
  }

  get enabled(): boolean {
    return Boolean(this.botToken && this.groupId);
  }

  /** Report an error. Never throws and never blocks the caller. */
  report(source: string, error: unknown): void {
    if (!this.enabled) return;
    try {
      const now = Date.now();
      const raw = this.errorText(error);
      const key = `${source}:${raw.slice(0, 200)}`;

      // Collapse identical errors seen within DEDUPE_MS.
      const last = this.lastSent.get(key);
      if (last && now - last < ErrorReporterService.DEDUPE_MS) return;
      this.lastSent.set(key, now);
      if (this.lastSent.size > 500) this.lastSent.clear();

      // Global cap so a burst can't spam the group.
      if (now - this.windowStart > ErrorReporterService.WINDOW_MS) {
        this.windowStart = now;
        this.windowCount = 0;
      }
      this.windowCount++;
      if (this.windowCount > ErrorReporterService.MAX_PER_WINDOW) return;

      void this.send(this.format(source, raw));
    } catch {
      // Reporting must never break the app.
    }
  }

  private async send(text: string): Promise<void> {
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: this.groupId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        },
        { timeout: 10_000 },
      );
    } catch (e) {
      // Use console directly — NOT the Nest logger — to avoid a feedback loop.
      // eslint-disable-next-line no-console
      console.error('[ErrorReporter] failed to send:', (e as Error)?.message);
    }
  }

  private errorText(error: unknown): string {
    if (error instanceof Error) return error.stack || error.message;
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  private format(source: string, raw: string): string {
    const time = new Date().toISOString();
    const body = this.escape(raw).slice(0, 3500);
    return `🚨 <b>Xatolik</b> — <code>${this.escape(source)}</code>\n🕒 ${time}\n\n<pre>${body}</pre>`;
  }

  private escape(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
