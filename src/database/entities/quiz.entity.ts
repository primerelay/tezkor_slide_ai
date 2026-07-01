import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';
import { QuizAttempt } from './quiz-attempt.entity';

export enum QuizType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  FILL_BLANK = 'fill_blank',
  MIXED = 'mixed',
}

export enum QuizDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum QuizStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text' })
  sourceContent: string; // Original text/PDF content

  @Column({ nullable: true })
  sourceFileName: string;

  @Column({
    type: 'enum',
    enum: QuizType,
    default: QuizType.MULTIPLE_CHOICE,
  })
  quizType: QuizType;

  @Column({
    type: 'enum',
    enum: QuizDifficulty,
    default: QuizDifficulty.MEDIUM,
  })
  difficulty: QuizDifficulty;

  @Column({ default: 10 })
  numberOfQuestions: number;

  @Column({
    type: 'enum',
    enum: QuizStatus,
    default: QuizStatus.PENDING,
  })
  status: QuizStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  generationCost: number; // AI cost in USD

  @Column({ type: 'int', default: 0 })
  generationTimeMs: number;

  @Column({ default: true })
  isPublic: boolean; // Can other users see/use this quiz?

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    language?: string; // uz, ru, en
    subject?: string; // Math, History, etc.
    topic?: string;
    tags?: string[];
    aiModel?: string; // deepseek-r1, gemini-flash, etc.
    price?: number; // Quiz price in credits
  };

  @OneToMany(() => Question, (question) => question.quiz, { cascade: true })
  questions: Question[];

  @OneToMany(() => QuizAttempt, (attempt) => attempt.quiz)
  attempts: QuizAttempt[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
