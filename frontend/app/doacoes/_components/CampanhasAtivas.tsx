"use client";

import { IconTrash, ProgressBar, card } from "./indicadores";
import { fmtBRL } from "../_lib/helpers";
import type { Campanha } from "../_lib/tipos";

interface CampanhasAtivasProps {
  campanhasWithTotal: Campanha[];
  openEditarCampanha: (c: Campanha) => void;
  deletarCampanha: (id: string, nome: string) => void;
}

export default function CampanhasAtivas({ campanhasWithTotal, openEditarCampanha, deletarCampanha }: CampanhasAtivasProps) {
  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Campanhas Ativas</p>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{campanhasWithTotal.filter(c => !c.encerrada_em).length} ativas</span>
      </div>
      {campanhasWithTotal.length === 0 && (
        <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
          Nenhuma campanha cadastrada
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {campanhasWithTotal.filter(c => !c.encerrada_em).slice(0, 4).map((c) => {
          const pct = c.meta_valor ? Math.min((c.total_arrecadado! / c.meta_valor) * 100, 100) : 0;
          return (
            <div key={c.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{c.nome}</span>
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, marginRight: "8px" }}>
                    {c.meta_valor ? `${Math.round(pct)}%` : fmtBRL(c.total_arrecadado!)}
                  </span>
                  <button type="button" onClick={() => openEditarCampanha(c)} aria-label={`Editar ${c.nome}`} title="Editar" style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "16px", padding: 0 }}>✏️</button>
                  <button type="button" onClick={() => deletarCampanha(c.id, c.nome)} aria-label={`Excluir ${c.nome}`} style={{ padding: "5px 10px", border: "0.5px solid #fca5a5", borderRadius: "8px", color: "#DC2626", background: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")} onMouseLeave={(e) => (e.currentTarget.style.background = "#fef2f2")}><IconTrash /></button>
                </div>
              </div>
              {c.meta_valor && (
                <>
                  <ProgressBar value={c.total_arrecadado!} max={c.meta_valor} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{fmtBRL(c.total_arrecadado!)}</span>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>meta: {fmtBRL(c.meta_valor)}</span>
                  </div>
                </>
              )}
              {!c.meta_valor && <ProgressBar value={1} max={1} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
