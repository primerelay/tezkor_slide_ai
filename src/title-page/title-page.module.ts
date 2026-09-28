import { Module } from '@nestjs/common';
import { TitlePageService } from './title-page.service';

@Module({
  providers: [TitlePageService],
  exports: [TitlePageService],
})
export class TitlePageModule {}
