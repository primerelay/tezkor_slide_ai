import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Presentation } from './entities/presentation.entity';
import { Transaction } from './entities/transaction.entity';
import { GenerationJob } from './entities/generation-job.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Presentation, Transaction, GenerationJob]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
