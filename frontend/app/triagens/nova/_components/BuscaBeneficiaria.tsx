"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { buscarBeneficiarias, type BeneficiariaOpcao } from "@/lib/beneficiarias";
import { inputStyle, labelStyle } from "./estilos";

interface BuscaBeneficiariaProps {
  label: string;
  placeholder: string;
  /** Restringe a busca a um tipo (ex.: só adultas para responsável). */
  tipo?: string;
  selecionada: BeneficiariaOpcao | null;
  onSelecionar: (beneficiaria: BeneficiariaOpcao | null) => void;
  /** Texto de apoio exibido abaixo do campo enquanto nada foi escolhido. */
  dica?: ReactNode;
  style?: CSSProperties;
}

/**
 * Campo de busca com autocompletar para escolher uma beneficiária já
 * cadastrada. Consulta a API com debounce de 300 ms a partir de 2 letras.
 */
export default function BuscaBeneficiaria({
  label, placeholder, tipo, selecionada, onSelecionar, dica, style,
}: BuscaBeneficiariaProps) {
  const [busca, setBusca] = useState("");
  const [sugestoes, setSugestoes] = useState<BeneficiariaOpcao[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  function buscar(termo: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (termo.length < 2) { setSugestoes([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSugestoes(await buscarBeneficiarias(termo, tipo));
    }, 300);
  }

  return (
    <div style={{ position: "relative", ...style }}>
      <label style={labelStyle}>{label}</label>
      {selecionada ? (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            background: "#e8f5e9", color: "#2e7d32", border: "0.5px solid #a5d6a7",
            borderRadius: "20px", padding: "6px 14px", fontSize: "13px", fontWeight: 600,
          }}>
            {selecionada.nome}
          </span>
          <button
            type="button"
            aria-label="Remover seleção"
            onClick={() => { onSelecionar(null); setBusca(""); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#7a7a70", fontSize: "16px", lineHeight: 1, padding: "2px 6px",
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <>
          <input
            value={busca}
            onChange={(e) => { setBusca(e.target.value); buscar(e.target.value); }}
            placeholder={placeholder}
            style={inputStyle}
            autoComplete="off"
          />
          {sugestoes.length > 0 && (
            <ul style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
              background: "#ffffff", border: "0.5px solid #d6d0c4", borderRadius: "10px",
              margin: "4px 0 0", padding: 0, listStyle: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              maxHeight: "200px", overflowY: "auto",
            }}>
              {sugestoes.map((s) => (
                <li
                  key={s.id}
                  onClick={() => { onSelecionar(s); setBusca(s.nome); setSugestoes([]); }}
                  style={{ padding: "10px 14px", fontSize: "13px", color: "#3a3a35", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#faf9f6")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {s.nome}
                </li>
              ))}
            </ul>
          )}
          {dica}
        </>
      )}
    </div>
  );
}
