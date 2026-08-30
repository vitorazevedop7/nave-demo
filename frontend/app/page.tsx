"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area, CartesianGrid,
} from "recharts";
import { getUsuario, type Usuario } from "@/lib/auth";
import {
  fetchDashboardStats,
  type DashboardStats,
  type GestoraStats,
  type TriadoraStats,
  type ProfissionalStats,
  type AgendaItem,
  type FilaItem,
} from "@/lib/dashboard";

// ─── Estilos compartilhados ──────────────────────────────────────────────────

const card = {
  background: "rgba(255, 255, 255, 0.92)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "0.5px solid rgba(220, 200, 190, 0.45)",
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "0 2px 12px rgba(224, 122, 110, 0.05)",
} as const;

const CORES_ESP: Record<string, string> = {
  PSICOLOGIA: "#E07A6E",
  ASSISTENCIA_SOCIAL: "#3D7845",
  FISIOTERAPIA: "#C47A1E",
};
const CORES_FALLBACK = ["#E07A6E", "#3D7845", "#C47A1E", "#9B8E84", "#6A9E6E"];

const CORES_STATUS: Record<string, { bg: string; text: string }> = {
  AGENDADO:   { bg: "rgba(155,142,132,0.15)", text: "#6B5E54" },
  CONFIRMADO: { bg: "#D4EDD4",                text: "#3D7845" },
  REALIZADO:  { bg: "#D4EDD4",                text: "#3D7845" },
  CANCELADO:  { bg: "#FDE8E4",                text: "#C05A48" },
  "Em espera":{ bg: "#FEF3E2",                text: "#C47A1E" },
  Confirmado: { bg: "#D4EDD4",                text: "#3D7845" },
  Pendente:   { bg: "#FDE8E4",                text: "#C05A48" },
};

const MESES_ABREV = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MESES_FULL  = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

const PERIOD_LABEL: Record<"hoje" | "semana" | "mes", string> = {
  hoje: "hoje",
  semana: "na semana",
  mes: "no mês",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatarDia(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
function formatarMes(anoMes: string) {
  const [, m] = anoMes.split("-");
  return MESES_ABREV[parseInt(m) - 1] ?? anoMes;
}
function formatarHora(isoStr: string) {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function getFirstName(nome: string) { return nome.trim().split(" ")[0]; }
function getInitials(nome: string) {
  const p = nome.trim().split(" ");
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}
function corEsp(esp: string, idx: number) { return CORES_ESP[esp] ?? CORES_FALLBACK[idx % CORES_FALLBACK.length]; }
function tempoEspera(isoStr: string | null | undefined): string {
  if (!isoStr) return "";
  const diff = Date.now() - new Date(isoStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `há ${h}h ${m}min` : `há ${h}h`;
}

// ─── Tooltip customizado ─────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(255,255,255,0.97)",
      backdropFilter: "blur(8px)",
      border: "0.5px solid rgba(220,200,190,0.5)",
      borderRadius: "10px",
      padding: "8px 14px",
      fontSize: "12px",
      boxShadow: "0 4px 16px rgba(224,122,110,0.12)",
    }}>
      {label && <p style={{ color: "#9B8E84", fontWeight: 600, margin: "0 0 2px" }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: "#2B1F14", fontWeight: 700, margin: 0 }}>{p.value}</p>
      ))}
    </div>
  );
}

// ─── Metric Cards ────────────────────────────────────────────────────────────

interface MetricDef {
  label: string;
  value: string | number;
  sub?: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}

