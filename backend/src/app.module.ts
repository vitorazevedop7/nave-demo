import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { EncaminhamentosModule } from './encaminhamentos/encaminhamentos.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { BeneficiariasModule } from './beneficiarias/beneficiarias.module';
import { TriagensModule } from './triagens/triagens.module';
import { QueixasModule } from './queixas/queixas.module';
import { ProntuariosModule } from './prontuarios/prontuarios.module';
import { AgendamentosModule } from './agendamentos/agendamentos.module';
import { BazaresModule } from './bazares/bazares.module';
import { DoacoesModule } from './doacoes/doacoes.module';
import { DoadoresModule } from './doadores/doadores.module';
import { CampanhasDoacoesModule } from './campanhas-doacoes/campanhas-doacoes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EncaminhamentosModule,
    UsuariosModule,
    AuthModule,
    BeneficiariasModule,
    TriagensModule,
    QueixasModule,
    ProntuariosModule,
    AgendamentosModule,
    BazaresModule,
    DoacoesModule,
    DoadoresModule,
    CampanhasDoacoesModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    // Autenticação obrigatória por padrão em toda a aplicação. Rotas que devem
    // ser acessíveis sem token precisam do decorator `@Public()`.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    AppService,
  ],
})
export class AppModule {}
