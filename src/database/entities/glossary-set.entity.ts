import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export interface GlossaryEntry {
  term: string;
  definition: string;
}

@Entity('glossary_sets')
export class GlossarySet {
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

  @Column({ type: 'int', default: 20 })
  termCount: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  entries: GlossaryEntry[];

  @Column({ type: 'text', nullable: true })
  docxUrl: string;

  @Column({ type: 'int', default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  generationCost: number;

  @CreateDateColumn()
  createdAt: Date;
}
