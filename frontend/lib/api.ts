export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
export const API_URL = API_BASE;

const TRADUCOES_VALIDACAO: Record<string, string> = {
  "email must be an email": "Informe um e-mail válido.",
  "senha must be longer than or equal to 6 characters": "A senha deve ter pelo menos 6 caracteres.",
  "senha must be a string": "A senha é obrigatória.",
};

/** Mensagem amigável a partir de um status HTTP, usada quando o corpo não traz texto. */
export function mensagemPorStatus(status: number, fallback: string): string {
  switch (status) {
    case 400:
      return "Dados inválidos. Revise os campos e tente novamente.";
    case 401:
      return "Sua sessão expirou. Entre novamente.";
    case 403:
      return "Você não tem permissão para realizar esta ação.";
    case 404:
      return "Registro não encontrado.";
    case 409:
      return "Já existe um registro com estes dados.";
    case 429:
      return "Muitas tentativas. Aguarde um minuto.";
    default:
      return status >= 500 ? "Algo deu errado no servidor. Tente novamente em instantes." : fallback;
  }
}

/**
 * Extrai a mensagem de erro de uma resposta HTTP da API.
 * Trata o formato do NestJS (`message` string ou array de validações),
 * traduz mensagens conhecidas e cai para uma mensagem por status.
 * Para 429 e 5xx a mensagem padronizada tem prioridade.
 */
export async function extrairMensagemErro(res: Response, fallback = "Não foi possível concluir a operação."): Promise<string> {
  if (res.status === 429 || res.status >= 500) return mensagemPorStatus(res.status, fallback);

  let corpo: { message?: unknown } | null = null;
  try {
    corpo = (await res.json()) as { message?: unknown };
  } catch {
    corpo = null;
  }

  const bruta = corpo?.message;
  const lista = Array.isArray(bruta) ? bruta : typeof bruta === "string" ? [bruta] : [];
  const texto = lista
    .filter((m): m is string => typeof m === "string" && m.trim() !== "")
    .map((m) => TRADUCOES_VALIDACAO[m] ?? m)
    .join(" ");

  return texto || mensagemPorStatus(res.status, fallback);
}

/** Lança um Error com a mensagem extraída quando a resposta não é 2xx. */
export async function garantirOk(res: Response, fallback?: string): Promise<Response> {
  if (!res.ok) throw new Error(await extrairMensagemErro(res, fallback));
  return res;
}

/** Mensagem legível a partir de qualquer valor capturado em um `catch`. */
export function mensagemDeErro(err: unknown, fallback = "Ocorreu um erro inesperado. Tente novamente."): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
