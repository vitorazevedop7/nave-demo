"use client";

import type { CSSProperties, ReactNode } from "react";
import { parseDataPura } from "@/lib/date";
import type { Doacao } from "../_lib/tipos";

/* ─── Palette helpers ───────────────────────────────────────── */
export const card: CSSProperties = {
  background: "var(--bg-card)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "0.5px solid var(--border-card)",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 2px 12px rgba(224,122,110,0.06)",
};

/* ─── Sub-components ────────────────────────────────────────── */

export function StatCard({
  label,
  value,
  icon,
  accent = false,
  action,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: boolean;
  action?: ReactNode;
}) {
  return (
    <div
      className="dash-metric-card dash-metric-card--salmon"
      style={{
        ...card,
        background: accent ? "var(--salmon-primary)" : "var(--bg-card)",
        padding: "22px 26px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "18px",
        flex: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "18px", flex: 1 }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: accent ? "rgba(255,255,255,0.2)" : "var(--salmon-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: accent ? "rgba(255,255,255,0.75)" : "var(--text-muted)",
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontSize: "1.7rem",
              fontWeight: 800,
              color: accent ? "#fff" : "var(--text-primary)",
              margin: 0,
              lineHeight: 1,
            }}
          >
            {value}
          </p>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ─── SVG Icons ──────────────────────────────────────────────── */
export function IconGift() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--salmon-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M12 4v4M9 8h6V6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2Z" />
      <line x1="12" y1="8" x2="12" y2="20" />
    </svg>
  );
}

export function IconMoney() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--salmon-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" fill="var(--salmon-primary)" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17v.01" />
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export function IconPeople() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--salmon-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function BarChart({ doacoes }: { doacoes: Doacao[] }) {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const now = new Date();
  const data = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const total = doacoes
      .filter((d2) => {
        const dd = parseDataPura(d2.data);
        return dd?.getMonth() === m && dd?.getFullYear() === y && d2.tipo === "DINHEIRO";
      })
      .reduce((s, d2) => {
        const valor = typeof d2.valor === 'string' ? parseFloat(d2.valor) : (d2.valor ?? 0);
        return s + valor;
      }, 0);
    const isCurrent = m === now.getMonth() && y === now.getFullYear();
    return { label: months[m], total, isCurrent };
  });

  const max = Math.max(...data.map((d) => d.total), 1);
  const W = 300;
  const H = 60;
  const barW = 28;
  const gap = (W - data.length * barW) / (data.length + 1);

  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: "100%", overflow: "visible" }}>
        {[0.33, 0.66, 1].map((t) => (
          <line
            key={t}
            x1={0} y1={H - t * H}
            x2={W} y2={H - t * H}
            stroke="rgba(220,200,190,0.5)"
            strokeWidth="0.5"
            strokeDasharray="4,4"
          />
        ))}
        {data.map((d, i) => {
          const barH = Math.max((d.total / max) * H, d.total > 0 ? 4 : 0);
          const x = gap + i * (barW + gap);
          return (
            <g key={i}>
              <rect x={x} y={0} width={barW} height={H} rx={6}
                fill="var(--salmon-light)" opacity={0.5} />
              {barH > 0 && (
                <rect className="dash-chart-bar"
                  x={x} y={H - barH} width={barW} height={barH} rx={6}
                  fill={d.isCurrent ? "var(--salmon-dark)" : "var(--salmon-primary)"}
                  opacity={d.isCurrent ? 1 : 0.8}
                />
              )}
              <text x={x + barW / 2} y={H + 14} textAnchor="middle"
                fontSize="8.5"
                fontWeight={d.isCurrent ? "700" : "400"}
                fill={d.isCurrent ? "var(--text-primary)" : "var(--text-muted)"}>
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "14px", marginTop: "6px" }}>
        {[["var(--salmon-primary)", "Anteriores"], ["var(--salmon-dark)", "Mês atual"]].map(([color, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: color }} />
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div
      style={{
        height: "6px",
        borderRadius: "99px",
        background: "var(--salmon-light)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: "99px",
          background: "var(--salmon-primary)",
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}

export function Badge({ tipo }: { tipo: string }) {
  const isDinheiro = tipo === "DINHEIRO";
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: "99px",
        background: isDinheiro ? "var(--green-light)" : "var(--salmon-light)",
        color: isDinheiro ? "var(--green-dark)" : "var(--salmon-dark)",
      }}
    >
      {isDinheiro ? "Dinheiro" : tipo.charAt(0) + tipo.slice(1).toLowerCase()}
    </span>
  );
}
