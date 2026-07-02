import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashcardSet } from '../database/entities/flashcard-set.entity';
import { User } from '../database/entities/user.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { FlashcardService } from './flashcard.service';
import { FlashcardController } from './flashcard.controller';
import { FlashcardGeneratorAgent } from './flashcard-generator.agent';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FlashcardSet, User, Transaction]),
    AiModule,
  ],
  controllers: [FlashcardController],
  providers: [FlashcardService, FlashcardGeneratorAgent],
  exports: [FlashcardService],
})
export class FlashcardModule {}
