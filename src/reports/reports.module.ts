import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyReportService } from './daily-report.service';
import { User } from '../database/entities/user.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { Presentation } from '../database/entities/presentation.entity';
import { GeneratedDocument } from '../database/entities/document.entity';
import { FlashcardSet } from '../database/entities/flashcard-set.entity';
import { GlossarySet } from '../database/entities/glossary-set.entity';
import { CrosswordSet } from '../database/entities/crossword-set.entity';
import { Resume } from '../database/entities/resume.entity';
import { Quiz } from '../database/entities/quiz.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Transaction,
      Presentation,
      GeneratedDocument,
      FlashcardSet,
      GlossarySet,
      CrosswordSet,
      Resume,
      Quiz,
    ]),
  ],
  providers: [DailyReportService],
  exports: [DailyReportService],
})
export class ReportsModule {}
