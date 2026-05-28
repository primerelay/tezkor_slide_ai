import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Presentation } from './presentation.entity';

export type JobStatus =
  | 'waiting'
  | 'active'
  | 'completed'
  | 'failed'
  | 'delayed';

export type JobStage =
  | 'queued'
  | 'parsing'
  | 'outline'
  | 'content'
  | 'layout'
  | 'rendering'
  | 'uploading'
  | 'done';

@Entity('generation_jobs')
export class GenerationJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  presentationId: string;

  @ManyToOne(() => Presentation)
  @JoinColumn({ name: 'presentationId' })
  presentation: Presentation;

  @Column({ nullable: true })
  bullJobId: string;

  @Column({ type: 'varchar', length: 20, default: 'waiting' })
  status: JobStatus;

  @Column({ type: 'varchar', length: 20, default: 'queued' })
  currentStage: JobStage;

  @Column({ default: 0 })
  progress: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
