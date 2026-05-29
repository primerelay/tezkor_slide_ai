import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MiniAppController } from './mini-app.controller';
import { MiniAppService } from './mini-app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Presentation } from '../database/entities/presentation.entity';
import { TelegramModule } from '../telegram/telegram.module';
import { PRESENTATION_QUEUE } from '../queue/constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Presentation]),
    BullModule.registerQueue({
      name: PRESENTATION_QUEUE,
    }),
    TelegramModule,
  ],
  controllers: [MiniAppController],
  providers: [MiniAppService],
})
export class MiniAppModule {}
