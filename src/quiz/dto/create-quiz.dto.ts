import { IsString, IsEnum, IsInt, IsOptional, Min, Max, IsBoolean } from 'class-validator';
import { QuizType, QuizDifficulty } from '../../database/entities/quiz.entity';

export class CreateQuizDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  sourceContent: string; // Text or base64 PDF content

  @IsOptional()
  @IsString()
  sourceFileName?: string;

  @IsEnum(QuizType)
  quizType: QuizType;

  @IsEnum(QuizDifficulty)
  difficulty: QuizDifficulty;

  @IsInt()
  @Min(5)
  @Max(50)
  numberOfQuestions: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  language?: string; // uz, ru, en

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  topic?: string;
}
