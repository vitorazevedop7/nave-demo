"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import { DialogProvider } from "./DialogProvider";
import { getUsuario } from "@/lib/auth";

const AUTH_ROUTES = ["/login"];

// Rotas que exigem perfis específicos. Rotas fora deste mapa são acessíveis
// por qualquer usuário autenticado.
const ROUTE_PERFIS: Record<string, string[]> = {
  "/profissionais": ["GESTORA"],
  "/usuarios": ["GESTORA"],
  "/beneficiarios": ["GESTORA", "TRIADORA"],
  "/triagens": ["GESTORA", "TRIADORA"],
  "/encaminhamentos": ["GESTORA", "TRIADORA"],
  "/prontuarios": ["GESTORA", "PROFISSIONAL"],
  "/doacoes": ["GESTORA"],
  "/bazares": ["GESTORA"],
  "/agenda": ["GESTORA", "TRIADORA", "PROFISSIONAL"],
  "/calendario": ["GESTORA", "TRIADORA"],
};

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  useEffect(() => {
    if (isAuthRoute) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const usuario = getUsuario();
    const requiredPerfis = Object.entries(ROUTE_PERFIS).find(([route]) =>
      pathname.startsWith(route)
    )?.[1];

    if (requiredPerfis && usuario) {
      const temAcesso = usuario.perfis.some((p) => requiredPerfis.includes(p));
      if (!temAcesso) {
        router.replace("/");
      }
    }
  }, [pathname, isAuthRoute, router]);

  if (isAuthRoute) {
    return <DialogProvider>{children}</DialogProvider>;
  }

  return (
    <DialogProvider>
      <div
        style={{
          display: "flex",
          height: "100vh",
          padding: "12px",
          gap: "12px",
          boxSizing: "border-box",
        }}
      >
        <Sidebar />
        <main
          style={{
            flex: 1,
            overflow: "hidden",
            background: "rgba(251, 246, 242, 0.20)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "20px",
          }}
        >
          <div style={{ height: "100%", overflowY: "auto" }}>{children}</div>
        </main>
      </div>
    </DialogProvider>
  );
}
