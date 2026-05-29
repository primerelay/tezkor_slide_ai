import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import type { PresentationTheme } from '../../renderer/themes/theme-registry';

export type { PresentationTheme };

export type PresentationStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export type PresentationLanguage = 'uz' | 'ru' | 'en' | 'de';

@Entity('presentations')
export class Presentation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.presentations)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text' })
  topic: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  studentName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  teacherName: string;

  @Column({ type: 'boolean', default: false })
  includeReja: boolean;

  @Column({ nullable: true })
  slideCount: number;

  @Column({ type: 'varchar', length: 50, default: 'academic_blue' })
  theme: PresentationTheme;

  @Column({ type: 'varchar', length: 5, default: 'uz' })
  language: PresentationLanguage;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: PresentationStatus;

  @Column({ type: 'text', nullable: true })
  pptxUrl: string;

  @Column({ type: 'text', nullable: true })
  pdfUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  aiCost: number;

  @Column({ nullable: true })
  generationTimeMs: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  generatedContent: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
