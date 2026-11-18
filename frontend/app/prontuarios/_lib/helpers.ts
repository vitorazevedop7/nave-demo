import { formatarTimestamp, parseDataPura } from "@/lib/date";
import type { FormAcupuntura, FormAnamnese } from "@/lib/types/prontuario";
import { nomeEspecialidade } from "@/lib/visibilidade";
import { initialAcupuntura } from "./formularios";
import type { Agendamento, OutroProntuarioResumo } from "./tipos";

export function rotuloOrigemAcesso(prontuario: OutroProntuarioResumo): string {
  switch (prontuario.origem_acesso) {
    case "COMPARTILHADO_COM_VOCE":
      return "Compartilhado com você";
    case "ESPECIALIDADE":
      return nomeEspecialidade(prontuario.especialidade);
    case "GESTORAS":
      return "Gestoras";
    case "EQUIPE_CLINICA":
      return "Equipe clínica";
  }
}

export const normalizarTexto = (v?: string) =>
  (v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export const mapearEstadoCivil = (v?: string): string => {
  const n = normalizarTexto(v);
  if (!n) return "";
  if (n.includes("solteir")) return "Solteira";
  if (n.includes("casad")) return "Casada";
  if (n.includes("divorciad") || n.includes("separad")) return "Divorciada";
  if (n.includes("viuv")) return "Viúva";
  if (n.includes("uniao") || n.includes("estavel")) return "União estável";
  return "";
};

export const mapearEscolaridade = (v?: string): string => {
  const n = normalizarTexto(v);
  if (!n) return "";
  if (n.includes("sem escolaridade") || n.includes("nao alfabetiz") || n.includes("não alfabetiz")) return "Sem escolaridade";
  if (n.includes("alfabetiz")) return "Alfabetizada";
  if (n.includes("fundamental")) return "Fundamental";
  if (n.includes("medio") || n.includes("médio")) return "Médio";
  if (n.includes("superior")) return "Superior";
  if (n.includes("pos") || n.includes("pós")) return "Pós-graduação";
  return "";
};

export const normalizarSelecionavel = (key: keyof FormAnamnese, value: string): string => {
  if (key === "civil") return mapearEstadoCivil(value);
  if (key === "escolaridade") return mapearEscolaridade(value);
  return value;
};

export const toDateInputValue = (v: unknown): string => {
  if (!v) return "";
  const s = String(v);
  const match = s.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
};

export const parseAcupunturaExtras = (value?: string): Partial<FormAcupuntura> => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const extras: Partial<FormAcupuntura> = {};
    (Object.keys(initialAcupuntura) as Array<keyof FormAcupuntura>).forEach((key) => {
      const candidate = parsed[key];
      if (typeof candidate === "string") extras[key] = candidate;
    });
    return extras;
  } catch {
    return {};
  }
};

export const buildAcupunturaObservacoes = (form: FormAcupuntura): string => JSON.stringify(form);

export function dbParaFormStrings(
  rec: Record<string, unknown>,
  dateFields: Set<string>,
  boolFields: Set<string> = new Set(),
): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const [k, v] of Object.entries(rec)) {
    if (k === "id" || k === "prontuario_id") continue;
    if (boolFields.has(k)) {
      out[k] = v === true;
    } else if (dateFields.has(k)) {
      out[k] = toDateInputValue(v);
    } else if (typeof v === "number") {
      out[k] = String(v);
    } else {
      out[k] = v != null ? String(v) : "";
    }
  }
  return out;
}

export const calcularIdade = (dataNascimento?: string): string => {
  const nascimento = parseDataPura(dataNascimento);
  if (!nascimento) return "";
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade -= 1;
  return String(Math.max(idade, 0));
};

export const ehCrianca = (ag: Agendamento): boolean => {
  const dn = ag.beneficiarias?.data_nascimento;
  if (!dn) return false;
  const idade = parseInt(calcularIdade(dn), 10);
  return !isNaN(idade) && idade < 18;
};

export const formatarDataHora = (iso: string) =>
  formatarTimestamp(iso, {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
