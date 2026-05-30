import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MiniAppController } from './mini-app.controller';
import { MiniAppService } from './mini-app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Presentation } from '../database/entities/presentation.entity';
import { TelegramModule } from '../telegram/telegram.module';
import { PRESENTATION_QUEUE } from '../queue/constants';
import { RendererModule } from '../renderer/renderer.module';
import { StorageModule } from '../storage/storage.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Presentation]),
    BullModule.registerQueue({
      name: PRESENTATION_QUEUE,
    }),
    TelegramModule,
    RendererModule,
    StorageModule,
    AiModule,
  ],
  controllers: [MiniAppController],
  providers: [MiniAppService],
})
export class MiniAppModule {}
