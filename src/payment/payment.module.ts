import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { PaymentService } from './payment.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Transaction]), StorageModule],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
