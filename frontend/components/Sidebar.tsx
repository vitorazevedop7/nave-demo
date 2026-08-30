"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getUsuario, logout, type Usuario } from "@/lib/auth";

// `perfis` lista os perfis com acesso à rota. Itens sem `perfis` são
// visíveis para qualquer usuário autenticado. Deve espelhar o ROUTE_PERFIS
// do LayoutShell, que faz o controle de acesso efetivo.
type MenuItem = { name: string; href: string; perfis?: string[] };

const menuSections: { title: string; items: MenuItem[] }[] = [
  {
    title: "GERAL",
    items: [{ name: "Dashboard", href: "/" }],
  },
  {
    title: "GESTÃO",
    items: [
      { name: "Profissionais", href: "/profissionais", perfis: ["GESTORA"] },
      { name: "Beneficiárias", href: "/beneficiarios", perfis: ["GESTORA"] },
      { name: "Agenda", href: "/agenda", perfis: ["GESTORA", "TRIADORA", "PROFISSIONAL"] },
    ],
  },
  {
    title: "CLÍNICO",
    items: [
      { name: "Triagens", href: "/triagens", perfis: ["GESTORA", "TRIADORA"] },
      { name: "Encaminhamentos", href: "/encaminhamentos", perfis: ["GESTORA", "TRIADORA"] },
      { name: "Prontuários", href: "/prontuarios", perfis: ["GESTORA", "PROFISSIONAL"] },
    ],
  },
  {
    title: "FINANCEIRO",
    items: [
      { name: "Doações", href: "/doacoes", perfis: ["GESTORA"] },
      { name: "Bazares", href: "/bazares", perfis: ["GESTORA"] },
    ],
  },
];

function podeVer(item: MenuItem, perfis: string[] | undefined): boolean {
  if (!item.perfis) return true;
  if (!perfis) return false;
  return perfis.some((p) => item.perfis!.includes(p));
}

function getInitials(nome: string): string {
  const parts = nome.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatPerfil(perfil: string): string {
  const normalized = perfil.trim().toUpperCase();
  const aliases: Record<string, string> = {
    TRIADORAA: "TRIADORA",
  };
  const resolved = aliases[normalized] ?? normalized;
  return resolved.charAt(0) + resolved.slice(1).toLowerCase();
}

function formatPerfis(perfis: string[] | undefined): string {
  if (!perfis || perfis.length === 0) return "";
  return perfis.map(formatPerfil).join(", ");
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const perfisLabel = formatPerfis(usuario?.perfis);

  useEffect(() => {
    setUsuario(getUsuario());
  }, []);

  return (
    <aside
      style={{
        width: collapsed ? "64px" : "220px",
        minWidth: collapsed ? "64px" : "220px",
        background: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "0.5px solid rgba(220, 200, 190, 0.35)",
        boxShadow: "0 8px 40px rgba(224, 122, 110, 0.06), 0 2px 8px rgba(224, 122, 110, 0.03)",
        borderRadius: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        flexShrink: 0,
        overflow: "hidden",
        transition: "width 0.25s ease, min-width 0.25s ease",
      }}
    >
      {/* Logo + Toggle */}
      <div>
        <div
          style={{
            padding: collapsed ? "16px 0 12px" : "20px 16px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            transition: "padding 0.25s ease",
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", flexShrink: 0 }}>
            <Image
              src="/imgs/nave_flor_logo.png"
              alt="NAVE"
              width={30}
              height={30}
              style={{ objectFit: "contain", flexShrink: 0 }}
            />
            {!collapsed && (
              <div style={{ lineHeight: 1.15 }}>
                <p style={{ fontSize: "13px", fontWeight: 800, color: "#2B1F14", margin: 0, letterSpacing: "-0.01em" }}>NAVE</p>
                <p style={{ fontSize: "9px", color: "#9B8E84", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Triagem · Acolhimento</p>
              </div>
            )}
          </Link>

          {/* Toggle button */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              title="Recolher menu"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#E07A6E",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                borderRadius: "6px",
                flexShrink: 0,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#C05A48")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#E07A6E")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              title="Expandir menu"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#E07A6E",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                borderRadius: "6px",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#C05A48")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#E07A6E")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ padding: collapsed ? "0 8px" : "0 12px" }}>
          {menuSections
            .map((section) => ({
              ...section,
              items: section.items.filter((item) => podeVer(item, usuario?.perfis)),
            }))
            .filter((section) => section.items.length > 0)
            .map((section) => (
            <div key={section.title} style={{ marginBottom: "16px" }}>
              {!collapsed && (
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#E07A6E",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    padding: "0 8px",
                    marginBottom: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {section.title}
                </p>
              )}
              {collapsed && <div style={{ height: "1px", background: "rgba(0,0,0,0.06)", margin: "8px 4px 10px" }} />}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {section.items.map((item) => {
                  const active =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.name : undefined}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: collapsed ? "center" : "flex-start",
                        gap: "10px",
                        padding: collapsed ? "0.6rem" : "0.55rem 0.75rem",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: active ? 700 : 500,
                        color: active ? "#C05A48" : "#3a4a32",
                        background: active ? "#FDE8E4" : "transparent",
                        textDecoration: "none",
                        transition: "background 0.15s, color 0.15s",
                      }}
                    >
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "#E07A6E",
                          flexShrink: 0,
                          transition: "background 0.15s",
                        }}
                      />
                      {!collapsed && item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: collapsed ? "16px 0" : "16px 12px",
          borderTop: "0.5px solid rgba(220, 200, 190, 0.45)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          transition: "padding 0.25s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: collapsed ? 0 : "10px", overflow: "hidden", justifyContent: collapsed ? "center" : "flex-start" }}>
          <div
            title={collapsed ? (usuario?.nome ?? "") : undefined}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "#D4EDD4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 700,
              color: "#3D7845",
              flexShrink: 0,
            }}
          >
            {usuario ? getInitials(usuario.nome) : "?"}
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#2B1F14",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {usuario?.nome ?? "—"}
              </p>
              <p
                title={perfisLabel || undefined}
                style={{
                  fontSize: "11px",
                  color: "#9B8E84",
                  marginTop: "1px",
                  lineHeight: 1.35,
                  whiteSpace: "normal",
                  overflowWrap: "anywhere",
                }}
              >
                {perfisLabel}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          title="Sair"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: "8px",
            width: "100%",
            padding: collapsed ? "6px" : "6px 8px",
            borderRadius: "8px",
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "#c05a48",
            fontSize: "12px",
            fontWeight: 600,
            fontFamily: "inherit",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(224, 122, 110, 0.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!collapsed && "Sair"}
        </button>
      </div>
    </aside>
  );
}
