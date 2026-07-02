import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { TranslatorService } from './translator.service';

interface TranslateDto {
  telegramId: string;
  text: string;
  targetLang: string;
}

@Controller('api/translate')
export class TranslatorController {
  private readonly logger = new Logger(TranslatorController.name);

  constructor(private readonly translatorService: TranslatorService) {}

  @Post()
  async translate(@Body() dto: TranslateDto) {
    if (!dto?.telegramId || !dto?.text || !dto?.targetLang) {
      throw new HttpException('Missing fields', HttpStatus.BAD_REQUEST);
    }
    const user = await this.translatorService.getUserByTelegramId(dto.telegramId.toString());
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    try {
      const translated = await this.translatorService.translate(user.id, dto.text, dto.targetLang);
      return { translated };
    } catch (error) {
      this.logger.error('Translation failed', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Translation failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
