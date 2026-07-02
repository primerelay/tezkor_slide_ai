import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlossarySet } from '../database/entities/glossary-set.entity';
import { CrosswordSet } from '../database/entities/crossword-set.entity';
import { User } from '../database/entities/user.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { AiModule } from '../ai/ai.module';
import { StorageModule } from '../storage/storage.module';
import { GlossaryGeneratorAgent } from './glossary/glossary-generator.agent';
import { GlossaryRendererService } from './glossary/glossary-renderer.service';
import { GlossaryService } from './glossary/glossary.service';
import { CrosswordGeneratorAgent } from './crossword/crossword-generator.agent';
import { CrosswordRendererService } from './crossword/crossword-renderer.service';
import { CrosswordService } from './crossword/crossword.service';
import { GlossaryController, CrosswordController } from './study.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([GlossarySet, CrosswordSet, User, Transaction]),
    AiModule,
    StorageModule,
  ],
  controllers: [GlossaryController, CrosswordController],
  providers: [
    GlossaryGeneratorAgent,
    GlossaryRendererService,
    GlossaryService,
    CrosswordGeneratorAgent,
    CrosswordRendererService,
    CrosswordService,
  ],
  exports: [GlossaryService, CrosswordService],
})
export class StudyModule {}
