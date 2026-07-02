import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

/** A placed clue in the finished crossword. */
export interface CrosswordClue {
  number: number;
  direction: 'across' | 'down';
  clue: string;
  answer: string;
  row: number;
  col: number;
}

export interface CrosswordData {
  size: { rows: number; cols: number };
  /** rows×cols; each cell is the letter or null for a blocked cell. */
  grid: (string | null)[][];
  /** cell number labels keyed by "r,c" for word starts. */
  numbers: Record<string, number>;
  clues: CrosswordClue[];
}

@Entity('crossword_sets')
export class CrosswordSet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  sourceContent: string;

  @Column({ type: 'varchar', length: 5, default: 'uz' })
  language: string;

  @Column({ type: 'int', default: 10 })
  wordCount: number;

  @Column({ type: 'jsonb' })
  data: CrosswordData;

  @Column({ type: 'text', nullable: true })
  docxUrl: string;

  @Column({ type: 'int', default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  generationCost: number;

  @CreateDateColumn()
  createdAt: Date;
}
