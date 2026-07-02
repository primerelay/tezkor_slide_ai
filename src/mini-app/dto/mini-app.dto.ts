export interface TemplateColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface TemplateDto {
  id: string;
  name: string;
  nameUz: string;
  category: 'academic' | 'business' | 'creative' | 'minimal';
  colors: TemplateColors;
}

export interface SlideElementDto {
  id: string;
  type: 'text' | 'image' | 'shape' | 'chart';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  style?: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    align?: 'left' | 'center' | 'right';
  };
}

export interface SlideDto {
  id: string;
  type: 'hero' | 'bullets' | 'two_column' | 'image_text' | 'quote' | 'timeline' | 'conclusion';
  title: string;
  elements: SlideElementDto[];
  background?: string;
  notes?: string;
}

export interface MiniAppPresentationDto {
  id?: string;
  title: string;
  studentName?: string;
  teacherName?: string;
  includeReja?: boolean;
  template?: TemplateDto;
  slides?: SlideDto[];
  language?: 'uz' | 'ru' | 'en';
}

export interface CreatePresentationDto {
  userId: number;
  presentation: MiniAppPresentationDto;
}

export interface CreateDocumentDto {
  telegramId: string;
  docType: 'mustaqil_ish' | 'referat';
  topic: string;
  pageCount: number;
  institution?: string;
  studentName?: string;
  teacherName?: string;
  language?: 'uz' | 'ru' | 'en' | 'de';
}
