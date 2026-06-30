import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { QuizGeneratorAgent } from './agents/quiz-generator.agent';
import { QuizGenerationProcessor } from './processors/quiz-generation.processor';
import { Quiz } from '../database/entities/quiz.entity';
import { Question } from '../database/entities/question.entity';
import { QuizAttempt } from '../database/entities/quiz-attempt.entity';
import { User } from '../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quiz, Question, QuizAttempt, User]),
    BullModule.registerQueue({
      name: 'quiz-generation',
    }),
  ],
  controllers: [QuizController],
  providers: [QuizService, QuizGeneratorAgent, QuizGenerationProcessor],
  exports: [QuizService],
})
export class QuizModule {}
