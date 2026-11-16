import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { validate } from 'class-validator';

/**
 * Valida um payload com as mesmas opções do `ValidationPipe` global
 * (`whitelist` + `forbidNonWhitelisted`) e devolve as propriedades com erro.
 */
export async function propriedadesInvalidas<T extends object>(
  classe: ClassConstructor<T>,
  payload: Record<string, unknown>,
): Promise<string[]> {
  const erros = await validate(plainToInstance(classe, payload), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return erros.map((erro) => erro.property);
}
