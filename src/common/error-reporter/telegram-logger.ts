import { ConsoleLogger } from '@nestjs/common';
import { ErrorReporterService } from './error-reporter.service';

/**
 * Drop-in Nest logger that keeps normal console output but also forwards every
 * `logger.error(...)` call (from anywhere in the app) to the Telegram error
 * group via ErrorReporterService.
 */
export class TelegramLogger extends ConsoleLogger {
  constructor(private readonly reporter: ErrorReporterService) {
    super();
  }

  error(message: any, ...optionalParams: any[]): void {
    super.error(message, ...optionalParams);
    try {
      // Last string arg is usually the context (e.g. service name).
      const context =
        (optionalParams.length &&
          typeof optionalParams[optionalParams.length - 1] === 'string' &&
          optionalParams[optionalParams.length - 1]) ||
        (this as any).context ||
        'app';
      const parts = [message, ...optionalParams].map((p) => this.stringify(p));
      this.reporter.report(String(context), parts.join('\n'));
    } catch {
      // never let logging break
    }
  }

  private stringify(value: any): string {
    if (value instanceof Error) return value.stack || value.message;
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}
