import { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

function erroPrisma(code: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError(
    'Invalid `prisma.x()` invocation: SELECT * FROM segredo',
    { code, clientVersion: '7.8.0', meta },
  );
}

function executar(erro: Prisma.PrismaClientKnownRequestError) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  const filtro = new PrismaExceptionFilter();
  jest.spyOn(filtro['logger'], 'error').mockImplementation(() => undefined);

  filtro.catch(erro, host);

  return {
    status: (status.mock.calls[0] as [number])[0],
    corpo: (json.mock.calls[0] as [Record<string, unknown>])[0],
  };
}

describe('PrismaExceptionFilter', () => {
  it('P2025 (registro não encontrado) vira 404', () => {
    expect(executar(erroPrisma('P2025'))).toEqual({
      status: 404,
      corpo: {
        statusCode: 404,
        error: 'Not Found',
        message: 'Registro não encontrado.',
      },
    });
  });

  it('P2002 em CPF de beneficiária vira 409 com mensagem específica (driver adapter)', () => {
    const { status, corpo } = executar(
      erroPrisma('P2002', {
        modelName: 'beneficiarias',
        driverAdapterError: {
          cause: { constraint: { fields: ['cpf'] } },
        },
      }),
    );

    expect(status).toBe(409);
    expect(corpo.message).toBe('Já existe uma beneficiária com este CPF.');
  });

  it('P2002 aceita também o formato meta.target da engine nativa', () => {
    const { corpo } = executar(
      erroPrisma('P2002', { modelName: 'usuarios', target: ['email'] }),
    );

    expect(corpo.message).toBe('E-mail já cadastrado');
  });

  it('P2002 em campo sem mensagem própria usa mensagem genérica com o campo', () => {
    const { corpo } = executar(
      erroPrisma('P2002', {
        modelName: 'bazar_profissionais',
        target: ['bazar_id', 'profissional_id'],
      }),
    );

    expect(corpo.message).toBe(
      'Já existe um registro com este valor de bazar_id, profissional_id.',
    );
  });

  it('P2003 (violação de chave estrangeira) vira 409', () => {
    expect(executar(erroPrisma('P2003')).status).toBe(409);
  });

  it('código desconhecido vira 500 sem vazar a mensagem interna', () => {
    const { status, corpo } = executar(erroPrisma('P2010'));

    expect(status).toBe(500);
    expect(JSON.stringify(corpo)).not.toContain('SELECT');
    expect(JSON.stringify(corpo)).not.toContain('prisma');
  });
});
