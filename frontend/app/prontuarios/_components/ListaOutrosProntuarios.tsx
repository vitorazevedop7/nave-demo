"use client";

import { nomeEspecialidade } from "@/lib/visibilidade";
import { formatarDataHora, rotuloOrigemAcesso } from "../_lib/helpers";
import type { OutroProntuarioResumo } from "../_lib/tipos";

interface ListaOutrosProntuariosProps {
  outrosProntuarios: OutroProntuarioResumo[];
  loadingOutrosProntuarios: boolean;
  erroOutrosProntuarios: string;
  loadingOutroProntuarioId: string | null;
  abrirOutroProntuario: (resumo: OutroProntuarioResumo) => void;
}

export default function ListaOutrosProntuarios({ outrosProntuarios, loadingOutrosProntuarios, erroOutrosProntuarios, loadingOutroProntuarioId, abrirOutroProntuario }: ListaOutrosProntuariosProps) {
  return (
    <div style={{ background: "#fff", borderRadius: "16px", border: "0.5px solid #d2c3b2", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      {erroOutrosProntuarios && (
        <div role="alert" style={{ padding: "12px 20px", background: "#FDE8E4", color: "#A9473C", fontSize: "12px" }}>
          {erroOutrosProntuarios}
        </div>
      )}
      {loadingOutrosProntuarios ? (
        <div style={{ padding: "48px 20px", textAlign: "center", color: "#9B8E84", fontSize: "13px" }}>
          Carregando prontuários de outros profissionais...
        </div>
      ) : outrosProntuarios.length === 0 ? (
        <div style={{ padding: "48px 20px", textAlign: "center", color: "#9B8E84", fontSize: "13px", fontWeight: 600 }}>
          Nenhum prontuário de outros profissionais está acessível para você.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "0.5px solid #e0dbd2", fontSize: "10px", color: "#9B8E84", textAlign: "left", background: "#faf9f6" }}>
              <th style={{ padding: "12px 20px" }}>BENEFICIÁRIA</th>
              <th style={{ padding: "12px 20px" }}>AUTOR</th>
              <th style={{ padding: "12px 20px" }}>ESPECIALIDADE</th>
              <th style={{ padding: "12px 20px" }}>ACESSO</th>
              <th style={{ padding: "12px 20px" }}>DATA</th>
              <th style={{ padding: "12px 20px" }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {outrosProntuarios.map((item) => (
              <tr key={item.id} style={{ borderBottom: "0.5px solid #f0ece4", fontSize: "13px" }}>
                <td style={{ padding: "14px 20px", fontWeight: 600 }}>{item.beneficiarias.nome}</td>
                <td style={{ padding: "14px 20px", color: "#6B5E54" }}>{item.usuarios.nome}</td>
                <td style={{ padding: "14px 20px", color: "#6B5E54" }}>{nomeEspecialidade(item.especialidade)}</td>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{ display: "inline-block", padding: "4px 9px", borderRadius: "999px", background: "#F1EEE8", color: "#6B5E54", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {rotuloOrigemAcesso(item)}
                  </span>
                </td>
                <td style={{ padding: "14px 20px", color: "#6B5E54" }}>
                  {item.criado_em ? formatarDataHora(item.criado_em) : "—"}
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <button
                    type="button"
                    onClick={() => abrirOutroProntuario(item)}
                    disabled={loadingOutroProntuarioId !== null}
                    style={{ background: "#E07A6E", color: "#fff", border: 0, padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    {loadingOutroProntuarioId === item.id ? "Abrindo..." : "Abrir"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
