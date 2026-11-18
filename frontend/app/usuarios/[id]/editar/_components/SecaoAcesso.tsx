"use client";

import type { Dispatch, SetStateAction } from "react";
import { FieldError, Required } from "./campos";
import { inputBase, labelStyle, sectionDivider } from "./estilos";
import { ESPECIALIDADES, PERFIS } from "../_lib/constantes";
import type { FormUsuario } from "../_lib/tipos";

interface SecaoAcessoProps {
  form: FormUsuario;
  setForm: Dispatch<SetStateAction<FormUsuario>>;
  errors: Record<string, string>;
  togglePerfil: (value: string) => void;
}

export default function SecaoAcesso({ form, setForm, errors, togglePerfil }: SecaoAcessoProps) {
  return (
    <>
              <div style={{ ...sectionDivider, marginTop: "12px" }}>Configurações de Acesso</div>

              {/* Especialidade */}
              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="especialidade" style={labelStyle}>
                  Especialidade
                  <span style={{ color: "#9B8E84", fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: "6px", fontSize: "10px" }}>
                    (opcional)
                  </span>
                </label>
                <select
                  id="especialidade"
                  value={form.especialidade}
                  onChange={(e) => setForm((f) => ({ ...f, especialidade: e.target.value }))}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#E07A6E"; e.currentTarget.style.background = "#ffffff"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#d6d0c4"; e.currentTarget.style.background = "#faf9f6"; }}
                  style={{ ...inputBase, cursor: "pointer" }}
                >
                  <option value="">Sem especialidade definida</option>
                  {ESPECIALIDADES.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>

              {/* Perfis */}
              <div style={{ marginBottom: "8px" }}>
                <p style={{ ...labelStyle, marginBottom: "10px" }}>
                  Perfis de acesso<Required />
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {PERFIS.map((p) => {
                    const checked = form.perfis.includes(p.value);
                    return (
                      <div
                        key={p.value}
                        role="checkbox"
                        aria-checked={checked}
                        tabIndex={0}
                        onClick={() => togglePerfil(p.value)}
                        onKeyDown={(e) => e.key === " " && togglePerfil(p.value)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 14px",
                          border: `0.5px solid ${checked ? "#E07A6E" : errors.perfis ? "#e07a6e" : "#d6d0c4"}`,
                          borderRadius: "10px",
                          cursor: "pointer",
                          background: checked ? "#FDE8E4" : "#faf9f6",
                          transition: "border-color 0.15s, background 0.15s",
                          userSelect: "none",
                        }}
                      >
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "4px",
                            border: `0.5px solid ${checked ? "#E07A6E" : "#d6d0c4"}`,
                            background: checked ? "#E07A6E" : "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "background 0.15s",
                          }}
                        >
                          {checked && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#2B1F14", margin: 0 }}>{p.label}</p>
                          <p style={{ fontSize: "11px", color: "#5a5a50", marginTop: "1px" }}>{p.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <FieldError msg={errors.perfis} />
              </div>
    </>
  );
}