function MetricCards({ items }: { items: MetricDef[] }) {
  return (
    <div className="dash-metrics-grid" style={{ marginBottom: "16px" }}>
      {items.map((m, i) => (
        <div key={i} style={{ ...card, display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: m.iconBg, color: m.iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {m.icon}
          </div>
          <div>
            <p style={{ fontSize: "11px", color: "#9B8E84", fontWeight: 600, margin: "0 0 2px" }}>{m.label}</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#2B1F14", lineHeight: 1.1, margin: 0 }}>{m.value}</p>
            {m.sub && <p style={{ fontSize: "10px", color: "#9B8E84", margin: "1px 0 0" }}>{m.sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Fila de espera ───────────────────────────────────────────────────────────

const CORES_AVATAR = [
  { bg: "#FDE8E4", text: "#C05A48" },
  { bg: "#FEF3E2", text: "#C47A1E" },
  { bg: "#D4EDD4", text: "#3D7845" },
  { bg: "#E8E4FD", text: "#6B5AC0" },
];

function FilaPanel({ fila }: { fila: FilaItem[] }) {
  return (
    <div style={{ ...card, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#2B1F14", margin: "0 0 2px" }}>Fila de acolhimento</p>
          <p style={{ fontSize: "11px", color: "#9B8E84", margin: 0 }}>Beneficiárias aguardando</p>
        </div>
        <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "9999px", background: "#FDE8E4", color: "#C05A48" }}>
          {fila.length} na fila
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "12px" }}>
        {fila.length === 0 && (
          <p style={{ fontSize: "13px", color: "#9B8E84", textAlign: "center", padding: "16px 0" }}>Nenhuma beneficiária em espera</p>
        )}
        {fila.map((f, idx) => {
          const cor = CORES_AVATAR[idx % CORES_AVATAR.length];
          return (
            <div key={f.id} className="dash-queue-row" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px", background: "rgba(251,246,242,0.6)" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: cor.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: cor.text, flexShrink: 0 }}>
                {getInitials(f.nome)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#2B1F14", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.nome}</p>
              </div>
              <span style={{ fontSize: "10px", color: "#9B8E84", flexShrink: 0 }}>{tempoEspera(f.criado_em)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Agenda do dia ────────────────────────────────────────────────────────────

function AgendaPanel({ agenda }: { agenda: AgendaItem[] }) {
  return (
    <div style={{ ...card }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "#2B1F14", margin: 0 }}>Agenda do dia</p>
        <Link href="/agenda" style={{ fontSize: "12px", fontWeight: 600, color: "#E07A6E", textDecoration: "none" }}>
          Agenda completa →
        </Link>
      </div>
      {agenda.length === 0 && (
        <p style={{ fontSize: "13px", color: "#9B8E84", textAlign: "center", padding: "16px 0" }}>Nenhum agendamento para hoje</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {agenda.map((a) => {
          const statusKey = a.status in CORES_STATUS ? a.status : "AGENDADO";
          const s = CORES_STATUS[statusKey];
          const nomeB = a.beneficiarias?.nome ?? "—";
          const desc = a.usuarios
            ? `${a.encaminhamentos?.especialidade ?? a.usuarios.especialidade ?? "Atendimento"} · ${a.usuarios.nome}`
            : a.encaminhamentos?.especialidade ?? "Atendimento";
          return (
            <div key={a.id} className="dash-agenda-row" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "9px 0", borderBottom: "0.5px solid rgba(220,200,190,0.3)" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#9B8E84", minWidth: "36px", flexShrink: 0 }}>{formatarHora(a.data_hora)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#2B1F14", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nomeB}</p>
                <p style={{ fontSize: "11px", color: "#9B8E84", margin: "1px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{desc}</p>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "9999px", flexShrink: 0, background: s?.bg ?? "#FDE8E4", color: s?.text ?? "#C05A48" }}>
                {a.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BarChart wrapper ─────────────────────────────────────────────────────────

function BarPanel({ titulo, dados, xKey, yKey, cor }: { titulo: string; dados: object[]; xKey: string; yKey: string; cor: string }) {
  return (
    <div style={{ ...card, marginBottom: "12px" }}>
      <p style={{ fontSize: "13px", fontWeight: 700, color: "#2B1F14", margin: "0 0 16px" }}>{titulo}</p>
      {dados.length === 0 ? (
        <p style={{ fontSize: "12px", color: "#9B8E84", textAlign: "center", padding: "24px 0" }}>Sem dados no período</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dados} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(220,200,190,0.3)" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: "#9B8E84", fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#9B8E84" }} axisLine={false} tickLine={false} width={24} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(224,122,110,0.06)" }} />
            <Bar dataKey={yKey} fill={cor} radius={[5, 5, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── PieChart wrapper ─────────────────────────────────────────────────────────

function PiePanel({ titulo, dados, nomeKey, valorKey }: { titulo: string; dados: object[]; nomeKey: string; valorKey: string }) {
  const d = dados as Array<Record<string, string | number>>;
  const total = d.reduce((s, x) => s + Number(x[valorKey] ?? 0), 0);
  return (
    <div style={{ ...card, marginBottom: "12px" }}>
      <p style={{ fontSize: "13px", fontWeight: 700, color: "#2B1F14", margin: "0 0 4px" }}>{titulo}</p>
      {total === 0 ? (
        <p style={{ fontSize: "12px", color: "#9B8E84", textAlign: "center", padding: "24px 0" }}>Sem dados</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={d} dataKey={valorKey} nameKey={nomeKey} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3}>
                {d.map((entry, idx) => (
                  <Cell key={idx} fill={corEsp(String(entry[nomeKey] ?? ""), idx)} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v ?? 0}`, ""]} contentStyle={{ borderRadius: "10px", border: "0.5px solid rgba(220,200,190,0.5)", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
            {d.map((entry, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: corEsp(String(entry[nomeKey] ?? ""), idx), flexShrink: 0 }} />
                <span style={{ fontSize: "10px", color: "#6B5E54", fontWeight: 600 }}>
                  {String(entry[nomeKey] ?? "").replace(/_/g, " ")} ({entry[valorKey]})
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── AreaChart wrapper (doações) ──────────────────────────────────────────────

function AreaPanel({ titulo, dados, xKey, yKey }: { titulo: string; dados: object[]; xKey: string; yKey: string }) {
  return (
    <div style={{ ...card, marginBottom: "12px" }}>
      <p style={{ fontSize: "13px", fontWeight: 700, color: "#2B1F14", margin: "0 0 16px" }}>{titulo}</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={dados}>
          <defs>
            <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3D7845" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#3D7845" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(220,200,190,0.3)" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: "#9B8E84", fontWeight: 600 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#9B8E84" }} axisLine={false} tickLine={false} width={32} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey={yKey} stroke="#3D7845" strokeWidth={2} fill="url(#gradGreen)" dot={{ r: 3, fill: "#3D7845" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Hero Card ────────────────────────────────────────────────────────────────

function HeroCard({ titulo, subtitulo, miniData, primeiroNome, chartLabel }: {
  titulo: React.ReactNode;
  subtitulo?: string;
  miniData?: Array<{ total: number }>;
  primeiroNome: string;
  chartLabel?: string;
}) {
  const maxVal = miniData ? Math.max(...miniData.map((b) => b.total), 1) : 1;
  return (
    <div
      style={{ background: "linear-gradient(110deg, #FDE8E4 45%, #DFE9DF 100%)", borderRadius: "20px", padding: "24px 28px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px" }}
      className="dash-hero-card"
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#E07A6E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
          BEM-VINDA, {primeiroNome.toUpperCase()}
        </p>
        <h1 style={{ fontSize: "1.55rem", fontWeight: 800, color: "#2B1F14", lineHeight: 1.25, margin: "0 0 18px" }}>
          {titulo}
        </h1>
        {subtitulo && <p style={{ fontSize: "12px", color: "#6B5E54", margin: "0 0 18px" }}>{subtitulo}</p>}
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/triagens/nova" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "10px", background: "#E07A6E", color: "#fff", fontSize: "13px", fontWeight: 700, textDecoration: "none", transition: "background 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#C05A48")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#E07A6E")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Nova triagem
          </Link>
          <Link href="/agenda" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "10px", background: "rgba(255,255,255,0.7)", border: "1px solid rgba(224,122,110,0.35)", color: "#C05A48", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.9)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.7)")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            Agendar
          </Link>
        </div>
      </div>

      {/* Mini gráfico de barras */}
      {miniData && miniData.length > 0 && (
        <div style={{ flexShrink: 0, minWidth: "200px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#9B8E84", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
            {chartLabel ?? "Atendimentos — últimos 7 dias"}
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: "60px" }}>
            {miniData.map((b, i) => (
              <div key={i} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <div className="dash-chart-bar" style={{ width: "100%", height: `${Math.max(4, Math.round((b.total / maxVal) * 100))}%`, background: i === miniData.length - 1 ? "#E07A6E" : "rgba(224,122,110,0.3)", borderRadius: "4px 4px 2px 2px", minHeight: "4px" }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ícones SVG ───────────────────────────────────────────────────────────────

const IcoCheck = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
const IcoArrow = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
const IcoUsers = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IcoHeart = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
const IcoCal  = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IcoClk  = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;

// ─── Dashboard por perfil ─────────────────────────────────────────────────────

function DashboardGestora({ stats, primeiroNome, period }: { stats: GestoraStats; primeiroNome: string; period: "hoje" | "semana" | "mes" }) {
  const { metricas, atendimentosPorDia, encaminhamentosPorEspecialidade, doacoesPorMes, filaEspera, agendamentosHoje, bazaresNoPeriodo } = stats;
  const m = metricas;

  const periodoGrafico = period === "semana" ? "últimos 7 dias" : period === "hoje" ? "hoje" : "este mês";

  const metricItems: MetricDef[] = [
    { label: "Beneficiárias ativas", value: m.totalBeneficiariasAtivas, iconBg: "#D4EDD4", iconColor: "#3D7845", icon: IcoUsers },
    { label: `Triagens ${PERIOD_LABEL[period]}`, value: m.triagensMes,  iconBg: "#FDE8E4", iconColor: "#E07A6E", icon: IcoCheck },
    { label: "Encam. pendentes",     value: m.encaminhamentosPendentes, iconBg: "#FDE8E4", iconColor: "#E07A6E", icon: IcoArrow },
    { label: "Doações no mês",       value: `R$${m.doacoesMesTotal.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, iconBg: "#D4EDD4", iconColor: "#3D7845", icon: IcoHeart },
  ];

  const diasFormatados = atendimentosPorDia.map((d) => ({ ...d, label: formatarDia(d.data) }));
  const mesesFormatados = doacoesPorMes.map((d) => ({ ...d, label: formatarMes(d.mes) }));

  return (
    <>
      <HeroCard
        primeiroNome={primeiroNome}
        titulo={<>Hoje,{" "}<span style={{ color: "#E07A6E" }}>{filaEspera.length} {filaEspera.length === 1 ? "pessoa espera" : "pessoas esperam"}</span>{" "}acolhimento.</>}
        miniData={atendimentosPorDia}
        chartLabel={`Atendimentos — ${periodoGrafico}`}
      />
      <MetricCards items={metricItems} />
      <div className="dash-main-grid">
        <div>
          <BarPanel titulo={`Atendimentos realizados — ${periodoGrafico}`} dados={diasFormatados} xKey="label" yKey="total" cor="#E07A6E" />
          <div className="dash-chart-subgrid">
            <PiePanel titulo="Encaminhamentos por especialidade" dados={encaminhamentosPorEspecialidade} nomeKey="especialidade" valorKey="total" />
            <AreaPanel titulo="Doações por mês (R$)" dados={mesesFormatados} xKey="label" yKey="total" />
          </div>
          <BarPanel
            titulo={`Bazares realizados — ${periodoGrafico}`}
            dados={bazaresNoPeriodo.map((b) => ({ ...b, label: formatarDia(b.data) }))}
            xKey="label"
            yKey="total"
            cor="#3D7845"
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <FilaPanel fila={filaEspera} />
          <AgendaPanel agenda={agendamentosHoje} />
        </div>
      </div>
    </>
  );
}

function DashboardTriadora({ stats, primeiroNome, period }: { stats: TriadoraStats; primeiroNome: string; period: "hoje" | "semana" | "mes" }) {
  const { metricas, triagensPorDia, encaminhamentosPorEspecialidade, filaEspera } = stats;
  const m = metricas;

  const periodoGrafico = period === "semana" ? "esta semana" : period === "hoje" ? "hoje" : "este mês";

  const metricItems: MetricDef[] = [
    { label: "Triagens hoje",                    value: m.triagensHoje,             iconBg: "#FDE8E4", iconColor: "#E07A6E", icon: IcoCheck },
    { label: `Triagens ${PERIOD_LABEL[period]}`, value: m.triagensMes,              iconBg: "#FDE8E4", iconColor: "#E07A6E", icon: IcoCheck },
    { label: "Encam. pendentes",                 value: m.encaminhamentosPendentes, iconBg: "#FEF3E2", iconColor: "#C47A1E", icon: IcoArrow },
    { label: "Em espera",                        value: m.beneficiariasEmEspera,    iconBg: "#D4EDD4", iconColor: "#3D7845", icon: IcoUsers },
  ];

  const diasFormatados = triagensPorDia.map((d) => ({ ...d, label: formatarDia(d.data) }));

  return (
    <>
      <HeroCard
        primeiroNome={primeiroNome}
        titulo={<><span style={{ color: "#E07A6E" }}>{m.triagensHoje} {m.triagensHoje === 1 ? "triagem realizada" : "triagens realizadas"}</span>{" "}hoje. {m.beneficiariasEmEspera} aguardando.</>}
      />
      <MetricCards items={metricItems} />
      <div className="dash-main-grid">
        <div>
          <BarPanel titulo={`Triagens por dia — ${periodoGrafico}`} dados={diasFormatados} xKey="label" yKey="total" cor="#E07A6E" />
          <PiePanel titulo="Encaminhamentos por especialidade" dados={encaminhamentosPorEspecialidade} nomeKey="especialidade" valorKey="total" />
        </div>
        <FilaPanel fila={filaEspera} />
      </div>
    </>
  );
}

function DashboardProfissional({ stats, primeiroNome, period }: { stats: ProfissionalStats; primeiroNome: string; period: "hoje" | "semana" | "mes" }) {
  const { metricas, agendamentosPorStatus, atendimentosPorSemana, agendamentosHoje } = stats;
  const m = metricas;

  const metricItems: MetricDef[] = [
    { label: "Agendamentos hoje",                    value: m.agendamentosHoje, iconBg: "#FDE8E4", iconColor: "#E07A6E", icon: IcoCal  },
    { label: "Confirmados hoje",                     value: m.confirmadosHoje,  iconBg: "#D4EDD4", iconColor: "#3D7845", icon: IcoCheck },
    { label: `Realizados ${PERIOD_LABEL[period]}`,   value: m.realizadosMes,    iconBg: "#D4EDD4", iconColor: "#3D7845", icon: IcoHeart },
    { label: `Cancelados ${PERIOD_LABEL[period]}`,   value: m.canceladosMes,    iconBg: "#FDE8E4", iconColor: "#C05A48", icon: IcoClk  },
  ];

  return (
    <>
      <HeroCard
        primeiroNome={primeiroNome}
        titulo={<>Você tem{" "}<span style={{ color: "#E07A6E" }}>{m.agendamentosHoje} {m.agendamentosHoje === 1 ? "atendimento" : "atendimentos"}</span>{" "}hoje.</>}
        subtitulo={m.confirmadosHoje > 0 ? `${m.confirmadosHoje} confirmado${m.confirmadosHoje > 1 ? "s" : ""}.` : undefined}
      />
      <MetricCards items={metricItems} />
      <div className="dash-main-grid">
        <div>
          <BarPanel titulo="Meus atendimentos — últimas 4 semanas" dados={atendimentosPorSemana} xKey="semana" yKey="total" cor="#3D7845" />
          <PiePanel titulo="Meus agendamentos por status" dados={agendamentosPorStatus} nomeKey="status" valorKey="total" />
        </div>
        <AgendaPanel agenda={agendamentosHoje} />
      </div>
    </>
  );
}

// ─── Skeleton de loading ──────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <>
      <div style={{ background: "linear-gradient(110deg, #FDE8E4 45%, #DFE9DF 100%)", borderRadius: "20px", padding: "24px 28px", marginBottom: "16px", height: "136px", opacity: 0.5 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
        {[0,1,2,3].map((i) => (
          <div key={i} style={{ ...card, height: "72px", opacity: 0.4 }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "12px" }}>
        <div style={{ ...card, height: "260px", opacity: 0.3 }} />
        <div style={{ ...card, height: "260px", opacity: 0.3 }} />
      </div>
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const DIAS   = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];

export default function Dashboard() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [stats, setStats]     = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"hoje" | "semana" | "mes">("hoje");

  useEffect(() => {
    setMounted(true);
    setUsuario(getUsuario());
    fetchDashboardStats(activeTab)
      .then(setStats)
      .catch(() => setError('Não foi possível carregar os dados.'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setTabLoading(true);
    setError(null);
    fetchDashboardStats(activeTab)
      .then(setStats)
      .catch(() => setError('Não foi possível carregar os dados.'))
      .finally(() => setTabLoading(false));
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const now = new Date();
  const dataFormatada = `${DIAS[now.getDay()]}, ${now.getDate()} de ${MESES_FULL[now.getMonth()]} de ${now.getFullYear()}`;
  const primeiroNome = usuario ? getFirstName(usuario.nome) : "—";

  function loadStats(period: "hoje" | "semana" | "mes") {
    setError(null);
    setTabLoading(true);
    fetchDashboardStats(period)
      .then(setStats)
      .catch(() => setError('Não foi possível carregar os dados.'))
      .finally(() => setTabLoading(false));
  }

  function renderConteudo() {
    if (loading || !mounted) return <LoadingSkeleton />;
    if (error) return (
      <div style={{ ...card, textAlign: "center", padding: "32px" }}>
        <p style={{ color: "#9B8E84", fontSize: "14px", marginBottom: "12px" }}>{error}</p>
        <button
          onClick={() => loadStats(activeTab)}
          style={{ padding: "8px 20px", background: "#E07A6E", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
        >
          Tentar novamente
        </button>
      </div>
    );
    if (!stats) return <p style={{ color: "#9B8E84", fontSize: "14px" }}>Não foi possível carregar os dados.</p>;

    const wrapStyle = tabLoading ? { opacity: 0.5, pointerEvents: "none" as const, transition: "opacity 0.2s" } : {};

    if (stats.perfil === "GESTORA")      return <div style={wrapStyle}><DashboardGestora     stats={stats} primeiroNome={primeiroNome} period={activeTab} /></div>;
    if (stats.perfil === "TRIADORA")     return <div style={wrapStyle}><DashboardTriadora    stats={stats} primeiroNome={primeiroNome} period={activeTab} /></div>;
    if (stats.perfil === "PROFISSIONAL") return <div style={wrapStyle}><DashboardProfissional stats={stats} primeiroNome={primeiroNome} period={activeTab} /></div>;
    return null;
  }

  return (
    <div style={{ padding: "32px 28px", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <p style={{ fontSize: "13px", color: "#9B8E84", fontWeight: 500, textTransform: "capitalize" }}>
          {dataFormatada}
        </p>
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.7)", border: "0.5px solid rgba(220,200,190,0.45)", borderRadius: "10px", padding: "3px" }}>
          {(["hoje", "semana", "mes"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "5px 14px", borderRadius: "7px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600, fontFamily: "inherit", transition: "background 0.15s, color 0.15s", background: activeTab === tab ? "#E07A6E" : "transparent", color: activeTab === tab ? "#ffffff" : "#6B5E54" }}>
              {tab === "hoje" ? "Hoje" : tab === "semana" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
      </div>
      {renderConteudo()}
    </div>
  );
}
