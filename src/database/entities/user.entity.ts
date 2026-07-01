import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Presentation } from './presentation.entity';
import { Transaction } from './transaction.entity';

export type UserLanguage = 'uz' | 'ru' | 'en' | 'de';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', unique: true })
  telegramId: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ type: 'varchar', length: 5, default: 'uz' })
  language: UserLanguage;

  @Column({ default: 3 })
  credits: number;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: false })
  isBanned: boolean;

  @Column({ nullable: true })
  referredBy?: number; // User ID of who invited them

  @Column({ default: 0 })
  referralCount: number; // How many people they invited

  @Column({ nullable: true, unique: true })
  referralCode?: string; // Unique referral code for sharing

  @OneToMany(() => Presentation, (presentation) => presentation.user)
  presentations: Presentation[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
