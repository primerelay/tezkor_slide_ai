import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminService, DateFilter } from './admin.service';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  async login(@Body() body: { phone: string; password: string }) {
    return this.adminService.login(body.phone, body.password);
  }

  @Get('verify')
  async verify(@Headers('authorization') auth: string) {
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token required');
    }
    const token = auth.replace('Bearer ', '');
    return this.adminService.verifyToken(token);
  }

  @Get('stats')
  async getStats(
    @Headers('authorization') auth: string,
    @Query('filter') filter: DateFilter = '1m',
  ) {
    await this.verifyAuth(auth);
    return this.adminService.getStats(filter);
  }

  @Get('chart')
  async getChartData(
    @Headers('authorization') auth: string,
    @Query('filter') filter: DateFilter = '1m',
  ) {
    await this.verifyAuth(auth);
    return this.adminService.getChartData(filter);
  }

  @Get('presentations/recent')
  async getRecentPresentations(
    @Headers('authorization') auth: string,
    @Query('limit') limit: string = '10',
  ) {
    await this.verifyAuth(auth);
    return this.adminService.getRecentPresentations(parseInt(limit, 10));
  }

  @Get('users/recent')
  async getRecentUsers(
    @Headers('authorization') auth: string,
    @Query('limit') limit: string = '10',
  ) {
    await this.verifyAuth(auth);
    return this.adminService.getRecentUsers(parseInt(limit, 10));
  }

  private async verifyAuth(auth: string) {
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token required');
    }
    const token = auth.replace('Bearer ', '');
    await this.adminService.verifyToken(token);
  }
}
