import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export type FlashcardStatus = 'completed' | 'failed';

export interface Flashcard {
  front: string;
  back: string;
}

@Entity('flashcard_sets')
export class FlashcardSet {
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
  cardCount: number;

  @Column({ type: 'varchar', length: 20, default: 'completed' })
  status: FlashcardStatus;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  cards: Flashcard[];

  @Column({ type: 'int', default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  generationCost: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}
