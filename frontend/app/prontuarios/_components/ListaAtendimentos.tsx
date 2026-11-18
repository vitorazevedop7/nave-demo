"use client";

import { Printer } from "lucide-react";
import { ehCrianca, formatarDataHora, normalizarTexto } from "../_lib/helpers";
import type { Agendamento } from "../_lib/tipos";
import { labelEspecialidade } from "../_lib/opcoes";

interface ListaAtendimentosProps {
  agendamentos: Agendamento[];
  loading: boolean;
  erroConsultaAgendamento: string;
  loadingAgId: string | null;
  abrirModalEspecialidade: (ag: Agendamento) => void;
  imprimirDaListagem: (ag: Agendamento) => void;
}

export default function ListaAtendimentos({ agendamentos, loading, erroConsultaAgendamento, loadingAgId, abrirModalEspecialidade, imprimirDaListagem }: ListaAtendimentosProps) {
  return (
    <div style={{ background: "#fff", borderRadius: "16px", border: "0.5px solid #d2c3b2", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      {erroConsultaAgendamento && (
        <div role="alert" style={{ padding: "12px 20px", background: "#FDE8E4", color: "#A9473C", fontSize: "12px" }}>
          {erroConsultaAgendamento}
        </div>
      )}
      {loading ? (
        <div style={{ padding: "48px 20px", textAlign: "center" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: "2.5px solid #e0dbd2", borderTopColor: "#E07A6E", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "13px", color: "#9B8E84" }}>Carregando agendamentos...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : agendamentos.length === 0 ? (
        <div style={{ padding: "48px 20px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "#9B8E84", fontWeight: 600 }}>Nenhum agendamento registrado</p>
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "0.5px solid #e0dbd2", fontSize: "10px", color: "#9B8E84", textAlign: "left", background: "#faf9f6" }}>
              <th style={{ padding: "12px 20px", fontWeight: 700 }}>BENEFICIÁRIA</th>
              <th style={{ padding: "12px 20px", fontWeight: 700 }}>DATA/HORA</th>
              <th style={{ padding: "12px 20px", fontWeight: 700 }}>ESPECIALIDADE</th>
              <th style={{ padding: "12px 20px", fontWeight: 700 }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {agendamentos.map((ag) => {
              const esp = ag.usuarios?.especialidade ?? "Sem especialidade";
              const espNorm = normalizarTexto(esp);
              const labelBtn = espNorm.includes("psicol")
                ? (ehCrianca(ag) ? "Anamnese Criança" : "Anamnese Adulto")
                : (labelEspecialidade[esp.toUpperCase()] || `Ficha ${esp}`);
              const isLoadingRow = loadingAgId === ag.id;
              return (
                <tr key={ag.id}
                  style={{ borderBottom: "0.5px solid #f0ece4", fontSize: "13px", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#faf9f6")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px 20px", fontWeight: 600, color: "#2B1F14" }}>
                    {ag.beneficiarias?.nome || "—"}
                  </td>
                  <td style={{ padding: "14px 20px", color: "#6B5E54", fontSize: "12px" }}>
                    {formatarDataHora(ag.data_hora)}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ display: "inline-block", background: "#f0f0f0", color: "#6B5E54", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500 }}>
                      {esp}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => abrirModalEspecialidade(ag)}
                      disabled={!!loadingAgId || !ag.beneficiaria_id}
                      title={!ag.beneficiaria_id ? "Agendamento sem beneficiária vinculada" : undefined}
                      style={{ background: "#E07A6E", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: (loadingAgId || !ag.beneficiaria_id) ? "not-allowed" : "pointer", opacity: (loadingAgId || !ag.beneficiaria_id) ? 0.6 : 1 }}
                    >
                      {isLoadingRow ? "Carregando..." : labelBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => imprimirDaListagem(ag)}
                      disabled={!!loadingAgId || !ag.beneficiaria_id}
                      title="Imprimir PDF"
                      aria-label="Imprimir PDF"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "30px",
                        height: "30px",
                        flexShrink: 0,
                        background: "transparent",
                        border: "1px solid #e8ded3",
                        borderRadius: "6px",
                        color: "#6B5E54",
                        cursor: (loadingAgId || !ag.beneficiaria_id) ? "not-allowed" : "pointer",
                        opacity: (loadingAgId || !ag.beneficiaria_id) ? 0.5 : 1,
                      }}
                    >
                      <Printer size={14} />
                    </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
