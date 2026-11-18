"use client";

import { formatarDataPura } from "@/lib/date";
import type { Bazar } from "@/lib/types/bazares";
import { formatCurrency, formatTime } from "../_lib/formatacao";

interface CartaoBazarProps {
  bazar: Bazar;
  canEdit: boolean;
  openEditBazar: (bazar: Bazar) => void;
  handleDelete: (id: string, nome: string) => void;
}

export default function CartaoBazar({ bazar, canEdit, openEditBazar, handleDelete }: CartaoBazarProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e0dbd2",
        borderRadius: "12px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 8px 24px rgba(150, 65, 45, 0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Card Header */}
      <div style={{ padding: "16px 16px 12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
            marginBottom: "8px",
          }}
        >
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "#2B1F14",
              margin: 0,
              flex: 1,
            }}
          >
            {bazar.nome}
          </h3>
          {canEdit && (
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                aria-label={`Editar ${bazar.nome}`}
                onClick={() => openEditBazar(bazar)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3D7845",
                  cursor: "pointer",
                  padding: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Editar
              </button>
              <button
                type="button"
                aria-label={`Excluir ${bazar.nome}`}
                onClick={() => handleDelete(bazar.id, bazar.nome)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#DC2626",
                  cursor: "pointer",
                  padding: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Excluir
              </button>
            </div>
          )}
        </div>
        {bazar.descricao && (
          <p
            style={{
              fontSize: "12px",
              color: "#9B8E84",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {bazar.descricao.substring(0, 60)}
            {bazar.descricao.length > 60 ? "..." : ""}
          </p>
        )}
      </div>

      {/* Card Content */}
      <div style={{ padding: "12px 16px", flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <p style={{ fontSize: "11px", color: "#6B5E54", fontWeight: 600, margin: 0 }}>
              Data
            </p>
            <p style={{ fontSize: "13px", color: "#2B1F14", margin: "2px 0 0" }}>
              {formatarDataPura(bazar.data)}
            </p>
          </div>

          {(bazar.horario_inicio || bazar.horario_fim) && (
            <div>
              <p style={{ fontSize: "11px", color: "#6B5E54", fontWeight: 600, margin: 0 }}>
                Horário
              </p>
              <p style={{ fontSize: "13px", color: "#2B1F14", margin: "2px 0 0" }}>
                {formatTime(bazar.horario_inicio)} -{" "}
                {formatTime(bazar.horario_fim)}
              </p>
            </div>
          )}

          {bazar.local && (
            <div>
              <p style={{ fontSize: "11px", color: "#6B5E54", fontWeight: 600, margin: 0 }}>
                Local
              </p>
              <p style={{ fontSize: "13px", color: "#2B1F14", margin: "2px 0 0" }}>
                {bazar.local}
              </p>
            </div>
          )}

          {bazar.bazar_profissionais.length > 0 && (
            <div>
              <p style={{ fontSize: "11px", color: "#6B5E54", fontWeight: 600, margin: 0 }}>
                Profissionais ({bazar.bazar_profissionais.length})
              </p>
              <div style={{ marginTop: "4px" }}>
                {bazar.bazar_profissionais.slice(0, 3).map((bp) => (
                  <p
                    key={bp.usuarios.id}
                    style={{
                      fontSize: "12px",
                      color: "#9B8E84",
                      margin: "2px 0",
                    }}
                  >
                    • {bp.usuarios.nome}
                  </p>
                ))}
                {bazar.bazar_profissionais.length > 3 && (
                  <p style={{ fontSize: "12px", color: "#9B8E84", margin: "2px 0" }}>
                    + {bazar.bazar_profissionais.length - 3} mais
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "0.5px solid #e0dbd2",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <p style={{ fontSize: "11px", color: "#6B5E54", fontWeight: 600, margin: 0 }}>
            Total Arrecadado
          </p>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#ea580c", margin: "2px 0 0" }}>
            {formatCurrency(bazar.total_arrecadado ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
