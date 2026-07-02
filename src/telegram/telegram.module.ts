import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Presentation } from '../database/entities/presentation.entity';
import { GenerationJob } from '../database/entities/generation-job.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { ChannelMembership } from '../database/entities/channel-membership.entity';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.update';
import { ReferralService } from './referral.service';
import { StartScene } from './scenes/start.scene';
import { LanguageScene } from './scenes/language.scene';
import { TopicScene } from './scenes/topic.scene';
import { OptionsScene } from './scenes/options.scene';
import { GenerationScene } from './scenes/generation.scene';
import { QuizCreateScene } from './scenes/quiz-create.scene';
import { DocumentCreateScene } from './scenes/document-create.scene';
import { FlashcardCreateScene } from './scenes/flashcard-create.scene';
import { GlossaryCreateScene } from './scenes/glossary-create.scene';
import { CrosswordCreateScene } from './scenes/crossword-create.scene';
import { QuizModule } from '../quiz/quiz.module';
import { DocumentModule } from '../document/document.module';
import { FlashcardModule } from '../flashcard/flashcard.module';
import { StudyModule } from '../study/study.module';

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
    TypeOrmModule.forFeature([User, Presentation, GenerationJob, Transaction, ChannelMembership]),
    forwardRef(() => QuizModule),
    DocumentModule,
    FlashcardModule,
    StudyModule,
  ],
  providers: [
    TelegramService,
    TelegramUpdate,
    ReferralService,
    StartScene,
    LanguageScene,
    TopicScene,
    OptionsScene,
    GenerationScene,
    QuizCreateScene,
    DocumentCreateScene,
    FlashcardCreateScene,
    GlossaryCreateScene,
    CrosswordCreateScene,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}
