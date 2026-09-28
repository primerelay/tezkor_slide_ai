import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyGiftService } from './daily-gift.service';
import { User } from '../database/entities/user.entity';
import { Transaction } from '../database/entities/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Transaction])],
  providers: [DailyGiftService],
  exports: [DailyGiftService],
})
export class DailyGiftModule {}
