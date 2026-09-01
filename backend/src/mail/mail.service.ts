import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

interface PasswordResetEmail {
  to: string;
  token: string;
}

@Injectable()
export class MailService {
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly frontendUrl: string;
  private readonly tokenTtlMinutes: number;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const password = this.config.get<string>('SMTP_PASSWORD');

    this.from = this.config.get<string>('SMTP_FROM') ?? '';
    this.frontendUrl = (
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001'
    ).replace(/\/$/, '');
    this.tokenTtlMinutes = this.numberConfig(
      'PASSWORD_RESET_TOKEN_TTL_MINUTES',
      30,
    );

    this.transporter = host
      ? nodemailer.createTransport({
          host,
          port: this.numberConfig('SMTP_PORT', 587),
          secure: this.config.get<string>('SMTP_SECURE') === 'true',
          auth: user && password ? { user, pass: password } : undefined,
        })
      : null;
  }

  private numberConfig(name: string, fallback: number): number {
    const parsed = Number(this.config.get<string>(name));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  async sendPasswordReset({ to, token }: PasswordResetEmail): Promise<void> {
    if (!this.transporter || !this.from) {
      throw new Error('Serviço de e-mail não configurado');
    }

    // O fragmento não é enviado ao servidor do frontend nem aparece em access logs.
    const resetUrl = `${this.frontendUrl}/redefinir-senha#token=${encodeURIComponent(token)}`;

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: 'Redefinição de senha — NAVE',
      text: [
        'Recebemos uma solicitação para redefinir sua senha no sistema NAVE.',
        '',
        `Acesse o link abaixo em até ${this.tokenTtlMinutes} minutos:`,
        resetUrl,
        '',
        'Se você não fez esta solicitação, ignore esta mensagem.',
      ].join('\n'),
    });
  }
}
