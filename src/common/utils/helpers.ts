import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

export function formatCredits(credits: number, language: string = 'uz'): string {
  const labels: Record<string, { one: string; few: string; many: string }> = {
    uz: { one: 'kredit', few: 'kredit', many: 'kredit' },
    ru: { one: 'кредит', few: 'кредита', many: 'кредитов' },
    en: { one: 'credit', few: 'credits', many: 'credits' },
  };

  const label = labels[language] || labels['en'];

  if (language === 'ru') {
    const lastDigit = credits % 10;
    const lastTwoDigits = credits % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return `${credits} ${label.many}`;
    }
    if (lastDigit === 1) {
      return `${credits} ${label.one}`;
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return `${credits} ${label.few}`;
    }
    return `${credits} ${label.many}`;
  }

  if (credits === 1) {
    return `${credits} ${label.one}`;
  }
  return `${credits} ${label.many}`;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fn();
        resolve(result);
        return;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts) {
          await sleep(delayMs * attempt);
        }
      }
    }

    reject(lastError);
  });
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return chunks;
}

export function isValidTelegramId(id: unknown): id is number {
  return typeof id === 'number' && id > 0 && Number.isInteger(id);
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200);
}
