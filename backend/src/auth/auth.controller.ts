import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { JwtUser } from './jwt-user.interface';
import { Public } from './public.decorator';

/** Tentativas de login permitidas por IP a cada janela de 1 minuto. */
export const LOGIN_LIMITE_POR_MINUTO = 5;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: LOGIN_LIMITE_POR_MINUTO, ttl: 60_000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Sempre responde 202 com a mesma mensagem, exista ou não o e-mail, para
   * não revelar quem tem cadastro. O limite por e-mail e por IP fica no
   * `PasswordResetRateLimiter`.
   */
  @Public()
  @Post('esqueci-minha-senha')
  @HttpCode(HttpStatus.ACCEPTED)
  requestPasswordReset(@Body() dto: RequestPasswordResetDto, @Ip() ip: string) {
    return this.authService.requestPasswordReset(dto, ip || 'unknown');
  }

  @Public()
  @Post('redefinir-senha')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: LOGIN_LIMITE_POR_MINUTO, ttl: 60_000 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  me(@CurrentUser() usuario: JwtUser): JwtUser {
    return usuario;
  }
}
