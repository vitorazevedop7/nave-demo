/**
 * Utilitários de data.
 *
 * A API expõe dois tipos distintos de campo temporal:
 *
 * 1. **Data pura** (coluna Postgres `date`): `data_nascimento`, `bazares.data`,
 *    `doacoes.data`, `data_atendimento`, `data_assinatura`. Chega serializada como
 *    `"2018-06-15T00:00:00.000Z"` — o horário é artificial, o valor é só o dia.
 *    Passar isso por `new Date(iso).toLocaleDateString()` converte de UTC para o
 *    fuso local (UTC-3 em Brasília) e joga a data para o dia anterior.
 *    Use `parseDataPura` / `formatarDataPura` / `paraInputDate`.
 *
 * 2. **Timestamp** (coluna `timestamp`): `criado_em`, `data_triagem`, `data_hora`.
 *    É um instante real, então converter para o fuso local é o comportamento
 *    correto. Use `formatarTimestamp`.
 */

const RE_DATA = /^(\d{4})-(\d{2})-(\d{2})/;

const FORMATO_PADRAO: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

type ValorData = string | Date | null | undefined;

function paraTexto(valor: ValorData): string | null {
  if (!valor) return null;
  return valor instanceof Date ? valor.toISOString() : String(valor);
}

/**
 * Converte uma data pura da API em um `Date` à meia-noite **local**, preservando
 * o dia exatamente como está armazenado. Retorna `null` se o valor for vazio ou
 * não começar com `YYYY-MM-DD`.
 */
export function parseDataPura(valor: ValorData): Date | null {
  const texto = paraTexto(valor);
  const m = texto?.match(RE_DATA);
  if (!m) return null;
  const data = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(data.getTime()) ? null : data;
}

/** Formata uma data pura em pt-BR (padrão: `dd/mm/aaaa`), sem conversão de fuso. */
export function formatarDataPura(
  valor: ValorData,
  opcoes: Intl.DateTimeFormatOptions = FORMATO_PADRAO,
): string {
  const data = parseDataPura(valor);
  return data ? data.toLocaleDateString("pt-BR", opcoes) : "";
}

/** Extrai `YYYY-MM-DD` para preencher `<input type="date">`. */
export function paraInputDate(valor: ValorData): string {
  const texto = paraTexto(valor);
  return texto?.match(RE_DATA)?.[0] ?? "";
}

/** Data de hoje no fuso local, no formato `YYYY-MM-DD`. */
export function hojeInputDate(): string {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${hoje.getFullYear()}-${mes}-${dia}`;
}

/** Formata um timestamp real em pt-BR, convertendo para o fuso local. */
export function formatarTimestamp(
  valor: ValorData,
  opcoes: Intl.DateTimeFormatOptions = FORMATO_PADRAO,
): string {
  if (!valor) return "";
  const data = valor instanceof Date ? valor : new Date(valor);
  return isNaN(data.getTime()) ? "" : data.toLocaleDateString("pt-BR", opcoes);
}
