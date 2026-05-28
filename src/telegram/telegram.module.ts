import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Presentation } from '../database/entities/presentation.entity';
import { GenerationJob } from '../database/entities/generation-job.entity';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.update';
import { StartScene } from './scenes/start.scene';
import { LanguageScene } from './scenes/language.scene';
import { TopicScene } from './scenes/topic.scene';
import { OptionsScene } from './scenes/options.scene';
import { GenerationScene } from './scenes/generation.scene';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('telegram.botToken') || '',
        middlewares: [session()],
        include: [TelegramModule],
      }),
    }),
    TypeOrmModule.forFeature([User, Presentation, GenerationJob]),
  ],
  providers: [
    TelegramService,
    TelegramUpdate,
    StartScene,
    LanguageScene,
    TopicScene,
    OptionsScene,
    GenerationScene,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}
