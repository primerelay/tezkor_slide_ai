import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ResumeService } from './resume.service';
import { ResumeInput } from './resume-enhancer.agent';

interface CreateResumeDto extends Omit<ResumeInput, 'language'> {
  telegramId: string;
  language?: string;
}

@Controller('api/resume')
export class ResumeController {
  private readonly logger = new Logger(ResumeController.name);

  constructor(private readonly resumeService: ResumeService) {}

  @Post()
  async create(@Body() dto: CreateResumeDto) {
    if (!dto?.telegramId || !dto?.fullName || !dto?.position) {
      throw new HttpException('Missing fields', HttpStatus.BAD_REQUEST);
    }
    const user = await this.resumeService.getUserByTelegramId(dto.telegramId.toString());
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    try {
      const resume = await this.resumeService.create(
        user.id,
        { ...dto, language: dto.language || user.language || 'uz' },
        user.telegramId,
      );
      return { id: resume.id, fullName: resume.data.fullName };
    } catch (error) {
      this.logger.error('Failed to create resume', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to create resume',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
