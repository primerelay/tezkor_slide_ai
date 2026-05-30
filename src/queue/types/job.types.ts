import { SupportedLanguage } from '../../common/i18n/i18n.service';
import { PresentationTheme } from '../../renderer/themes/theme-registry';

export interface PresentationJobData {
  presentationId: string;
  userId: number;
  topic: string;
  studentName?: string;
  teacherName?: string;
  includeReja?: boolean;
  slideCount: number;
  theme: PresentationTheme;
  language: SupportedLanguage;
  telegramChatId?: string;
  /** 'mini_app' decks are reviewed/edited in the app, so the bot does NOT auto-send the file. */
  source?: 'telegram' | 'mini_app';
}
