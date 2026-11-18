"use client";

import type { Dispatch, SetStateAction } from "react";
import { FieldError, Required } from "./campos";
import { inputBase, labelStyle, sectionDivider } from "./estilos";
import type { FormUsuario } from "../_lib/tipos";

interface SecaoDadosPessoaisProps {
  form: FormUsuario;
  setForm: Dispatch<SetStateAction<FormUsuario>>;
  errors: Record<string, string>;
  validateField: (name: string, value: string) => void;
}

export default function SecaoDadosPessoais({ form, setForm, errors, validateField }: SecaoDadosPessoaisProps) {
  return (
    <>
              <div style={sectionDivider}>Dados Pessoais</div>

              {/* Nome */}
              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="nome" style={labelStyle}>
                  Nome completo<Required />
                </label>
                <input
                  id="nome"
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  onBlur={(e) => validateField("nome", e.target.value)}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#E07A6E";
                    e.currentTarget.style.background = "#ffffff";
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.borderColor = errors.nome ? "#e07a6e" : "#d6d0c4";
                    e.currentTarget.style.background = "#faf9f6";
                  }}
                  style={{ ...inputBase, borderColor: errors.nome ? "#e07a6e" : "#d6d0c4" }}
                />
                <FieldError msg={errors.nome} />
              </div>

              {/* Email */}
              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="email" style={labelStyle}>
                  E-mail<Required />
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  onBlur={(e) => validateField("email", e.target.value)}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#E07A6E";
                    e.currentTarget.style.background = "#ffffff";
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.borderColor = errors.email ? "#e07a6e" : "#d6d0c4";
                    e.currentTarget.style.background = "#faf9f6";
                  }}
                  style={{ ...inputBase, borderColor: errors.email ? "#e07a6e" : "#d6d0c4" }}
                />
                <FieldError msg={errors.email} />
              </div>
    </>
  );
}
