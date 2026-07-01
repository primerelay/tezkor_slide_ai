import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz, QuizStatus } from '../../database/entities/quiz.entity';
import { Question } from '../../database/entities/question.entity';
import { User } from '../../database/entities/user.entity';
import { QuizGeneratorAgent } from '../agents/quiz-generator.agent';

@Processor('quiz-generation')
export class QuizGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(QuizGenerationProcessor.name);

  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private quizGeneratorAgent: QuizGeneratorAgent,
  ) {
    super();
  }

  async process(job: Job<{ quizId: number }>): Promise<void> {
    const { quizId } = job.data;
    this.logger.log(`Processing quiz generation job for quiz ${quizId}`);

    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    if (!quiz) {
      throw new Error(`Quiz ${quizId} not found`);
    }

    try {
      // Update status to generating
      quiz.status = QuizStatus.GENERATING;
      await this.quizRepository.save(quiz);

      const startTime = Date.now();

      // Generate questions using multi-agent system
      const generatedQuestions = await this.quizGeneratorAgent.generateQuiz(
        quiz.sourceContent,
        quiz.quizType,
        quiz.difficulty,
        quiz.numberOfQuestions,
        quiz.metadata?.language || 'uz',
      );

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

      // Update quiz status
      quiz.status = QuizStatus.COMPLETED;
      quiz.generationCost = this.estimateCost(quiz.sourceContent.length, generatedQuestions.length);
      await this.quizRepository.save(quiz);

      this.logger.log(`Quiz ${quizId} generated successfully with ${questions.length} questions`);
    } catch (error) {
      this.logger.error(`Quiz ${quizId} generation failed`, error);

      // Refund credits if generation failed
      const price = quiz.metadata?.price;
      if (price && quiz.userId) {
        const user = await this.userRepository.findOne({ where: { id: quiz.userId } });
        if (user) {
          user.credits += price;
          await this.userRepository.save(user);
          this.logger.log(`Refunded ${price} credits to user ${quiz.userId} due to failed generation`);
        }
      }

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
}
