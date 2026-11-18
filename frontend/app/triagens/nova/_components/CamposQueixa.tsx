"use client";

import type { ChangeEvent } from "react";
import { inputStyle, labelStyle, textareaStyle } from "./estilos";
import type { FormQueixa } from "../_lib/formulario";

interface CamposQueixaProps {
  formQ: FormQueixa;
  changeQ: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export default function CamposQueixa({ formQ, changeQ }: CamposQueixaProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

      {/* Queixa principal */}
      <div style={{ gridColumn: "1 / -1" }}>
        <label htmlFor="triagem-campo-13" style={labelStyle}>Queixa principal *</label>
        <textarea id="triagem-campo-13" name="queixa_principal" value={formQ.queixa_principal} onChange={changeQ} rows={4} placeholder="Descreva a principal queixa" style={textareaStyle} />
      </div>

      {/* Queixa secundária */}
      <div>
        <label htmlFor="triagem-campo-14" style={labelStyle}>Queixa secundária</label>
        <textarea id="triagem-campo-14" name="queixa_secundaria" value={formQ.queixa_secundaria} onChange={changeQ} rows={4} placeholder="Queixa complementar" style={textareaStyle} />
      </div>

      {/* Sintomas */}
      <div>
        <label htmlFor="triagem-campo-15" style={labelStyle}>Sintomas</label>
        <textarea id="triagem-campo-15" name="sintomas" value={formQ.sintomas} onChange={changeQ} rows={4} placeholder="Sintomas apresentados" style={textareaStyle} />
      </div>

      {/* Tipo de violência */}
      <div>
        <label htmlFor="triagem-campo-16" style={labelStyle}>Tipo de violência</label>
        <input id="triagem-campo-16" name="tipo_violencia" value={formQ.tipo_violencia} onChange={changeQ} placeholder="Ex: física, psicológica..." style={inputStyle} />
      </div>

      {/* Observações */}
      <div>
        <label htmlFor="triagem-campo-17" style={labelStyle}>Observações</label>
        <textarea id="triagem-campo-17" name="observacoes" value={formQ.observacoes} onChange={changeQ} rows={4} placeholder="Observações adicionais" style={textareaStyle} />
      </div>
    </div>
  );
}
