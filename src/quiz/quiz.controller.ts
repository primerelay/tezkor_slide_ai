import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';

@Controller('api/quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  async createQuiz(@Body() createQuizDto: CreateQuizDto, @Req() req) {
    // TODO: Add authentication guard
    const userId = req.user?.id || 1; // Temp: use user ID 1 for testing
    return this.quizService.createQuiz(userId, createQuizDto);
  }

  @Get(':id')
  async getQuiz(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user?.id;
    return this.quizService.getQuiz(id, userId);
  }

  @Get('user/my-quizzes')
  async getMyQuizzes(@Req() req) {
    const userId = req.user?.id || 1;
    return this.quizService.getUserQuizzes(userId);
  }

  @Delete(':id')
  async deleteQuiz(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user?.id || 1;
    return this.quizService.deleteQuiz(id, userId);
  }
}
