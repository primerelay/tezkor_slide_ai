import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resume } from '../database/entities/resume.entity';
import { User } from '../database/entities/user.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { AiModule } from '../ai/ai.module';
import { StorageModule } from '../storage/storage.module';
import { ResumeEnhancerAgent } from './resume-enhancer.agent';
import { ResumeRendererService } from './resume-renderer.service';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resume, User, Transaction]),
    AiModule,
    StorageModule,
  ],
  controllers: [ResumeController],
  providers: [ResumeEnhancerAgent, ResumeRendererService, ResumeService],
  exports: [ResumeService],
})
export class ResumeModule {}
