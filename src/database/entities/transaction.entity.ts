import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export type TransactionType = 'topup' | 'usage' | 'refund' | 'bonus';

export type TransactionStatus = 'pending' | 'approved' | 'rejected';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 20 })
  type: TransactionType;

  @Column()
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  proofImageUrl: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: TransactionStatus;

  @Column({ nullable: true })
  approvedBy: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approver: User;

  @CreateDateColumn()
  createdAt: Date;
}
