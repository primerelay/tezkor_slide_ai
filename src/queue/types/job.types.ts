import { SupportedLanguage } from '../../common/i18n/i18n.service';

export interface PresentationJobData {
  presentationId: string;
  userId: number;
  topic: string;
  studentName?: string;
  teacherName?: string;
  includeReja?: boolean;
  slideCount: number;
  theme: 'academic_blue' | 'minimal_white' | 'modern_dark';
  language: SupportedLanguage;
  telegramChatId?: string;
}
