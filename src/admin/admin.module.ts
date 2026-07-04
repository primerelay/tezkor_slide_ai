import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Admin } from './admin.entity';
import { User } from '../database/entities/user.entity';
import { Presentation } from '../database/entities/presentation.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { GeneratedDocument } from '../database/entities/document.entity';
import { FlashcardSet } from '../database/entities/flashcard-set.entity';
import { GlossarySet } from '../database/entities/glossary-set.entity';
import { CrosswordSet } from '../database/entities/crossword-set.entity';
import { Resume } from '../database/entities/resume.entity';
import { Quiz } from '../database/entities/quiz.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Admin,
      User,
      Presentation,
      Transaction,
      GeneratedDocument,
      FlashcardSet,
      GlossarySet,
      CrosswordSet,
      Resume,
      Quiz,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
