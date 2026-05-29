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
}
