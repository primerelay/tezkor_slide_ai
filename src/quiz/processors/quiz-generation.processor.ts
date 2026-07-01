import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz, QuizStatus } from '../../database/entities/quiz.entity';
import { Question } from '../../database/entities/question.entity';
import { User } from '../../database/entities/user.entity';
import { QuizGeneratorAgent } from '../agents/quiz-generator.agent';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { I18nService } from '../../common/i18n/i18n.service';

@Processor('quiz-generation')
export class QuizGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(QuizGenerationProcessor.name);
  private progressMessageIds: Map<number, { chatId: string; messageId: number }> = new Map();

  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private quizGeneratorAgent: QuizGeneratorAgent,
    @InjectBot()
    private bot: Telegraf,
  ) {
    super();
  }

  async process(job: Job<{ quizId: number }>): Promise<void> {
    const { quizId } = job.data;
    this.logger.log(`Processing quiz generation job for quiz ${quizId}`);

    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
      relations: ['user'],
    });
    if (!quiz) {
      throw new Error(`Quiz ${quizId} not found`);
    }

    // Get user for notifications
    const user = await this.userRepository.findOne({ where: { id: quiz.userId } });
    if (!user) {
      throw new Error(`User ${quiz.userId} not found`);
    }

    try {
      // Update status to generating
      quiz.status = QuizStatus.GENERATING;
      await this.quizRepository.save(quiz);

      // Progress: 10% - Starting
      await this.sendProgressMessage(quizId, user.telegramId, quiz.title, 10, user.language);

      const startTime = Date.now();

      // Progress: 30% - Analyzing content
      await this.sendProgressMessage(quizId, user.telegramId, quiz.title, 30, user.language);

      // Generate questions using multi-agent system
      const generatedQuestions = await this.quizGeneratorAgent.generateQuiz(
        quiz.sourceContent,
        quiz.quizType,
        quiz.difficulty,
        quiz.numberOfQuestions,
        quiz.metadata?.language || 'uz',
      );

      // Progress: 70% - Questions generated
      await this.sendProgressMessage(quizId, user.telegramId, quiz.title, 70, user.language);

      const endTime = Date.now();
      quiz.generationTimeMs = endTime - startTime;

      // Save questions to database
      const questions = generatedQuestions.map((q, index) => {
        return this.questionRepository.create({
          quizId: quiz.id,
          orderIndex: index + 1,
          type: q.type,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          points: 1,
          metadata: {
            difficulty: q.difficulty,
            topic: q.topic,
          },
        });
      });

      await this.questionRepository.save(questions);

      // Progress: 90% - Saving
      await this.sendProgressMessage(quizId, user.telegramId, quiz.title, 90, user.language);

      // Update quiz status
      quiz.status = QuizStatus.COMPLETED;
      quiz.generationCost = this.estimateCost(quiz.sourceContent.length, generatedQuestions.length);
      quiz.questions = questions; // Add questions for notification
      await this.quizRepository.save(quiz);

      // Progress: 100% - Complete
      await this.sendProgressMessage(quizId, user.telegramId, quiz.title, 100, user.language);

      // Send completion notification
      await this.sendCompletedQuiz(quiz, user);

      this.logger.log(`Quiz ${quizId} generated successfully with ${questions.length} questions`);
    } catch (error) {
      this.logger.error(`Quiz ${quizId} generation failed`, error);

      // Refund credits if generation failed
      const price = quiz.metadata?.price;
      if (price && quiz.userId) {
        const refundUser = await this.userRepository.findOne({ where: { id: quiz.userId } });
        if (refundUser) {
          refundUser.credits += price;
          await this.userRepository.save(refundUser);
          this.logger.log(`Refunded ${price} credits to user ${quiz.userId} due to failed generation`);
        }
      }

      // Notify user of failure
      if (user) {
        try {
          const i18n = new I18nService(user.language as any);
          await this.bot.telegram.sendMessage(
            user.telegramId,
            `${i18n.t('quiz.failed.title')}\n\n` +
            i18n.t('quiz.failed.info', {
              title: quiz.title,
              error: error.message || 'Unknown error',
              price: price ? price.toLocaleString() : '0'
            }),
            { parse_mode: 'HTML' },
          );
        } catch (notifyError) {
          this.logger.error('Failed to send error notification:', notifyError);
        }
      }

      // Clean up progress message
      this.progressMessageIds.delete(quizId);

      quiz.status = QuizStatus.FAILED;
      quiz.errorMessage = error.message || 'Unknown error occurred';
      await this.quizRepository.save(quiz);

      throw error;
    }
  }

  private estimateCost(contentLength: number, questionCount: number): number {
    // Rough estimate: $0.001 per quiz with DeepSeek R1
    const baseCost = 0.001;
    const lengthMultiplier = Math.min(contentLength / 5000, 2); // Scale with content length
    return baseCost * lengthMultiplier;
  }

  private async sendProgressMessage(
    quizId: number,
    telegramId: string,
    title: string,
    progress: number,
    language: string,
  ): Promise<void> {
    try {
      const i18n = new I18nService(language as any);
      const progressBar = this.getProgressBar(progress);
      const message =
        `${i18n.t('quiz.progress.generating')}\n\n` +
        `📝 ${title.substring(0, 50)}${title.length > 50 ? '...' : ''}\n\n` +
        `${progressBar} ${progress}%\n\n` +
        this.getProgressStage(progress, i18n);

      const existing = this.progressMessageIds.get(quizId);

      if (existing) {
        // Update existing message
        await this.bot.telegram.editMessageText(
          existing.chatId,
          existing.messageId,
          undefined,
          message,
          { parse_mode: 'HTML' },
        );
      } else {
        // Send new message
        const sent = await this.bot.telegram.sendMessage(telegramId, message, {
          parse_mode: 'HTML',
        });
        this.progressMessageIds.set(quizId, {
          chatId: telegramId,
          messageId: sent.message_id,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send progress message for quiz ${quizId}:`, error);
    }
  }

  private getProgressBar(progress: number): string {
    const filled = Math.floor(progress / 10);
    const empty = 10 - filled;
    return '▓'.repeat(filled) + '░'.repeat(empty);
  }

  private getProgressStage(progress: number, i18n: I18nService): string {
    if (progress < 20) return i18n.t('quiz.progress.analyzing');
    if (progress < 50) return i18n.t('quiz.progress.creating');
    if (progress < 80) return i18n.t('quiz.progress.improving');
    if (progress < 100) return i18n.t('quiz.progress.finalizing');
    return i18n.t('quiz.progress.ready');
  }

  private async sendCompletedQuiz(quiz: Quiz, user: User): Promise<void> {
    try {
      const i18n = new I18nService(user.language as any);

      // Send header message
      await this.bot.telegram.sendMessage(
        user.telegramId,
        `${i18n.t('quiz.completed.title')}\n\n` +
        i18n.t('quiz.completed.info', {
          title: quiz.title,
          count: quiz.questions?.length || quiz.numberOfQuestions,
          difficulty: quiz.difficulty
        }),
        { parse_mode: 'HTML' },
      );

      // Send each question as native Telegram quiz
      if (quiz.questions && quiz.questions.length > 0) {
        for (const question of quiz.questions) {
          // Only send multiple choice questions as Telegram quiz
          if (question.options && Object.keys(question.options).length >= 2) {
            const options = Object.values(question.options);
            const correctOptionIndex = Object.keys(question.options).indexOf(question.correctAnswer);

            if (correctOptionIndex >= 0) {
              await this.bot.telegram.sendPoll(
                user.telegramId,
                question.questionText,
                options,
                {
                  type: 'quiz',
                  correct_option_id: correctOptionIndex,
                  explanation: question.explanation || undefined,
                  is_anonymous: false,
                } as any,
              );

              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }

        // Send completion message
        await this.bot.telegram.sendMessage(
          user.telegramId,
          i18n.t('quiz.completed.allSent', { count: quiz.questions.length }),
          { parse_mode: 'HTML' },
        );
      }

      // Clean up progress message
      this.progressMessageIds.delete(quiz.id);
    } catch (error) {
      this.logger.error(`Failed to send completed quiz:`, error);
    }
  }
}
