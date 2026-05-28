import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Presentation } from '../database/entities/presentation.entity';
import { GenerationJob } from '../database/entities/generation-job.entity';
import { User } from '../database/entities/user.entity';
import { PresentationProcessor } from './processors/presentation.processor';
import { AiModule } from '../ai/ai.module';
import { RendererModule } from '../renderer/renderer.module';
import { StorageModule } from '../storage/storage.module';
import { QueueModule } from './queue.module';

@Module({
  imports: [
    QueueModule,
    TypeOrmModule.forFeature([Presentation, GenerationJob, User]),
    AiModule,
    RendererModule,
    StorageModule,
  ],
  providers: [PresentationProcessor],
})
export class ProcessorModule {}
