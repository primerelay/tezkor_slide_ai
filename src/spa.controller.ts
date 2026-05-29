import { Controller, Get, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

@Controller()
export class SpaController {
  @Get('admin/*')
  serveAdminSpa(@Res() res: Response) {
    const indexPath = join(__dirname, '..', 'web', 'dist', 'index.html');
    if (existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return res.status(404).send('Not found');
  }

  @Get('admin')
  serveAdmin(@Res() res: Response) {
    const indexPath = join(__dirname, '..', 'web', 'dist', 'index.html');
    if (existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return res.status(404).send('Not found');
  }
}
