"use client";

import type { ReactNode } from "react";
import type { FormFisioterapia } from "@/lib/types/prontuario";
import { labelStyle, SectionTitle, Field } from "./ui";
import {
  sexoOptions,
  simNaoOptions,
} from "../_lib/opcoes";

interface FisioterapiaFormProps {
  formFisio: FormFisioterapia;
  fisioStep: number;
  handleFisio: (field: keyof FormFisioterapia, value: string) => void;
  blocoVisibilidade: ReactNode;
}

export default function FisioterapiaForm({ formFisio, fisioStep, handleFisio, blocoVisibilidade }: FisioterapiaFormProps) {
  return (
    <>
      {fisioStep === 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <SectionTitle>Identificação</SectionTitle>
          <Field label="Nome" value={formFisio.nome} onChange={(v) => handleFisio("nome", v)} />
          <Field label="Idade" value={formFisio.idade} onChange={(v) => handleFisio("idade", v)} />
          <Field label="Sexo" value={formFisio.sexo} onChange={(v) => handleFisio("sexo", v)} options={sexoOptions} />
          <Field label="Ocupação" value={formFisio.ocupacao} onChange={(v) => handleFisio("ocupacao", v)} />
          <Field label="CPF" value={formFisio.cpf} onChange={(v) => handleFisio("cpf", v)} />
          <Field label="RG" value={formFisio.rg} onChange={(v) => handleFisio("rg", v)} />
          <Field label="Contato" value={formFisio.contato} onChange={(v) => handleFisio("contato", v)} gridSpan={2} />
    
          <SectionTitle>Histórico Clínico</SectionTitle>
          <Field label="Caso Clínico" value={formFisio.caso_clinico} onChange={(v) => handleFisio("caso_clinico", v)} textarea gridSpan={2} />
          <Field label="Histórico Médico" value={formFisio.historico_medico} onChange={(v) => handleFisio("historico_medico", v)} textarea gridSpan={2} />
          <Field label="Usa Medicamento?" value={formFisio.usa_medicamento} onChange={(v) => handleFisio("usa_medicamento", v)} options={simNaoOptions} />
          {formFisio.usa_medicamento === "Sim" && (
            <Field label="Quais Medicamentos" value={formFisio.medicamentos_lista} onChange={(v) => handleFisio("medicamentos_lista", v)} />
          )}
        </div>
      )}
    
      {fisioStep === 2 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <SectionTitle>Sinais Vitais</SectionTitle>
          <Field label="FC (bpm)" value={formFisio.sv_fc} onChange={(v) => handleFisio("sv_fc", v)} />
          <Field label="FR (rpm)" value={formFisio.sv_fr} onChange={(v) => handleFisio("sv_fr", v)} />
          <Field label="PA (mmHg)" value={formFisio.sv_pa} onChange={(v) => handleFisio("sv_pa", v)} />
          <div />
    
          <SectionTitle>Exame Físico</SectionTitle>
          <Field label="Apresentação do Paciente" value={formFisio.apresentacao_paciente} onChange={(v) => handleFisio("apresentacao_paciente", v)} textarea gridSpan={2} />
          <Field label="Inspeção / Palpação" value={formFisio.inspecao_palpacao} onChange={(v) => handleFisio("inspecao_palpacao", v)} textarea gridSpan={2} />
          <Field label="Exames Complementares?" value={formFisio.exames_complementares} onChange={(v) => handleFisio("exames_complementares", v)} options={simNaoOptions} />
          {formFisio.exames_complementares === "Sim" && (
            <Field label="Observações" value={formFisio.exames_complementares_obs} onChange={(v) => handleFisio("exames_complementares_obs", v)} />
          )}
          <Field label="Prótese / Órtese?" value={formFisio.protese_ortese} onChange={(v) => handleFisio("protese_ortese", v)} options={simNaoOptions} />
          {formFisio.protese_ortese === "Sim" && (
            <Field label="Qual" value={formFisio.protese_ortese_obs} onChange={(v) => handleFisio("protese_ortese_obs", v)} />
          )}
          <Field label="Limitação de Movimento?" value={formFisio.limitacao_movimento} onChange={(v) => handleFisio("limitacao_movimento", v)} options={simNaoOptions} />
          {formFisio.limitacao_movimento === "Sim" && (
            <Field label="Qual" value={formFisio.limitacao_movimento_obs} onChange={(v) => handleFisio("limitacao_movimento_obs", v)} />
          )}
          <Field label="Equilíbrio / Coordenação" value={formFisio.equilibrio_coordenacao} onChange={(v) => handleFisio("equilibrio_coordenacao", v)} gridSpan={2} />
    
          <SectionTitle>Avaliação de Dor e Diagnóstico</SectionTitle>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Intensidade da Dor (0 a 10)</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px", overflowX: "auto" }}>
              {[...Array(11)].map((_, i) => {
                const isSelected = String(i) === String(formFisio.dor_intensidade);
                let bgColor = "#e0dbd2";
                let color = "#2B1F14";
                if (isSelected) {
                  if (i <= 3) { bgColor = "#3D7845"; color = "#fff"; } // Leve
                  else if (i <= 7) { bgColor = "#eab308"; color = "#fff"; } // Moderada
                  else { bgColor = "#ef4444"; color = "#fff"; } // Intensa
                }
    
                return (
                  <div
                    key={i}
                    onClick={() => handleFisio("dor_intensidade", String(i))}
                    style={{
                      flex: 1, minWidth: "32px", textAlign: "center", padding: "8px 0", cursor: "pointer",
                      borderRadius: "6px", fontSize: "14px", fontWeight: 700,
                      background: bgColor, color, border: isSelected ? "none" : "1px solid #d6d0c4",
                      transition: "all 0.2s"
                    }}
                  >
                    {i}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9B8E84", fontWeight: 600 }}>
              <span>Leve (0-3)</span>
              <span>Moderada (4-7)</span>
              <span>Intensa (8-10)</span>
            </div>
          </div>
    
          <Field label="Queixa Principal" value={formFisio.queixa_principal} onChange={(v) => handleFisio("queixa_principal", v)} textarea gridSpan={2} />
          <Field label="História Clínica" value={formFisio.historia_clinica} onChange={(v) => handleFisio("historia_clinica", v)} textarea gridSpan={2} />
          <Field label="Demais Observações" value={formFisio.demais_observacoes} onChange={(v) => handleFisio("demais_observacoes", v)} textarea gridSpan={2} />
    
          <SectionTitle>Plano de Tratamento</SectionTitle>
          <Field label="Objetivo do Tratamento" value={formFisio.objetivo_tratamento} onChange={(v) => handleFisio("objetivo_tratamento", v)} textarea gridSpan={2} />
          <Field label="Recursos Terapêuticos" value={formFisio.recursos_terapeuticos} onChange={(v) => handleFisio("recursos_terapeuticos", v)} textarea gridSpan={2} />
          <Field label="Anotações Gerais" value={formFisio.anotacoes_gerais} onChange={(v) => handleFisio("anotacoes_gerais", v)} textarea gridSpan={2} />
    
          <div style={{ gridColumn: "1 / -1", borderTop: "1px dashed #d6d0c4", margin: "8px 0" }} />
          <Field label="Data Assinatura" type="date" value={formFisio.data_assinatura} onChange={(v) => handleFisio("data_assinatura", v)} />
          <Field label="Assinatura" value={formFisio.assinatura} onChange={(v) => handleFisio("assinatura", v)} />
          <div style={{ gridColumn: "1 / -1" }}>{blocoVisibilidade}</div>
        </div>
      )}
    </>
  );
}
