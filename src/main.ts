import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ErrorReporterService } from './common/error-reporter/error-reporter.service';
import { TelegramLogger } from './common/error-reporter/telegram-logger';

async function bootstrap() {
  // Buffer early logs until our Telegram-forwarding logger is attached.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const reporter = app.get(ErrorReporterService);
  app.useLogger(new TelegramLogger(reporter));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Catch anything that escaped a try/catch anywhere in the process.
  process.on('unhandledRejection', (reason) => {
    reporter.report('unhandledRejection', reason);
  });
  process.on('uncaughtException', (err) => {
    reporter.report('uncaughtException', err);
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 SliderAI UZ is running on port ${port}`);
}

bootstrap();
