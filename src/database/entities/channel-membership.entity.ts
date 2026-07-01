import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export type MembershipStatus = 'joined' | 'left' | 'kicked' | 'banned';

@Entity('channel_memberships')
@Index(['userId', 'channelUsername'])
export class ChannelMembership {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  channelUsername: string;

  @Column({ type: 'varchar', length: 20 })
  status: MembershipStatus;

  @Column({ type: 'timestamp' })
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  leftAt?: Date;

  @Column({ default: false })
  rewardGiven: boolean;

  @Column({ type: 'int', default: 0 })
  rewardAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
