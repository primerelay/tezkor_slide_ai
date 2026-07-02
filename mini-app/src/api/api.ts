const API_BASE = '/api/mini-app';

export interface User {
  id: number;
  credits: number;
  language: 'uz' | 'ru' | 'en' | 'de';
  firstName: string;
}

export interface Template {
  id: string;
  name: string;
  nameUz: string;
  category: 'academic' | 'business' | 'creative' | 'minimal';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export interface Presentation {
  id: string;
  title: string;
  studentName?: string;
  teacherName?: string;
  includeReja?: boolean;
  template?: Template;
  slides?: any[];
  language?: 'uz' | 'ru' | 'en' | 'de';
}

export interface GenerateResponse {
  success: boolean;
  presentationId: string;
  message: string;
}

export type DocumentType = 'mustaqil_ish' | 'referat' | 'insho';

export interface CreateDocumentRequest {
  telegramId: string;
  docType: DocumentType;
  topic: string;
  pageCount: number;
  institution?: string;
  studentName?: string;
  teacherName?: string;
  language?: 'uz' | 'ru' | 'en' | 'de';
}

export interface DocumentStatus {
  id: string;
  type: DocumentType;
  topic: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  pageCount: number;
  errorMessage?: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface FlashcardSet {
  id: number;
  title: string;
  cardCount: number;
  cards: Flashcard[];
  status?: string;
  shareUrl?: string;
}

export const api = {
  async createFlashcards(req: {
    telegramId: string;
    sourceContent: string;
    cardCount: number;
    language?: string;
  }): Promise<FlashcardSet> {
    const response = await fetch('/api/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create flashcards' }));
      throw new Error(error.message || 'Failed to create flashcards');
    }
    return response.json();
  },

  async getFlashcards(id: string): Promise<FlashcardSet> {
    const response = await fetch(`/api/flashcards/${id}`);
    if (!response.ok) throw new Error('Failed to fetch flashcards');
    return response.json();
  },

  async createDocument(
    req: CreateDocumentRequest,
  ): Promise<{ success: boolean; documentId: string; message: string }> {
    const response = await fetch(`${API_BASE}/document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create document' }));
      throw new Error(error.message || 'Failed to create document');
    }
    return response.json();
  },

  async getDocument(id: string): Promise<DocumentStatus> {
    const response = await fetch(`${API_BASE}/document/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }
    return response.json();
  },

  async getUser(telegramId: string): Promise<User> {
    const response = await fetch(`${API_BASE}/user/${telegramId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  },

  async getTemplates(): Promise<Template[]> {
    const response = await fetch(`${API_BASE}/templates`);
    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }
    return response.json();
  },

  async generatePresentation(
    userId: number,
    presentation: Presentation
  ): Promise<GenerateResponse> {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, presentation }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate presentation');
    }
    return response.json();
  },

  async getUserPresentations(userId: number): Promise<Presentation[]> {
    const response = await fetch(`${API_BASE}/presentations/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch presentations');
    }
    return response.json();
  },

  async getPresentation(id: string): Promise<Presentation> {
    const response = await fetch(`${API_BASE}/presentation/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch presentation');
    }
    return response.json();
  },
};
