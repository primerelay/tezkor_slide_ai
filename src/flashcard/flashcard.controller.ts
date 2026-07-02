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
import { FlashcardService } from './flashcard.service';

interface CreateFlashcardDto {
  telegramId: string;
  sourceContent: string;
  cardCount: number;
  language?: string;
}

@Controller('api/flashcards')
export class FlashcardController {
  private readonly logger = new Logger(FlashcardController.name);

  constructor(private readonly flashcardService: FlashcardService) {}

  @Post()
  async create(@Body() dto: CreateFlashcardDto) {
    if (!dto?.telegramId || !dto?.sourceContent || !dto?.cardCount) {
      throw new HttpException('Missing fields', HttpStatus.BAD_REQUEST);
    }

    const user = await this.flashcardService.getUserByTelegramId(dto.telegramId.toString());
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    try {
      const set = await this.flashcardService.createSet({
        userId: user.id,
        sourceContent: dto.sourceContent,
        cardCount: dto.cardCount,
        language: dto.language || user.language || 'uz',
      });
      return { id: set.id, title: set.title, cardCount: set.cardCount, cards: set.cards };
    } catch (error) {
      this.logger.error('Failed to create flashcards', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to create flashcards',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  async getSet(@Param('id') id: string) {
    const set = await this.flashcardService.getSet(parseInt(id, 10));
    return { id: set.id, title: set.title, cardCount: set.cardCount, cards: set.cards, status: set.status };
  }

  @Get('user/:telegramId')
  async getUserSets(@Param('telegramId') telegramId: string) {
    const user = await this.flashcardService.getUserByTelegramId(telegramId.toString());
    if (!user) return [];
    const sets = await this.flashcardService.getUserSets(user.id);
    return sets.map((s) => ({ id: s.id, title: s.title, cardCount: s.cardCount, createdAt: s.createdAt }));
  }
}
