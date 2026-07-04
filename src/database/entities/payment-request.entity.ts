import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

/** One admin's copy of the payment-proof message (so we can update all of them). */
export interface AdminMessageRef {
  adminId: number;
  messageId: number;
}

@Entity('payment_requests')
export class PaymentRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Paying user's DB id. */
  @Column()
  userId: number;

  /** Paying user's Telegram id — used to notify them of the decision. */
  @Column({ type: 'varchar', length: 32 })
  telegramId: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: PaymentRequestStatus;

  /** Amount credited on approval. */
  @Column({ type: 'int', nullable: true })
  amount: number;

  @Column({ type: 'text', nullable: true })
  rejectReason: string;

  /** Copies of the proof message across all admins, so all can be updated. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  adminMessages: AdminMessageRef[];

  /** Telegram id of the admin who approved/rejected. */
  @Column({ type: 'varchar', length: 64, nullable: true })
  processedBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
