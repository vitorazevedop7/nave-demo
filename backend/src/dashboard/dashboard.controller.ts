import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUser } from '../auth/jwt-user.interface';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

// Sem @Roles: todo usuário autenticado tem um dashboard, e o conteúdo é
// escolhido pelo perfil dentro do serviço.
@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(
    @CurrentUser() usuario: JwtUser,
    @Query() { period = 'semana' }: DashboardQueryDto,
  ) {
    return this.dashboardService.getStats(usuario.id, usuario.perfis, period);
  }
}
