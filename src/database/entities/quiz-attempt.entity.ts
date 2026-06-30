import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Quiz } from './quiz.entity';

export enum AttemptStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

@Entity('quiz_attempts')
export class QuizAttempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  quizId: number;

  @ManyToOne(() => Quiz, (quiz) => quiz.attempts)
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column({
    type: 'enum',
    enum: AttemptStatus,
    default: AttemptStatus.IN_PROGRESS,
  })
  status: AttemptStatus;

  @Column({ type: 'jsonb', default: {} })
  answers: Record<number, string>; // { questionId: userAnswer }

  @Column({ type: 'int', default: 0 })
  score: number; // Total points earned

  @Column({ type: 'int', nullable: true })
  totalPoints: number; // Maximum possible points

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage: number; // (score / totalPoints) * 100

  @Column({ type: 'int', nullable: true })
  timeSpentSeconds: number;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    device?: string; // web, telegram, mobile
    ipAddress?: string;
    userAgent?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
