"use client";

import Link from "next/link";
import Button from "@/components/Button";
import type { Usuario } from "../_lib/tipos";

interface RodapeFormularioProps {
  usuario: Usuario | null;
  deactivating: boolean;
  handleToggleAtivo: () => void;
  saving: boolean;
}

export default function RodapeFormulario({ usuario, deactivating, handleToggleAtivo, saving }: RodapeFormularioProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "32px",
        paddingTop: "24px",
        borderTop: "0.5px solid #e0dbd2",
      }}
    >
      {/* Ação destrutiva à esquerda */}
      <button
        type="button"
        onClick={handleToggleAtivo}
        disabled={deactivating}
        style={{
          padding: "9px 16px",
          background: "#fef3ee",
          border: "0.5px solid #e07a6e",
          borderRadius: "10px",
          fontSize: "13px",
          fontWeight: 600,
          color: "#c05a2a",
          cursor: deactivating ? "not-allowed" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          opacity: deactivating ? 0.6 : 1,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { if (!deactivating) e.currentTarget.style.background = "#fce8e0"; }}
        onMouseLeave={(e) => { if (!deactivating) e.currentTarget.style.background = "#fef3ee"; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {usuario?.ativo ? (
            <><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></>
          ) : (
            <><polyline points="20 6 9 17 4 12" /></>
          )}
        </svg>
        {usuario?.ativo ? "Desativar profissional" : "Reativar profissional"}
      </button>

      {/* Ações à direita */}
      <div style={{ display: "flex", gap: "12px" }}>
        <Link
          href="/profissionais"
          style={{
            padding: "10px 20px",
            border: "0.5px solid #d6d0c4",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#6B5E54",
            background: "#f5f2eb",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Cancelar
        </Link>

        <Button type="submit" size="sm" disabled={saving}>
          {saving && (
            <svg style={{ animation: "spin 0.8s linear infinite" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          )}
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}
