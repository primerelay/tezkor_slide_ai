import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  GeneratedDocument,
  DocumentType,
} from '../database/entities/document.entity';
import { DOCUMENT_QUEUE } from '../queue/constants';
import { DocumentJobData } from './types/document-job.types';
import { SupportedLanguage } from '../common/i18n/i18n.service';

// Pricing in so'm by page count, per document format.
export const DOC_PRICES: Record<number, number> = {
  10: 2500,
  15: 3500,
  20: 4500,
  25: 5500,
};

// Essays (insho) are short prose — fewer pages, cheaper.
export const ESSAY_PRICES: Record<number, number> = {
  2: 1500,
  3: 2000,
  5: 2500,
};

// Coursework (kurs ishi) is the largest academic document.
export const KURS_ISHI_PRICES: Record<number, number> = {
  25: 6000,
  35: 8000,
  50: 11000,
};

// Article (maqola) — medium academic article with abstract + keywords.
export const MAQOLA_PRICES: Record<number, number> = {
  5: 3000,
  8: 4000,
  10: 5000,
};

// Thesis abstract (tezis) — very short conference-style piece.
export const TEZIS_PRICES: Record<number, number> = {
  2: 2000,
  3: 2500,
};

export function priceTableFor(docType: DocumentType): Record<number, number> {
  switch (docType) {
    case 'insho':
      return ESSAY_PRICES;
    case 'kurs_ishi':
      return KURS_ISHI_PRICES;
    case 'maqola':
      return MAQOLA_PRICES;
    case 'tezis':
      return TEZIS_PRICES;
    default:
      return DOC_PRICES;
  }
}

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @InjectRepository(GeneratedDocument)
    private readonly documentRepository: Repository<GeneratedDocument>,
    @InjectQueue(DOCUMENT_QUEUE)
    private readonly documentQueue: Queue<DocumentJobData>,
  ) {}

  getPrice(docType: DocumentType, pageCount: number): number {
    const table = priceTableFor(docType);
    const values = Object.values(table);
    // Fall back to the cheapest tier for the type if the count isn't listed.
    return table[pageCount] ?? values[0] ?? 4500;
  }

  async createDocument(data: {
    userId: number;
    topic: string;
    docType: DocumentType;
    pageCount: number;
    language: SupportedLanguage;
    institution?: string;
    studentName?: string;
    teacherName?: string;
    price: number;
    telegramChatId?: string;
  }): Promise<GeneratedDocument> {
    const document = this.documentRepository.create({
      userId: data.userId,
      type: data.docType,
      topic: data.topic,
      institution: data.institution,
      studentName: data.studentName,
      teacherName: data.teacherName,
      pageCount: data.pageCount,
      language: data.language,
      price: data.price,
      status: 'pending',
    });

    const saved = await this.documentRepository.save(document);

    await this.documentQueue.add('generate', {
      documentId: saved.id,
      userId: data.userId,
      topic: data.topic,
      docType: data.docType,
      pageCount: data.pageCount,
      language: data.language,
      institution: data.institution,
      studentName: data.studentName,
      teacherName: data.teacherName,
      telegramChatId: data.telegramChatId,
    });

    this.logger.log(`Document queued: ${saved.id} (${data.docType}, ${data.pageCount} pages)`);

    return saved;
  }

  async getUserDocuments(userId: number): Promise<GeneratedDocument[]> {
    return this.documentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  async getDocumentById(id: string): Promise<GeneratedDocument | null> {
    return this.documentRepository.findOne({ where: { id } });
  }
}
