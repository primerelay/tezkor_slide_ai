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

@Module({
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
      logging: process.env.NODE_ENV === 'development',
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'mini-app', 'dist'),
      serveRoot: '/mini-app',
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
  ],
})
export class AppModule {}
