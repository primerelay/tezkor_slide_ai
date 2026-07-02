import { SupportedLanguage } from '../../common/i18n/i18n.service';
import { DocumentType } from '../../database/entities/document.entity';

export interface DocumentJobData {
  documentId: string;
  userId: number;
  topic: string;
  docType: DocumentType;
  pageCount: number;
  language: SupportedLanguage;
  institution?: string;
  studentName?: string;
  teacherName?: string;
  telegramChatId?: string;
}
