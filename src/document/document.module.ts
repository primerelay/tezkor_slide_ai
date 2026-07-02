import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { GeneratedDocument } from '../database/entities/document.entity';
import { User } from '../database/entities/user.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { DOCUMENT_QUEUE } from '../queue/constants';
import { DocAiClient } from './agents/doc-ai.client';
import { DocPlannerAgent } from './agents/doc-planner.agent';
import { DocWriterAgent } from './agents/doc-writer.agent';
import { DocumentPipeline } from './pipeline/document.pipeline';
import { DocxRendererService } from './renderer/docx-renderer.service';
import { DocumentService } from './document.service';
import { DocumentProcessor } from './processors/document.processor';
import { AiModule } from '../ai/ai.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GeneratedDocument, User, Transaction]),
    BullModule.registerQueue({ name: DOCUMENT_QUEUE }),
    AiModule,
    StorageModule,
  ],
  providers: [
    DocAiClient,
    DocPlannerAgent,
    DocWriterAgent,
    DocumentPipeline,
    DocxRendererService,
    DocumentService,
    DocumentProcessor,
  ],
  exports: [DocumentService],
})
export class DocumentModule {}
