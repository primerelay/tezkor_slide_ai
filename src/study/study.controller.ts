import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GlossaryService } from './glossary/glossary.service';
import { CrosswordService } from './crossword/crossword.service';

interface CreateGlossaryDto {
  telegramId: string;
  sourceContent: string;
  termCount: number;
  language?: string;
}

interface CreateCrosswordDto {
  telegramId: string;
  sourceContent: string;
  wordCount: number;
  language?: string;
}

@Controller('api/glossary')
export class GlossaryController {
  private readonly logger = new Logger(GlossaryController.name);
  constructor(private readonly glossaryService: GlossaryService) {}

  @Post()
  async create(@Body() dto: CreateGlossaryDto) {
    if (!dto?.telegramId || !dto?.sourceContent || !dto?.termCount) {
      throw new HttpException('Missing fields', HttpStatus.BAD_REQUEST);
    }
    const user = await this.glossaryService.getUserByTelegramId(dto.telegramId.toString());
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    try {
      const set = await this.glossaryService.createSet({
        userId: user.id,
        sourceContent: dto.sourceContent,
        termCount: dto.termCount,
        language: dto.language || user.language || 'uz',
        telegramId: user.telegramId,
      });
      return { id: set.id, title: set.title, termCount: set.termCount };
    } catch (error) {
      this.logger.error('Failed to create glossary', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to create glossary',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const set = await this.glossaryService.getSet(parseInt(id, 10));
    return { id: set.id, title: set.title, termCount: set.termCount, entries: set.entries };
  }
}

@Controller('api/crossword')
export class CrosswordController {
  private readonly logger = new Logger(CrosswordController.name);
  constructor(private readonly crosswordService: CrosswordService) {}

  @Post()
  async create(@Body() dto: CreateCrosswordDto) {
    if (!dto?.telegramId || !dto?.sourceContent || !dto?.wordCount) {
      throw new HttpException('Missing fields', HttpStatus.BAD_REQUEST);
    }
    const user = await this.crosswordService.getUserByTelegramId(dto.telegramId.toString());
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    try {
      const set = await this.crosswordService.createSet({
        userId: user.id,
        sourceContent: dto.sourceContent,
        wordCount: dto.wordCount,
        language: dto.language || user.language || 'uz',
        telegramId: user.telegramId,
      });
      return { id: set.id, title: set.title, wordCount: set.wordCount };
    } catch (error) {
      this.logger.error('Failed to create crossword', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to create crossword',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const set = await this.crosswordService.getSet(parseInt(id, 10));
    return { id: set.id, title: set.title, wordCount: set.wordCount, data: set.data };
  }
}
