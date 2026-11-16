import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/**
 * Mensagens de unicidade por `modelo.campo`. Campos sem entrada aqui recebem
 * a mensagem genérica.
 */
const MENSAGENS_UNICIDADE: Record<string, string> = {
  'beneficiarias.cpf': 'Já existe uma beneficiária com este CPF.',
  'usuarios.email': 'E-mail já cadastrado',
};

interface RespostaErro {
  statusCode: number;
  error: string;
  message: string;
}

/**
 * Traduz erros conhecidos do Prisma em respostas HTTP previsíveis, sem expor
 * SQL, nomes de constraint ou stack trace ao cliente. Códigos não mapeados
 * viram 500 genérico e o detalhe fica só no log do servidor.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(erro: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const resposta = host.switchToHttp().getResponse<Response>();
    const corpo = this.traduzir(erro);

    if (corpo.statusCode >= 500) {
      this.logger.error(
        `Erro Prisma ${erro.code}: ${erro.message}`,
        erro.stack,
      );
    }

    resposta.status(corpo.statusCode).json(corpo);
  }

  traduzir(erro: Prisma.PrismaClientKnownRequestError): RespostaErro {
    switch (erro.code) {
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: 'Registro não encontrado.',
        };
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: mensagemUnicidade(erro),
        };
      case 'P2003':
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message:
            'Operação não permitida: o registro está vinculado a outro registro inexistente ou dependente.',
        };
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'Erro interno ao acessar o banco de dados.',
        };
    }
  }
}

function mensagemUnicidade(erro: Prisma.PrismaClientKnownRequestError) {
  const modelo = lerString(erro.meta, ['modelName']);
  const campos = camposDaViolacao(erro.meta);

  for (const campo of campos) {
    const mensagem = MENSAGENS_UNICIDADE[`${modelo}.${campo}`];
    if (mensagem) return mensagem;
  }

  return campos.length > 0
    ? `Já existe um registro com este valor de ${campos.join(', ')}.`
    : 'Já existe um registro com estes dados.';
}

/**
 * O Prisma informa os campos em `meta.target` (engine nativa) ou em
 * `meta.driverAdapterError.cause.constraint.fields` (driver adapters, como o
 * `@prisma/adapter-pg` usado aqui). Aceita os dois formatos.
 */
function camposDaViolacao(meta: unknown): string[] {
  const alvo = lerCampo(meta, ['target']);
  if (Array.isArray(alvo)) return alvo.filter(ehString);

  const campos = lerCampo(meta, [
    'driverAdapterError',
    'cause',
    'constraint',
    'fields',
  ]);
  return Array.isArray(campos) ? campos.filter(ehString) : [];
}

function lerCampo(objeto: unknown, caminho: string[]): unknown {
  let atual: unknown = objeto;
  for (const chave of caminho) {
    if (typeof atual !== 'object' || atual === null) return undefined;
    atual = (atual as Record<string, unknown>)[chave];
  }
  return atual;
}

function lerString(objeto: unknown, caminho: string[]): string | undefined {
  const valor = lerCampo(objeto, caminho);
  return ehString(valor) ? valor : undefined;
}

function ehString(valor: unknown): valor is string {
  return typeof valor === 'string';
}
