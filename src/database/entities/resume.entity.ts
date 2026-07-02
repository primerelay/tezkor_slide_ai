import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export interface ResumeExperience {
  role: string;
  company: string;
  period: string;
  bullets: string[];
}

export interface ResumeEducation {
  degree: string;
  institution: string;
  period: string;
}

export interface ResumeData {
  fullName: string;
  position: string;
  phone?: string;
  email?: string;
  location?: string;
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  languages: string[];
}

@Entity('resumes')
export class Resume {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 5, default: 'uz' })
  language: string;

  @Column({ type: 'jsonb' })
  data: ResumeData;

  @Column({ type: 'text', nullable: true })
  docxUrl: string;

  @Column({ type: 'int', default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  generationCost: number;

  @CreateDateColumn()
  createdAt: Date;
}
