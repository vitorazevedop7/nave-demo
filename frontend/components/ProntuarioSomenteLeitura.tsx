"use client";

import { formatarDataPura, formatarTimestamp } from "@/lib/date";

interface ProntuarioSomenteLeituraProps {
  prontuario: {
    especialidade: string;
    autor?: string;
    criado_em?: string;
    descricao?: string;
    beneficiarias?: { nome: string };
    prontuarios_psicologia_adulto?: Record<string, unknown> | null;
    prontuarios_psicologia_crianca?: Record<string, unknown> | null;
    prontuarios_fisioterapia?: Record<string, unknown> | null;
    prontuarios_acupuntura?: Record<string, unknown> | null;
  };
}

const fichas = [
  ["prontuarios_psicologia_adulto", "Anamnese psicológica — adulto"],
  ["prontuarios_psicologia_crianca", "Anamnese psicológica — criança"],
  ["prontuarios_fisioterapia", "Ficha de fisioterapia"],
  ["prontuarios_acupuntura", "Ficha de acupuntura"],
] as const;

const camposInternos = new Set(["id", "prontuario_id", "dados_json", "criado_em", "atualizado_em"]);
const camposDataPura = new Set([
  "data_atendimento",
  "data_assinatura",
  "data_consulta",
  "data_nascimento",
]);
const camposTimestamp = new Set(["criado_em", "atualizado_em"]);

function rotulo(campo: string) {
  const texto = campo.replaceAll("_", " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function valorVisivel(valor: unknown, campo?: string): string {
  if ((typeof valor === "string" || valor instanceof Date) && campo) {
    if (camposDataPura.has(campo)) return formatarDataPura(valor) || String(valor);
    if (camposTimestamp.has(campo)) {
      return formatarTimestamp(valor, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) || String(valor);
    }
  }
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (Array.isArray(valor)) return valor.map((item) => valorVisivel(item, campo)).join(", ");
  if (valor && typeof valor === "object") return JSON.stringify(valor);
  return String(valor ?? "");
}

function expandirFicha(ficha: Record<string, unknown>) {
  const camposExpandidos = { ...ficha };

  for (const campoJson of ["dados_json", "observacoes_clinicas"]) {
    const valor = ficha[campoJson];
    if (typeof valor === "string" && valor) {
      try {
        const convertido = JSON.parse(valor) as unknown;
        if (convertido && typeof convertido === "object" && !Array.isArray(convertido)) {
          Object.assign(camposExpandidos, convertido);
          delete camposExpandidos[campoJson];
        }
      } catch {
        // Texto clínico livre continua sendo exibido sem transformação.
      }
    }
  }

  return Object.entries(camposExpandidos).filter(
    ([campo, valor]) => !camposInternos.has(campo) && valor !== null && valor !== undefined && valor !== "",
  );
}

export default function ProntuarioSomenteLeitura({ prontuario }: ProntuarioSomenteLeituraProps) {
  return (
    <div style={{ padding: "24px", display: "grid", gap: "24px", maxHeight: "72vh", overflowY: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
        <Info label="Beneficiária" value={prontuario.beneficiarias?.nome || "—"} />
        <Info label="Autor" value={prontuario.autor || "—"} />
        <Info label="Especialidade" value={rotulo(prontuario.especialidade.toLowerCase())} />
        <Info
          label="Data"
          value={prontuario.criado_em ? valorVisivel(prontuario.criado_em, "criado_em") : "—"}
        />
      </div>

      {prontuario.descricao && (
        <section>
          <h3 style={{ margin: "0 0 8px", fontSize: "13px", color: "#2B1F14" }}>Descrição</h3>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: 1.6, color: "#55483D" }}>
            {prontuario.descricao}
          </p>
        </section>
      )}

      {fichas.map(([chave, titulo]) => {
        const ficha = prontuario[chave];
        if (!ficha) return null;
        const campos = expandirFicha(ficha);
        if (campos.length === 0) return null;

        return (
          <section key={chave}>
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", color: "#2B1F14" }}>{titulo}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              {campos.map(([campo, valor]) => (
                <Info key={campo} label={rotulo(campo)} value={valorVisivel(valor, campo)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: "10px", background: "#FAF9F6", border: "1px solid #EEE8DF" }}>
      <div style={{ marginBottom: "4px", fontSize: "10px", fontWeight: 700, color: "#8B7C70", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: "13px", lineHeight: 1.5, color: "#2B1F14" }}>
        {value}
      </div>
    </div>
  );
}
