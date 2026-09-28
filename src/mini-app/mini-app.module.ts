import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MiniAppController } from './mini-app.controller';
import { MiniAppService } from './mini-app.service';
import { DailyGiftModule } from '../daily-gift/daily-gift.module';
import { TitlePageModule } from '../title-page/title-page.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Presentation } from '../database/entities/presentation.entity';
import { GenerationJob } from '../database/entities/generation-job.entity';
import { TelegramModule } from '../telegram/telegram.module';
import { PRESENTATION_QUEUE } from '../queue/constants';
import { RendererModule } from '../renderer/renderer.module';
import { StorageModule } from '../storage/storage.module';
import { AiModule } from '../ai/ai.module';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Presentation, GenerationJob]),
    BullModule.registerQueue({
      name: PRESENTATION_QUEUE,
    }),
    TelegramModule,
    RendererModule,
    StorageModule,
    AiModule,
    DocumentModule,
    DailyGiftModule,
    TitlePageModule,
  ],
  controllers: [MiniAppController],
  providers: [MiniAppService],
})
export class MiniAppModule {}
