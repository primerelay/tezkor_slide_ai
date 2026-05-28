import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../database/entities/transaction.entity';
import { StorageService } from '../storage/storage.service';

export interface CreateTopupRequest {
  userId: number;
  amount: number;
  proofImage?: Buffer;
  proofImageExtension?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  private readonly creditPackages = [
    { credits: 5, price: 15000, label: '5 ta kredit - 15,000 so\'m' },
    { credits: 10, price: 25000, label: '10 ta kredit - 25,000 so\'m' },
    { credits: 25, price: 50000, label: '25 ta kredit - 50,000 so\'m' },
    { credits: 50, price: 80000, label: '50 ta kredit - 80,000 so\'m' },
  ];

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly storageService: StorageService,
  ) {}

  getCreditPackages() {
    return this.creditPackages;
  }

  async createTopupRequest(data: CreateTopupRequest): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      userId: data.userId,
      type: 'topup' as TransactionType,
      amount: data.amount,
      status: 'pending' as TransactionStatus,
      description: `To'ldirish so'rovi: ${data.amount} kredit`,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    if (data.proofImage) {
      const proofUrl = await this.storageService.saveProofImage(
        savedTransaction.id,
        data.proofImage,
        data.proofImageExtension || 'jpg',
      );

      savedTransaction.proofImageUrl = proofUrl;
      await this.transactionRepository.save(savedTransaction);
    }

    this.logger.log(
      `Created topup request: ${savedTransaction.id} for user ${data.userId}`,
    );

    return savedTransaction;
  }

  async approveTopup(
    transactionId: number,
    approvedBy: number,
  ): Promise<Transaction | null> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['user'],
    });

    if (!transaction || transaction.status !== 'pending') {
      return null;
    }

    transaction.status = 'approved';
    transaction.approvedBy = approvedBy;

    await this.transactionRepository.save(transaction);

    const user = await this.userRepository.findOne({
      where: { id: transaction.userId },
    });

    if (user) {
      user.credits += transaction.amount;
      await this.userRepository.save(user);
    }

    this.logger.log(
      `Approved topup: ${transactionId}, added ${transaction.amount} credits to user ${transaction.userId}`,
    );

    return transaction;
  }

  async rejectTopup(
    transactionId: number,
    approvedBy: number,
    reason?: string,
  ): Promise<Transaction | null> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction || transaction.status !== 'pending') {
      return null;
    }

    transaction.status = 'rejected';
    transaction.approvedBy = approvedBy;

    if (reason) {
      transaction.description += ` | Rad etildi: ${reason}`;
    }

    await this.transactionRepository.save(transaction);

    this.logger.log(`Rejected topup: ${transactionId}`);

    return transaction;
  }

  async recordUsage(
    userId: number,
    presentationId: string,
    creditsUsed: number = 1,
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      userId,
      type: 'usage' as TransactionType,
      amount: -creditsUsed,
      status: 'approved' as TransactionStatus,
      description: `Prezentatsiya yaratish: ${presentationId}`,
    });

    return this.transactionRepository.save(transaction);
  }

  async refundCredits(
    userId: number,
    amount: number,
    reason: string,
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      userId,
      type: 'refund' as TransactionType,
      amount,
      status: 'approved' as TransactionStatus,
      description: `Qaytarish: ${reason}`,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (user) {
      user.credits += amount;
      await this.userRepository.save(user);
    }

    this.logger.log(`Refunded ${amount} credits to user ${userId}: ${reason}`);

    return savedTransaction;
  }

  async addBonusCredits(
    userId: number,
    amount: number,
    reason: string,
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      userId,
      type: 'bonus' as TransactionType,
      amount,
      status: 'approved' as TransactionStatus,
      description: `Bonus: ${reason}`,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (user) {
      user.credits += amount;
      await this.userRepository.save(user);
    }

    this.logger.log(`Added ${amount} bonus credits to user ${userId}: ${reason}`);

    return savedTransaction;
  }

  async getPendingTopups(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: {
        type: 'topup',
        status: 'pending',
      },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async getUserTransactions(userId: number, limit: number = 20): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getTransactionStats(): Promise<{
    totalTopups: number;
    pendingTopups: number;
    totalCreditsIssued: number;
    totalCreditsUsed: number;
  }> {
    const [totalTopups, pendingTopups, creditsIssued, creditsUsed] =
      await Promise.all([
        this.transactionRepository.count({
          where: { type: 'topup', status: 'approved' },
        }),
        this.transactionRepository.count({
          where: { type: 'topup', status: 'pending' },
        }),
        this.transactionRepository
          .createQueryBuilder('t')
          .select('SUM(t.amount)', 'sum')
          .where('t.type IN (:...types)', {
            types: ['topup', 'bonus', 'refund'],
          })
          .andWhere('t.status = :status', { status: 'approved' })
          .getRawOne(),
        this.transactionRepository
          .createQueryBuilder('t')
          .select('SUM(ABS(t.amount))', 'sum')
          .where('t.type = :type', { type: 'usage' })
          .getRawOne(),
      ]);

    return {
      totalTopups,
      pendingTopups,
      totalCreditsIssued: parseInt(creditsIssued?.sum || '0', 10),
      totalCreditsUsed: parseInt(creditsUsed?.sum || '0', 10),
    };
  }
}
