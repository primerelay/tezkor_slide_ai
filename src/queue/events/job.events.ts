import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenerationJob } from '../../database/entities/generation-job.entity';
import { PRESENTATION_QUEUE } from '../constants';
import { PresentationJobData } from '../types/job.types';

@Injectable()
export class JobEventsService {
  private readonly logger = new Logger(JobEventsService.name);

  constructor(
    @InjectQueue(PRESENTATION_QUEUE)
    private readonly presentationQueue: Queue<PresentationJobData>,
    @InjectRepository(GenerationJob)
    private readonly generationJobRepository: Repository<GenerationJob>,
  ) {}

  async addPresentationJob(data: PresentationJobData): Promise<string> {
    const job = await this.presentationQueue.add('generate', data, {
      priority: 1,
    });

    const generationJob = this.generationJobRepository.create({
      presentationId: data.presentationId,
      bullJobId: job.id,
      status: 'waiting',
      currentStage: 'queued',
      progress: 0,
    });

    await this.generationJobRepository.save(generationJob);

    this.logger.log(
      `Added presentation job: ${job.id} for ${data.presentationId}`,
    );

    return job.id || '';
  }

  async getJobStatus(presentationId: string): Promise<{
    status: string;
    stage: string;
    progress: number;
  } | null> {
    const generationJob = await this.generationJobRepository.findOne({
      where: { presentationId },
    });

    if (!generationJob) {
      return null;
    }

    return {
      status: generationJob.status,
      stage: generationJob.currentStage,
      progress: generationJob.progress,
    };
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.presentationQueue.getWaitingCount(),
      this.presentationQueue.getActiveCount(),
      this.presentationQueue.getCompletedCount(),
      this.presentationQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }

  async cancelJob(presentationId: string): Promise<boolean> {
    const generationJob = await this.generationJobRepository.findOne({
      where: { presentationId },
    });

    if (!generationJob || !generationJob.bullJobId) {
      return false;
    }

    const job = await this.presentationQueue.getJob(generationJob.bullJobId);

    if (job) {
      await job.remove();
      await this.generationJobRepository.update(
        { presentationId },
        { status: 'failed', errorMessage: 'Cancelled by user' },
      );
      return true;
    }

    return false;
  }
}
