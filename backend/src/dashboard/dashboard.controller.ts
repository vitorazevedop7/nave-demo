import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../auth/roles.guard';

interface AuthedRequest extends Request {
  user: { id: string; email: string; nome: string; perfis: string[] };
}

@Controller('dashboard')
@UseGuards(RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(
    @Req() req: AuthedRequest,
    @Query('period') period: 'hoje' | 'semana' | 'mes' = 'semana',
  ) {
    return this.dashboardService.getStats(req.user.id, req.user.perfis, period);
  }
}
