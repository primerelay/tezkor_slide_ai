import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Quiz } from './quiz.entity';

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  FILL_BLANK = 'fill_blank',
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quizId: number;

  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column()
  orderIndex: number; // Question order in quiz (1, 2, 3...)

  @Column({
    type: 'enum',
    enum: QuestionType,
  })
  type: QuestionType;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'jsonb', nullable: true })
  options: {
    a?: string;
    b?: string;
    c?: string;
    d?: string;
    e?: string;
  }; // For MCQ

  @Column({ type: 'text' })
  correctAnswer: string; // "a", "true", or actual answer text

  @Column({ type: 'text', nullable: true })
  explanation: string; // Why this answer is correct

  @Column({ type: 'int', default: 1 })
  points: number; // Score for this question

  @Column({ type: 'text', nullable: true })
  hint: string; // Optional hint for students

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    difficulty?: string;
    topic?: string;
    bloom_level?: string; // Knowledge, Comprehension, Application, etc.
    keywords?: string[];
  };

  @CreateDateColumn()
  createdAt: Date;
}
