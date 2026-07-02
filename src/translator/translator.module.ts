import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { AiModule } from '../ai/ai.module';
import { TranslatorAgent } from './translator.agent';
import { TranslatorService } from './translator.service';
import { TranslatorController } from './translator.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Transaction]), AiModule],
  controllers: [TranslatorController],
  providers: [TranslatorAgent, TranslatorService],
  exports: [TranslatorService],
})
export class TranslatorModule {}
