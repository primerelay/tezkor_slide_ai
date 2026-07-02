import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { TelegramModule } from './telegram/telegram.module';
import { QueueModule } from './queue/queue.module';
import { ProcessorModule } from './queue/processor.module';
import { AiModule } from './ai/ai.module';
import { RendererModule } from './renderer/renderer.module';
import { StorageModule } from './storage/storage.module';
import { PaymentModule } from './payment/payment.module';
import { MiniAppModule } from './mini-app/mini-app.module';
import { AdminModule } from './admin/admin.module';
import { QuizModule } from './quiz/quiz.module';
import { DocumentModule } from './document/document.module';
import { FlashcardModule } from './flashcard/flashcard.module';
import { SpaController } from './spa.controller';

@Module({
  controllers: [SpaController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'tezkor',
      password: process.env.DATABASE_PASSWORD || 'tezkor123',
      database: process.env.DATABASE_NAME || 'tezkor_slide_ai',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      // Query logging is a heavy CPU/IO sink; keep only errors and warnings.
      logging: ['error', 'warn'],
      // Bounded connection pool so a burst of requests can't exhaust Postgres.
      extra: { max: 10 },
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
      // Don't let finished jobs pile up in Redis (memory growth over time).
      // NOTE: no `attempts` here on purpose — the processors handle their own
      // failure (refund + error message) assuming a single run; auto-retry
      // would double-refund/double-deliver.
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'mini-app', 'dist'),
      serveRoot: '/mini-app',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'web', 'dist'),
      serveRoot: '/',
      exclude: ['/api/{*path}', '/mini-app/{*path}'],
      serveStaticOptions: {
        index: ['index.html'],
        fallthrough: true,
      },
    }),
    DatabaseModule,
    StorageModule,
    AiModule,
    RendererModule,
    QueueModule,
    ProcessorModule,
    TelegramModule,
    PaymentModule,
    MiniAppModule,
    AdminModule,
    QuizModule,
    DocumentModule,
    FlashcardModule,
  ],
})
export class AppModule {}
