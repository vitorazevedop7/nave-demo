import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

describe('MailService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('envia a recuperação pela API HTTPS do sandbox quando configurada', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, status: 200 } as Response);
    const service = new MailService(
      new ConfigService({
        FRONTEND_URL: 'https://nave-app.example',
        MAILTRAP_API_TOKEN: 'sandbox-api-token',
        MAILTRAP_INBOX_ID: '12345',
        MAILTRAP_FROM_EMAIL: 'no-reply@nave.example',
      }),
    );

    await service.sendPasswordReset({
      to: 'gestora@example.com',
      token: 'reset-token',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(options?.body));

    expect(url).toBe('https://sandbox.api.mailtrap.io/api/send/12345');
    expect(options).toMatchObject({
      method: 'POST',
      headers: {
        'Api-Token': 'sandbox-api-token',
        'Content-Type': 'application/json',
      },
    });
    expect(body).toMatchObject({
      from: { email: 'no-reply@nave.example', name: 'NAVE' },
      to: [{ email: 'gestora@example.com' }],
      subject: 'Redefinição de senha — NAVE',
    });
    expect(body.text).toContain(
      'https://nave-app.example/redefinir-senha#token=reset-token',
    );
  });

  it('envia a recuperação pela API HTTPS transacional em produção', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, status: 200 } as Response);
    const service = new MailService(
      new ConfigService({
        FRONTEND_URL: 'https://nave-app.example',
        MAILTRAP_API_TOKEN: 'production-api-token',
        MAILTRAP_FROM_EMAIL: 'nao-responda@naveosc.com',
      }),
    );

    await service.sendPasswordReset({
      to: 'gestora@example.com',
      token: 'reset-token',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(options?.body));

    expect(url).toBe('https://send.api.mailtrap.io/api/send');
    expect(options).toMatchObject({
      method: 'POST',
      headers: {
        Authorization: 'Bearer production-api-token',
        'Content-Type': 'application/json',
      },
    });
    expect(body).toMatchObject({
      from: { email: 'nao-responda@naveosc.com', name: 'NAVE' },
      to: [{ email: 'gestora@example.com' }],
      subject: 'Redefinição de senha — NAVE',
    });
  });

  it('registra somente o status seguro quando a API rejeita o envio', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: false, status: 401 } as Response);
    const loggerMock = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const service = new MailService(
      new ConfigService({
        FRONTEND_URL: 'https://nave-app.example',
        MAILTRAP_API_TOKEN: 'secret-token-not-for-logs',
        MAILTRAP_INBOX_ID: '12345',
      }),
    );

    await expect(
      service.sendPasswordReset({
        to: 'gestora@example.com',
        token: 'reset-token-not-for-logs',
      }),
    ).rejects.toThrow('Falha ao enviar e-mail');

    expect(loggerMock).toHaveBeenCalledWith(
      'Falha no transporte Mailtrap API status=401',
    );
    expect(JSON.stringify(loggerMock.mock.calls)).not.toContain(
      'secret-token-not-for-logs',
    );
    expect(JSON.stringify(loggerMock.mock.calls)).not.toContain(
      'reset-token-not-for-logs',
    );
    expect(JSON.stringify(loggerMock.mock.calls)).not.toContain(
      'gestora@example.com',
    );
  });
});
