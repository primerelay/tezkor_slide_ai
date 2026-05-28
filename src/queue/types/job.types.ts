export interface PresentationJobData {
  presentationId: string;
  userId: number;
  topic: string;
  slideCount: number;
  theme: 'academic_blue' | 'minimal_white' | 'modern_dark';
  language: 'uz' | 'ru' | 'en';
  telegramChatId?: string;
}
