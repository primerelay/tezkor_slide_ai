import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { MiniAppService } from './mini-app.service';
import {
  CreatePresentationDto,
  MiniAppPresentationDto,
} from './dto/mini-app.dto';

@Controller('api/mini-app')
export class MiniAppController {
  private readonly logger = new Logger(MiniAppController.name);

  constructor(private readonly miniAppService: MiniAppService) {}

  @Get('templates')
  async getTemplates() {
    return this.miniAppService.getTemplates();
  }

  @Get('user/:telegramId')
  async getUser(@Param('telegramId') telegramId: string) {
    const user = await this.miniAppService.getUserByTelegramId(telegramId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return {
      id: user.id,
      credits: user.credits,
      language: user.language,
      firstName: user.firstName,
    };
  }

  @Post('generate')
  async generatePresentation(@Body() dto: CreatePresentationDto) {
    this.logger.log(`Generating presentation for user ${dto.userId}`);

    try {
      const result = await this.miniAppService.createPresentation(dto);
      return {
        success: true,
        presentationId: result.presentationId,
        message: 'Prezentatsiya yaratilmoqda...',
      };
    } catch (error) {
      this.logger.error('Failed to create presentation', error);
      throw new HttpException(
        error.message || 'Failed to create presentation',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('image-search')
  async imageSearch(@Query('q') q: string) {
    return this.miniAppService.searchImages(q || '');
  }

  @Get('presentations/:userId')
  async getUserPresentations(@Param('userId') userId: string) {
    return this.miniAppService.getUserPresentations(parseInt(userId, 10));
  }

  @Get('presentation/:id')
  async getPresentation(@Param('id') id: string) {
    const presentation = await this.miniAppService.getPresentationById(id);
    if (!presentation) {
      throw new HttpException('Presentation not found', HttpStatus.NOT_FOUND);
    }
    return presentation;
  }

  @Post('presentation/:id/finalize')
  async finalizePresentation(
    @Param('id') id: string,
    @Body() body: { content: any },
  ) {
    try {
      return await this.miniAppService.finalizePresentation(id, body?.content);
    } catch (error) {
      this.logger.error('Failed to finalize presentation', error);
      throw new HttpException(
        error.message || 'Failed to finalize presentation',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
