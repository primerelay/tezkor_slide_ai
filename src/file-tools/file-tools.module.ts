import { Module } from '@nestjs/common';
import { FileToolsService } from './file-tools.service';

@Module({
  providers: [FileToolsService],
  exports: [FileToolsService],
})
export class FileToolsModule {}
