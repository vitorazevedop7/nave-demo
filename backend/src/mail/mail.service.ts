import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

interface PasswordResetEmail {
  to: string;
  token: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly frontendUrl: string;
  private readonly tokenTtlMinutes: number;
  private readonly mailtrapApiToken: string;
  private readonly mailtrapInboxId: string;
  private readonly mailtrapFromEmail: string;
  private readonly mailtrapApiTimeoutMs: number;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const password = this.config.get<string>('SMTP_PASSWORD');

    this.from = this.config.get<string>('SMTP_FROM') ?? '';
    this.mailtrapApiToken =
      this.config.get<string>('MAILTRAP_API_TOKEN')?.trim() ?? '';
    this.mailtrapInboxId =
      this.config.get<string>('MAILTRAP_INBOX_ID')?.trim() ?? '';
    this.mailtrapFromEmail =
      this.config.get<string>('MAILTRAP_FROM_EMAIL')?.trim() ??
      'no-reply@nave.invalid';
    this.mailtrapApiTimeoutMs = this.numberConfig(
      'MAILTRAP_API_TIMEOUT_MS',
      10_000,
    );
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
          connectionTimeout: this.numberConfig(
            'SMTP_CONNECTION_TIMEOUT_MS',
            10_000,
          ),
          greetingTimeout: this.numberConfig(
            'SMTP_GREETING_TIMEOUT_MS',
            10_000,
          ),
          socketTimeout: this.numberConfig('SMTP_SOCKET_TIMEOUT_MS', 15_000),
        })
      : null;
  }

  private numberConfig(name: string, fallback: number): number {
    const parsed = Number(this.config.get<string>(name));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  async sendPasswordReset({ to, token }: PasswordResetEmail): Promise<void> {
    // O fragmento não é enviado ao servidor do frontend nem aparece em access logs.
    const resetUrl = `${this.frontendUrl}/redefinir-senha#token=${encodeURIComponent(token)}`;
    const subject = 'Redefinição de senha — NAVE';
    const text = [
      'Recebemos uma solicitação para redefinir sua senha no sistema NAVE.',
      '',
      `Acesse o link abaixo em até ${this.tokenTtlMinutes} minutos:`,
      resetUrl,
      '',
      'Se você não fez esta solicitação, ignore esta mensagem.',
    ].join('\n');

    if (this.mailtrapApiToken && this.mailtrapInboxId) {
      await this.sendViaMailtrapSandboxApi({ to, subject, text });
      return;
    }

    if (!this.transporter || !this.from) {
      throw new Error('Serviço de e-mail não configurado');
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        text,
      });
    } catch (error) {
      const smtpError = error as {
        code?: unknown;
        command?: unknown;
        responseCode?: unknown;
      };

      this.logger.error(
        [
          'Falha no transporte SMTP',
          `code=${this.safeDiagnostic(smtpError.code)}`,
          `command=${this.safeDiagnostic(smtpError.command)}`,
          `responseCode=${this.safeDiagnostic(smtpError.responseCode)}`,
        ].join(' '),
      );
      throw error;
    }
  }

  private async sendViaMailtrapSandboxApi(message: {
    to: string;
    subject: string;
    text: string;
  }): Promise<void> {
    let response: Response;

    try {
      response = await fetch(
        `https://sandbox.api.mailtrap.io/api/send/${encodeURIComponent(this.mailtrapInboxId)}`,
        {
          method: 'POST',
          headers: {
            'Api-Token': this.mailtrapApiToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: { email: this.mailtrapFromEmail, name: 'NAVE' },
            to: [{ email: message.to }],
            subject: message.subject,
            text: message.text,
          }),
          signal: AbortSignal.timeout(this.mailtrapApiTimeoutMs),
        },
      );
    } catch (error) {
      const apiError = error as {
        code?: unknown;
        name?: unknown;
        cause?: { code?: unknown };
      };
      this.logger.error(
        [
          'Falha no transporte Mailtrap API',
          `code=${this.safeDiagnostic(apiError.code ?? apiError.cause?.code)}`,
          `name=${this.safeDiagnostic(apiError.name)}`,
        ].join(' '),
      );
      throw error;
    }

    if (!response.ok) {
      this.logger.error(
        `Falha no transporte Mailtrap API status=${this.safeDiagnostic(response.status)}`,
      );
      throw new Error('Falha ao enviar e-mail');
    }
  }

  private safeDiagnostic(value: unknown): string {
    const diagnostic = String(value ?? 'unknown');
    return /^[A-Za-z0-9_-]{1,32}$/.test(diagnostic) ? diagnostic : 'unknown';
  }
}
