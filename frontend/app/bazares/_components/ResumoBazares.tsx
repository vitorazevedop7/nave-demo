"use client";

import { formatCurrency } from "../_lib/formatacao";

interface ResumoBazaresProps {
  totalBazares: number;
  proximoBazarNome: string;
  totalArrecadado: number;
  loading: boolean;
}

export default function ResumoBazares({ totalBazares, proximoBazarNome, totalArrecadado, loading }: ResumoBazaresProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      {[
        {
          label: "Total de Bazares",
          value: totalBazares,
          iconBg: "#D4EDD4",
          iconColor: "#3D7845",
          isText: false,
        },
        {
          label: "Próximo Bazar",
          value: proximoBazarNome,
          iconBg: "#e0f2fe",
          iconColor: "#0369a1",
          isText: true, // Indica que é um texto longo
        },
        {
          label: "Total Arrecadado",
          value: formatCurrency(totalArrecadado),
          iconBg: "#fef3c7",
          iconColor: "#ea580c",
          isText: false,
        },
      ].map((s) => (
        <div
          key={s.label}
          style={{
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "0.5px solid rgba(220, 200, 190, 0.45)",
            borderRadius: "16px",
            padding: "18px 20px",
            boxShadow: "0 2px 12px rgba(224, 122, 110, 0.05)",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            overflow: "hidden", // Impede que o cartão estique
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: s.iconBg,
              color: s.iconColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M7 7h10M7 12h10M7 17h10" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}> {/* minWidth 0 permite o truncate funcionar no flexbox */}
            <p style={{ fontSize: "11px", color: "#6B5E54", fontWeight: 600, margin: 0 }}>
              {s.label}
            </p>
            <p
              title={String(s.value)} // Mostra o nome completo ao passar o mouse
              style={{
                fontSize: s.isText && String(s.value).length > 12 ? "1.1rem" : "1.6rem",
                fontWeight: 700,
                color: "#2B1F14",
                lineHeight: 1.1,
                marginTop: "2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "200px" // Limite visual
              }}
            >
              {loading ? "—" : s.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
