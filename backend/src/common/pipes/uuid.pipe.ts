import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';

const MENSAGEM_UUID_INVALIDO = 'Identificador inválido: UUID esperado.';

/** Valida parâmetros de rota/consulta que precisam ser UUID (400 se não forem). */
export const UUID_PIPE = new ParseUUIDPipe({
  exceptionFactory: () => new BadRequestException(MENSAGEM_UUID_INVALIDO),
});

/** Variante para query string opcional: ausente passa, presente precisa ser UUID. */
export const UUID_OPCIONAL_PIPE = new ParseUUIDPipe({
  optional: true,
  exceptionFactory: () => new BadRequestException(MENSAGEM_UUID_INVALIDO),
});
