"use client";

import Button from "@/components/Button";

interface ZonaDePerigoProps {
  deleting: boolean;
  handleDelete: () => void;
}

export default function ZonaDePerigo({ deleting, handleDelete }: ZonaDePerigoProps) {
  return (
    <div
      style={{
        width: "100%",
        marginTop: "16px",
        border: "0.5px solid #e07a6e",
        borderRadius: "16px",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        background: "#fef3ee",
      }}
    >
      <div>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "#2B1F14", margin: 0 }}>
          Excluir profissional
        </p>
        <p style={{ fontSize: "12px", color: "#5a5a50", marginTop: "3px" }}>
          Remove permanentemente o profissional do sistema. Esta ação não pode ser desfeita.
        </p>
      </div>
      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={handleDelete}
        disabled={deleting}
        style={{ flexShrink: 0 }}
      >
        {deleting ? (
          <svg style={{ animation: "spin 0.8s linear infinite" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        )}
        {deleting ? "Excluindo..." : "Excluir profissional"}
      </Button>
    </div>
  );
}
