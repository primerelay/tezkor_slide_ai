import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Quiz, QuizStatus } from '../database/entities/quiz.entity';
import { Question, QuestionType } from '../database/entities/question.entity';
import { User } from '../database/entities/user.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QuizGeneratorAgent } from './agents/quiz-generator.agent';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectQueue('quiz-generation')
    private quizQueue: Queue,
    private quizGeneratorAgent: QuizGeneratorAgent,
    @InjectBot()
    private bot: Telegraf,
  ) {}

  /**
   * Create quiz and queue for generation
   */
  async createQuiz(userId: number, createQuizDto: CreateQuizDto): Promise<Quiz> {
    this.logger.log(`Creating quiz for user ${userId}`);

    // Create quiz record
    const quiz = this.quizRepository.create({
      userId,
      title: createQuizDto.title,
      description: createQuizDto.description,
      sourceContent: createQuizDto.sourceContent,
      sourceFileName: createQuizDto.sourceFileName,
      quizType: createQuizDto.quizType,
      difficulty: createQuizDto.difficulty,
      numberOfQuestions: createQuizDto.numberOfQuestions,
      isPublic: createQuizDto.isPublic ?? true,
      status: QuizStatus.PENDING,
      metadata: {
        language: createQuizDto.language || 'uz',
        subject: createQuizDto.subject,
        topic: createQuizDto.topic,
      },
    });

    const savedQuiz = await this.quizRepository.save(quiz);

    // Add to queue for async generation
    await this.quizQueue.add('generate-quiz', {
      quizId: savedQuiz.id,
    });

    this.logger.log(`Quiz ${savedQuiz.id} queued for generation`);
    return savedQuiz;
  }

  /**
   * Get quiz by ID with questions
   */
  async getQuiz(quizId: number, userId?: number): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
      relations: ['questions', 'user'],
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz ${quizId} not found`);
    }

    // Check access permissions
    if (!quiz.isPublic && quiz.userId !== userId) {
      throw new NotFoundException('Quiz not found or access denied');
    }

    return quiz;
  }

  /**
   * Get user's quizzes
   */
  async getUserQuizzes(userId: number): Promise<Quiz[]> {
    return this.quizRepository.find({
      where: { userId },
      relations: ['questions'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Delete quiz
   */
  async deleteQuiz(quizId: number, userId: number): Promise<void> {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId, userId },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    await this.quizRepository.remove(quiz);
    this.logger.log(`Quiz ${quizId} deleted by user ${userId}`);
  }

  /**
   * Send quiz to Telegram as native quiz/poll
   */
  async sendQuizToTelegram(quizId: number, userId: number, telegramId: string): Promise<{ success: boolean; message: string }> {
    const quiz = await this.getQuiz(quizId, userId);

    if (quiz.status !== QuizStatus.COMPLETED) {
      throw new Error('Quiz is not ready yet');
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      throw new Error('Quiz has no questions');
    }

    try {
      // Send each question as a separate Telegram quiz
      for (const question of quiz.questions) {
        // Only send multiple choice questions as Telegram quiz
        if (question.type === QuestionType.MULTIPLE_CHOICE && question.options) {
          const options = Object.values(question.options);
          const correctOptionIndex = Object.keys(question.options).indexOf(question.correctAnswer);

          await this.bot.telegram.sendPoll(
            telegramId,
            question.questionText,
            options,
            {
              type: 'quiz',
              correct_option_id: correctOptionIndex,
              explanation: question.explanation || undefined,
              is_anonymous: false,
            }
          );

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Send completion message
      await this.bot.telegram.sendMessage(
        telegramId,
        `✅ Quiz "${quiz.title}" yuborildi!\n\n` +
        `📊 Jami ${quiz.questions.length} ta savol\n` +
        `🎯 Qiyinlik: ${quiz.difficulty}\n\n` +
        `Bu quizni boshqalarga forward qilishingiz mumkin!`,
      );

      this.logger.log(`Quiz ${quizId} sent to Telegram user ${telegramId}`);
      return { success: true, message: 'Quiz Telegramga yuborildi' };
    } catch (error) {
      this.logger.error(`Failed to send quiz ${quizId} to Telegram:`, error);
      throw new Error('Telegram orqali yuborishda xatolik');
    }
  }
}
