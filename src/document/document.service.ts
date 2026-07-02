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

// Pricing in so'm by page count.
export const DOC_PRICES: Record<number, number> = {
  10: 2500,
  15: 3500,
  20: 4500,
  25: 5500,
};

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @InjectRepository(GeneratedDocument)
    private readonly documentRepository: Repository<GeneratedDocument>,
    @InjectQueue(DOCUMENT_QUEUE)
    private readonly documentQueue: Queue<DocumentJobData>,
  ) {}

  getPriceForPageCount(pageCount: number): number {
    return DOC_PRICES[pageCount] || 4500;
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
