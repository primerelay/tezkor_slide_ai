import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export type DocumentType = 'mustaqil_ish' | 'referat';

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type DocumentLanguage = 'uz' | 'ru' | 'en' | 'de';

@Entity('documents')
export class GeneratedDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 30 })
  type: DocumentType;

  @Column({ type: 'text' })
  topic: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  institution: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  studentName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  teacherName: string;

  @Column()
  pageCount: number;

  @Column({ type: 'varchar', length: 5, default: 'uz' })
  language: DocumentLanguage;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: DocumentStatus;

  @Column({ type: 'text', nullable: true })
  docxUrl: string;

  /** Price paid in so'm — used for automatic refund if generation fails. */
  @Column({ type: 'int', default: 0 })
  price: number;

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
