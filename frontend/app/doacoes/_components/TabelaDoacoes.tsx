"use client";

import { formatarDataPura } from "@/lib/date";
import { inputStyle } from "./dialogos";
import { Badge, IconTrash, card } from "./indicadores";
import { fmtBRL } from "../_lib/helpers";
import type { Doacao } from "../_lib/tipos";

interface TabelaDoacoesProps {
  filtered: Doacao[];
  search: string;
  setSearch: (valor: string) => void;
  filterTipo: string;
  setFilterTipo: (valor: string) => void;
  deletarDoacao: (id: string) => void;
}

export default function TabelaDoacoes({ filtered, search, setSearch, filterTipo, setFilterTipo, deletarDoacao }: TabelaDoacoesProps) {
  return (
    <div style={card}>
      {/* Table header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Registro de Doações
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            placeholder="Buscar doador ou tipo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: "220px", fontSize: "13px" }}
          />
          <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} style={{ ...inputStyle, width: "140px", fontSize: "13px" }}>
            <option value="Todos">Todos os tipos</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="ALIMENTO">Alimento</option>
            <option value="ROUPA">Roupa</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Nenhuma doação encontrada</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-card)" }}>
                {["Doador", "Tipo", "Valor / Qtd.", "Campanha", "Data", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((d) => (
                <tr
                  key={d.id}
                  className="dash-queue-row"
                  style={{ borderBottom: "0.5px solid rgba(220,200,190,0.3)" }}
                >
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {d.doadores?.nome ?? "Anônimo"}
                    </span>
                    {d.observacao && (
                      <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{d.observacao}</p>
                    )}
                  </td>
                  <td style={{ padding: "12px 12px" }}><Badge tipo={d.tipo} /></td>
                  <td style={{ padding: "12px 12px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {d.tipo === "DINHEIRO" ? fmtBRL(d.valor) : (d.quantidade ?? "—")}
                  </td>
                  <td style={{ padding: "12px 12px", color: "var(--text-secondary)", fontSize: "12px" }}>
                    {d.campanhas_doacoes?.nome ?? "—"}
                  </td>
                  <td style={{ padding: "12px 12px", color: "var(--text-secondary)" }}>
                    {formatarDataPura(d.data)}
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <button type="button" onClick={() => deletarDoacao(d.id)} aria-label="Excluir doação" style={{ padding: "5px 10px", border: "0.5px solid #fca5a5", borderRadius: "8px", color: "#DC2626", background: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")} onMouseLeave={(e) => (e.currentTarget.style.background = "#fef2f2")}><IconTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 50 && (
            <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "12px" }}>
              Exibindo 50 de {filtered.length} registros
            </p>
          )}
        </div>
      )}
    </div>
  );
}
