"use client";

import {
  descreverUsuario,
  resumoVisibilidade,
  type UsuarioCompartilhavel,
  type Visibilidade,
} from "@/lib/visibilidade";

/**
 * Quem tem acesso a este prontuário, em leitura pura.
 *
 * `podeGerenciar` marca o autor. Só ele vê a lista de pessoas incluídas e a
 * indicação de que isso é editável; para os demais fica só a frase do nível,
 * como informação.
 */
export function ResumoAcesso({
  visibilidade,
  especialidade,
  compartilhamentos = [],
  usuarios = [],
  podeGerenciar,
}: {
  visibilidade?: Visibilidade;
  especialidade?: string | null;
  compartilhamentos?: string[];
  usuarios?: UsuarioCompartilhavel[];
  podeGerenciar: boolean;
}) {
  const incluidos = compartilhamentos
    .map((id) => usuarios.find((u) => u.id === id))
    .filter((u): u is UsuarioCompartilhavel => !!u);

  const naoResolvidos = compartilhamentos.length - incluidos.length;

  return (
    <div
      style={{
        marginTop: "10px",
        padding: "12px 14px",
        borderRadius: "16px",
        background: "rgba(106, 158, 110, 0.08)",
        border: "0.5px solid rgba(106, 158, 110, 0.45)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#3D7845",
        }}
      >
        {resumoVisibilidade(visibilidade, especialidade)}
      </div>

      {podeGerenciar && (
        <>
          {compartilhamentos.length > 0 ? (
            <div
              style={{
                marginTop: "8px",
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              {incluidos.map((usuario) => (
                <span
                  key={usuario.id}
                  title={descreverUsuario(usuario) || undefined}
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#2B1F14",
                    background: "#fff",
                    border: "0.5px solid #d6d0c4",
                    borderRadius: "16px",
                    padding: "3px 10px",
                  }}
                >
                  {usuario.nome}
                </span>
              ))}
              {naoResolvidos > 0 && (
                <span style={{ fontSize: "11px", color: "#6B5E54" }}>
                  +{naoResolvidos} incluído(s)
                </span>
              )}
            </div>
          ) : (
            <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#6B5E54" }}>
              Ninguém incluído individualmente.
            </p>
          )}
          <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#6B5E54" }}>
            Quem tem acesso pode ler — editar e excluir continuam sendo só seus.
          </p>
        </>
      )}
    </div>
  );
}

/**
 * Carimbo do atendimento: data, profissional e especialidade, sem conteúdo
 * clínico. Não abre e não tenta renderizar campos que a API não mandou.
 */
export function CarimboRestrito({
  profissional,
  especialidade,
}: {
  profissional?: string;
  especialidade?: string;
}) {
  return (
    <div style={{ display: "grid", gap: "8px" }}>
      <span
        style={{
          justifySelf: "start",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          color: "#C05A48",
          background: "#FDE8E4",
          border: "0.5px solid #F4CFC9",
          borderRadius: "16px",
          padding: "4px 12px",
        }}
      >
        Conteúdo restrito
      </span>
      <div style={{ fontSize: "13px", color: "#2B1F14" }}>
        <strong>Profissional:</strong> {profissional || "—"}
      </div>
      <div style={{ fontSize: "13px", color: "#2B1F14" }}>
        <strong>Especialidade:</strong> {especialidade || "—"}
      </div>
      <p style={{ margin: 0, fontSize: "11.5px", color: "#6B5E54" }}>
        O registro existe, mas o conteúdo clínico não foi compartilhado com
        você.
      </p>
    </div>
  );
}
