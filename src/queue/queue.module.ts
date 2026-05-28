import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerationJob } from '../database/entities/generation-job.entity';
import { JobEventsService } from './events/job.events';
import { PRESENTATION_QUEUE } from './constants';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: PRESENTATION_QUEUE,
    }),
    TypeOrmModule.forFeature([GenerationJob]),
  ],
  providers: [JobEventsService],
  exports: [JobEventsService, BullModule],
})
export class QueueModule {}
