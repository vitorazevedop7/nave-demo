"use client";

import type { ReactNode } from "react";
import type { FormCrianca, Morador } from "@/lib/types/prontuario";
import { labelStyle, SectionTitle, Field } from "./ui";
import {
  sexoOptions,
  escolaridadeOptions,
  simNaoOptions,
  segurancaOptions,
  casaTipoOptions,
  tipoPartoOptions,
  pacienteSabeOptions,
} from "../_lib/opcoes";

interface AnamneseCriancaFormProps {
  formCrianca: FormCrianca;
  criancaStep: number;
  handleCrianca: (field: keyof FormCrianca, value: string) => void;
  moradores: Morador[];
  handleMoradores: (next: Morador[]) => void;
  blocoVisibilidade: ReactNode;
}

export default function AnamneseCriancaForm({ formCrianca, criancaStep, handleCrianca, moradores, handleMoradores, blocoVisibilidade }: AnamneseCriancaFormProps) {
  return (
    <>
      {/* ─ Step 1: Dados Pessoais + Responsável Legal ─ */}
      {criancaStep === 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <SectionTitle>Informações do Atendimento</SectionTitle>
          <Field label="Data do Atendimento" type="date" value={formCrianca.data_atendimento} onChange={(v) => handleCrianca("data_atendimento", v)} />
          <Field label="Profissional" value={formCrianca.profissional} onChange={(v) => handleCrianca("profissional", v)} disabled />
    
          <SectionTitle>Dados Pessoais</SectionTitle>
          <Field label="Nome" value={formCrianca.nome} onChange={(v) => handleCrianca("nome", v)} gridSpan={2} />
          <Field label="Data de Nascimento" type="date" value={formCrianca.data_nascimento} onChange={(v) => handleCrianca("data_nascimento", v)} />
          <Field label="Idade" value={formCrianca.idade} onChange={(v) => handleCrianca("idade", v)} />
          <Field label="Sexo" value={formCrianca.sexo} onChange={(v) => handleCrianca("sexo", v)} options={sexoOptions} />
          <Field label="Ano Escolar" value={formCrianca.ano_escolar} onChange={(v) => handleCrianca("ano_escolar", v)} />
          <Field label="Religião" value={formCrianca.religiao} onChange={(v) => handleCrianca("religiao", v)} gridSpan={2} />
    
          <SectionTitle>Responsável Legal</SectionTitle>
          <Field label="Nome do Responsável" value={formCrianca.resp_nome} onChange={(v) => handleCrianca("resp_nome", v)} gridSpan={2} />
          <Field label="Parentesco" value={formCrianca.resp_parentesco} onChange={(v) => handleCrianca("resp_parentesco", v)} />
          <Field label="Pai/Mãe através de adoção?" value={formCrianca.resp_adocao} onChange={(v) => handleCrianca("resp_adocao", v)} options={simNaoOptions} />
          <Field label="Idade do Responsável" value={formCrianca.resp_idade} onChange={(v) => handleCrianca("resp_idade", v)} />
          <Field label="Escolaridade" value={formCrianca.resp_escolaridade} onChange={(v) => handleCrianca("resp_escolaridade", v)} options={escolaridadeOptions} />
          <Field label="Profissão" value={formCrianca.resp_profissao} onChange={(v) => handleCrianca("resp_profissao", v)} />
          <Field label="CPF ou RG" value={formCrianca.resp_cpf_rg} onChange={(v) => handleCrianca("resp_cpf_rg", v)} />
        </div>
      )}
    
      {/* ─ Step 2: Informante + Disponibilidade ─ */}
      {criancaStep === 2 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <SectionTitle>Informante da Anamnese</SectionTitle>
          <Field label="Parentesco com o paciente" value={formCrianca.info_parentesco} onChange={(v) => handleCrianca("info_parentesco", v)} />
          <Field label="Endereço" value={formCrianca.info_endereco} onChange={(v) => handleCrianca("info_endereco", v)} />
          <Field label="Contatos" value={formCrianca.info_contatos} onChange={(v) => handleCrianca("info_contatos", v)} />
          <Field label="Tem algum outro familiar atendido por mim?" value={formCrianca.info_familiar_atendido} onChange={(v) => handleCrianca("info_familiar_atendido", v)} />
    
          <SectionTitle>Disponibilidade para Atendimento</SectionTitle>
          <div style={{ gridColumn: "1 / -1" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#faf9f6", borderBottom: "0.5px solid #e0dbd2" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#2B1F14", width: "40%" }}>Dia da Semana</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#2B1F14" }}>Horário disponível</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: "disp_segunda" as keyof FormCrianca, dia: "Segunda-feira" },
                  { key: "disp_terca" as keyof FormCrianca, dia: "Terça-feira" },
                  { key: "disp_quarta" as keyof FormCrianca, dia: "Quarta-feira" },
                  { key: "disp_quinta" as keyof FormCrianca, dia: "Quinta-feira" },
                  { key: "disp_sexta" as keyof FormCrianca, dia: "Sexta-feira" },
                  { key: "disp_sabado" as keyof FormCrianca, dia: "Sábado" },
                ].map(({ key, dia }) => (
                  <tr key={key} style={{ borderBottom: "0.5px solid #f0ece4" }}>
                    <td style={{ padding: "8px 12px", color: "#6B5E54", fontWeight: 600 }}>{dia}</td>
                    <td style={{ padding: "6px 12px" }}>
                      <input
                        type="text"
                        value={formCrianca[key] as string}
                        onChange={(e) => handleCrianca(key, e.target.value)}
                        placeholder="Ex: 14h às 18h"
                        style={{ width: "100%", padding: "6px 10px", border: "0.5px solid #d6d0c4", borderRadius: "6px", fontSize: "12px", fontFamily: "inherit" }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    
      {/* ─ Step 3: Queixa ─ */}
      {criancaStep === 3 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
          <SectionTitle>Queixa</SectionTitle>
          <Field label="De quem partiu o interesse/procura pela Psicoterapia?" value={formCrianca.queixa_origem} onChange={(v) => handleCrianca("queixa_origem", v)} textarea />
          <Field label="Se houve encaminhamento de outro profissional, de qual foi?" value={formCrianca.queixa_encaminhamento} onChange={(v) => handleCrianca("queixa_encaminhamento", v)} textarea />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="O paciente sabe do atendimento?" value={formCrianca.queixa_paciente_sabe} onChange={(v) => handleCrianca("queixa_paciente_sabe", v)} options={pacienteSabeOptions} />
            {formCrianca.queixa_paciente_sabe === "Não sabe" && (
              <Field label="Por que não sabe?" value={formCrianca.queixa_paciente_sabe_obs} onChange={(v) => handleCrianca("queixa_paciente_sabe_obs", v)} />
            )}
          </div>
          <Field label="Qual o motivo principal da procura? (como, quando, onde, com quem, desde quando)" value={formCrianca.queixa_principal} onChange={(v) => handleCrianca("queixa_principal", v)} textarea />
        </div>
      )}
    
      {/* ─ Step 4: Família e Moradia ─ */}
      {criancaStep === 4 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <SectionTitle>Família e Moradia</SectionTitle>
    
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Quem reside na casa (adicione um por vez):</label>
            {moradores.map((m, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "8px", marginBottom: "8px", alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "#9B8E84", display: "block", marginBottom: "3px" }}>Nome</label>
                  <input value={m.nome} onChange={(e) => { const n = [...moradores]; n[i] = { ...n[i], nome: e.target.value }; handleMoradores(n); }} style={{ width: "100%", padding: "8px 10px", border: "0.5px solid #d6d0c4", borderRadius: "6px", fontSize: "12px", fontFamily: "inherit" }} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "#9B8E84", display: "block", marginBottom: "3px" }}>Parentesco</label>
                  <input value={m.parentesco} onChange={(e) => { const n = [...moradores]; n[i] = { ...n[i], parentesco: e.target.value }; handleMoradores(n); }} style={{ width: "100%", padding: "8px 10px", border: "0.5px solid #d6d0c4", borderRadius: "6px", fontSize: "12px", fontFamily: "inherit" }} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "#9B8E84", display: "block", marginBottom: "3px" }}>Idade</label>
                  <input value={m.idade} onChange={(e) => { const n = [...moradores]; n[i] = { ...n[i], idade: e.target.value }; handleMoradores(n); }} style={{ width: "100%", padding: "8px 10px", border: "0.5px solid #d6d0c4", borderRadius: "6px", fontSize: "12px", fontFamily: "inherit" }} />
                </div>
                <button type="button" aria-label="Remover morador" onClick={() => handleMoradores(moradores.filter((_, j) => j !== i))} style={{ background: "#fef2f2", color: "#DC2626", border: "1px solid #fca5a5", borderRadius: "6px", padding: "8px 10px", fontSize: "11px", cursor: "pointer", fontWeight: 700 }}>✕</button>
              </div>
            ))}
            <button onClick={() => handleMoradores([...moradores, { nome: "", parentesco: "", idade: "" }])} style={{ background: "#f0f5f0", color: "#4a7a4e", border: "1px solid #c5dbc6", borderRadius: "6px", padding: "7px 14px", fontSize: "12px", cursor: "pointer", fontWeight: 600, marginTop: "4px" }}>
              + Adicionar morador
            </button>
          </div>
    
          <Field label="Renda familiar" value={formCrianca.familia_renda} onChange={(v) => handleCrianca("familia_renda", v)} gridSpan={2} />
          <Field label="O paciente possui cuidador/babá?" value={formCrianca.familia_cuidador} onChange={(v) => handleCrianca("familia_cuidador", v)} options={simNaoOptions} />
          <Field label="Quais membros da família trabalham?" value={formCrianca.familia_membros_trabalham} onChange={(v) => handleCrianca("familia_membros_trabalham", v)} />
          <Field label="Recebe auxílio governamental?" value={formCrianca.familia_auxilio} onChange={(v) => handleCrianca("familia_auxilio", v)} options={simNaoOptions} />
          <Field label="Se pais separados, ambos são provedores do sustento dos filhos?" value={formCrianca.familia_pais_provedores} onChange={(v) => handleCrianca("familia_pais_provedores", v)} options={simNaoOptions} />
          <Field label="A casa é:" value={formCrianca.familia_casa_tipo} onChange={(v) => handleCrianca("familia_casa_tipo", v)} options={casaTipoOptions} />
          <Field label="Valor do aluguel ou financiamento" value={formCrianca.familia_valor_aluguel} onChange={(v) => handleCrianca("familia_valor_aluguel", v)} />
          <Field label="A rua é pavimentada?" value={formCrianca.familia_rua_pavimentada} onChange={(v) => handleCrianca("familia_rua_pavimentada", v)} options={simNaoOptions} />
          <Field label="Tem acesso à água encanada e energia elétrica?" value={formCrianca.familia_agua_energia} onChange={(v) => handleCrianca("familia_agua_energia", v)} options={simNaoOptions} />
          <Field label="Sensação de segurança no bairro" value={formCrianca.familia_seguranca} onChange={(v) => handleCrianca("familia_seguranca", v)} options={segurancaOptions} gridSpan={2} />
          <Field label="Paciente dorme na própria cama?" value={formCrianca.familia_cama_propria} onChange={(v) => handleCrianca("familia_cama_propria", v)} options={simNaoOptions} />
          <Field label="Dorme sozinho no quarto?" value={formCrianca.familia_quarto_sozinho} onChange={(v) => handleCrianca("familia_quarto_sozinho", v)} options={simNaoOptions} />
          <Field label="Rotina diária do paciente" value={formCrianca.familia_rotina_paciente} onChange={(v) => handleCrianca("familia_rotina_paciente", v)} textarea gridSpan={2} />
          <Field label="Rotina geral dos outros membros da família" value={formCrianca.familia_rotina_familia} onChange={(v) => handleCrianca("familia_rotina_familia", v)} textarea gridSpan={2} />
          <Field label="Clima geral entre os moradores da casa atualmente" value={formCrianca.familia_clima_casa} onChange={(v) => handleCrianca("familia_clima_casa", v)} textarea gridSpan={2} />
          <Field label="Eventos importantes que afetaram o funcionamento da família (abusos, separação, morte)" value={formCrianca.familia_eventos_importantes} onChange={(v) => handleCrianca("familia_eventos_importantes", v)} textarea gridSpan={2} />
        </div>
      )}
    
      {/* ─ Step 5: Gestação e Parto ─ */}
      {criancaStep === 5 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <SectionTitle>Gestação</SectionTitle>
          <Field label="Gestação foi planejada?" value={formCrianca.gest_planejada} onChange={(v) => handleCrianca("gest_planejada", v)} options={simNaoOptions} />
          <Field label="Gestação foi aceita?" value={formCrianca.gest_aceita} onChange={(v) => handleCrianca("gest_aceita", v)} options={simNaoOptions} />
          <Field label="Gestação descoberta com quantas semanas?" value={formCrianca.gest_semanas_descoberta} onChange={(v) => handleCrianca("gest_semanas_descoberta", v)} />
          <Field label="Realizou pré-natal?" value={formCrianca.gest_pre_natal} onChange={(v) => handleCrianca("gest_pre_natal", v)} options={simNaoOptions} />
          {formCrianca.gest_pre_natal === "Sim" && (<>
            <Field label="Onde realizou?" value={formCrianca.gest_pre_natal_onde} onChange={(v) => handleCrianca("gest_pre_natal_onde", v)} />
            <Field label="A partir de quantas semanas?" value={formCrianca.gest_pre_natal_semanas} onChange={(v) => handleCrianca("gest_pre_natal_semanas", v)} />
          </>)}
          <Field label="Qualidade da relação entre gestante e família durante a gestação" value={formCrianca.gest_relacao_familia} onChange={(v) => handleCrianca("gest_relacao_familia", v)} textarea gridSpan={2} />
          <Field label="Trabalhou no período gestacional?" value={formCrianca.gest_trabalhou} onChange={(v) => handleCrianca("gest_trabalhou", v)} options={simNaoOptions} />
          {formCrianca.gest_trabalhou === "Sim" && (<>
            <Field label="Qual cargo exercia?" value={formCrianca.gest_trabalhou_cargo} onChange={(v) => handleCrianca("gest_trabalhou_cargo", v)} />
            <Field label="Trabalhou até que semana gestacional?" value={formCrianca.gest_trabalhou_semana} onChange={(v) => handleCrianca("gest_trabalhou_semana", v)} />
          </>)}
          <Field label="Hospitalizações durante a gravidez?" value={formCrianca.gest_hospitalizacoes} onChange={(v) => handleCrianca("gest_hospitalizacoes", v)} options={simNaoOptions} />
          {formCrianca.gest_hospitalizacoes === "Sim" && <Field label="Motivo e duração" value={formCrianca.gest_hospitalizacoes_motivo} onChange={(v) => handleCrianca("gest_hospitalizacoes_motivo", v)} />}
          <Field label="Intervenções cirúrgicas?" value={formCrianca.gest_cirurgias} onChange={(v) => handleCrianca("gest_cirurgias", v)} options={simNaoOptions} />
          {formCrianca.gest_cirurgias === "Sim" && <Field label="Motivo" value={formCrianca.gest_cirurgias_motivo} onChange={(v) => handleCrianca("gest_cirurgias_motivo", v)} />}
          <Field label="Uso de medicamentos?" value={formCrianca.gest_medicamentos} onChange={(v) => handleCrianca("gest_medicamentos", v)} options={simNaoOptions} />
          {formCrianca.gest_medicamentos === "Sim" && <Field label="Quais?" value={formCrianca.gest_medicamentos_quais} onChange={(v) => handleCrianca("gest_medicamentos_quais", v)} />}
          <Field label="Quedas durante período gestacional?" value={formCrianca.gest_quedas} onChange={(v) => handleCrianca("gest_quedas", v)} options={simNaoOptions} />
          {formCrianca.gest_quedas === "Sim" && <Field label="Período da gestação em que ocorreu" value={formCrianca.gest_quedas_periodo} onChange={(v) => handleCrianca("gest_quedas_periodo", v)} />}
          <Field label="Uso de álcool, cigarro ou drogas?" value={formCrianca.gest_drogas} onChange={(v) => handleCrianca("gest_drogas", v)} options={simNaoOptions} />
          {formCrianca.gest_drogas === "Sim" && <Field label="Especificar" value={formCrianca.gest_drogas_especificar} onChange={(v) => handleCrianca("gest_drogas_especificar", v)} />}
          <Field label="Realização de raio-x durante gestação?" value={formCrianca.gest_raio_x} onChange={(v) => handleCrianca("gest_raio_x", v)} options={simNaoOptions} />
          <Field label="Alguma doença na mãe durante a gestação?" value={formCrianca.gest_doencas_mae} onChange={(v) => handleCrianca("gest_doencas_mae", v)} options={simNaoOptions} />
          {formCrianca.gest_doencas_mae === "Sim" && <Field label="Especificar" value={formCrianca.gest_doencas_mae_especificar} onChange={(v) => handleCrianca("gest_doencas_mae_especificar", v)} />}
    
          <SectionTitle>Parto</SectionTitle>
          <Field label="Nascimento ocorreu com quantas semanas gestacionais?" value={formCrianca.gest_semanas_nascimento} onChange={(v) => handleCrianca("gest_semanas_nascimento", v)} />
          <Field label="Tipo de parto" value={formCrianca.gest_tipo_parto} onChange={(v) => handleCrianca("gest_tipo_parto", v)} options={tipoPartoOptions} />
          <Field label="Parto foi induzido ou ocorreu de forma natural?" value={formCrianca.gest_parto_induzido} onChange={(v) => handleCrianca("gest_parto_induzido", v)} />
          <Field label="Uso de fórceps?" value={formCrianca.gest_forceps} onChange={(v) => handleCrianca("gest_forceps", v)} options={simNaoOptions} />
          <Field label="Local de nascimento" value={formCrianca.gest_local_nascimento} onChange={(v) => handleCrianca("gest_local_nascimento", v)} />
          <Field label="Tempo estimado entre rompimento da bolsa e nascimento" value={formCrianca.gest_tempo_bolsa} onChange={(v) => handleCrianca("gest_tempo_bolsa", v)} />
          <Field label="Bebê nasceu roxinho?" value={formCrianca.gest_bebe_roxo} onChange={(v) => handleCrianca("gest_bebe_roxo", v)} options={simNaoOptions} />
          <Field label="Chorou logo ao nascer?" value={formCrianca.gest_chorou_nascer} onChange={(v) => handleCrianca("gest_chorou_nascer", v)} options={simNaoOptions} />
          <Field label="Bebê precisou de cuidados intensivos?" value={formCrianca.gest_cuidados_intensivos} onChange={(v) => handleCrianca("gest_cuidados_intensivos", v)} options={simNaoOptions} />
          {formCrianca.gest_cuidados_intensivos === "Sim" && <Field label="Por quanto tempo?" value={formCrianca.gest_cuidados_intensivos_tempo} onChange={(v) => handleCrianca("gest_cuidados_intensivos_tempo", v)} />}
          <Field label="Bebê respirou sozinho?" value={formCrianca.gest_respirou_sozinho} onChange={(v) => handleCrianca("gest_respirou_sozinho", v)} options={simNaoOptions} />
        </div>
      )}
    
      {/* ─ Step 6: Marcos do Desenvolvimento + 1º Ano ─ */}
      {criancaStep === 6 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <SectionTitle>Marcos do Desenvolvimento</SectionTitle>
          <Field label="Idade dos primeiros balbucios" value={formCrianca.marcos_balbucios} onChange={(v) => handleCrianca("marcos_balbucios", v)} />
          <Field label="Idade das primeiras palavras" value={formCrianca.marcos_palavras} onChange={(v) => handleCrianca("marcos_palavras", v)} />
          <Field label="Idade das primeiras frases completas" value={formCrianca.marcos_frases} onChange={(v) => handleCrianca("marcos_frases", v)} />
          <Field label="Idade em que firmou a cabeça" value={formCrianca.marcos_firmou_cabeca} onChange={(v) => handleCrianca("marcos_firmou_cabeca", v)} />
          <Field label="Idade em que sentou sozinho" value={formCrianca.marcos_sentou} onChange={(v) => handleCrianca("marcos_sentou", v)} />
          <Field label="Idade dos primeiros passos com apoio" value={formCrianca.marcos_passos_apoio} onChange={(v) => handleCrianca("marcos_passos_apoio", v)} />
          <Field label="Idade em que caminhou sem apoio" value={formCrianca.marcos_caminhou} onChange={(v) => handleCrianca("marcos_caminhou", v)} />
          <Field label="Idade em que sorriu para outras pessoas" value={formCrianca.marcos_sorriu} onChange={(v) => handleCrianca("marcos_sorriu", v)} />
          <Field label="Idade em que seguiu o olhar de adultos" value={formCrianca.marcos_seguiu_olhar} onChange={(v) => handleCrianca("marcos_seguiu_olhar", v)} />
          <Field label="Idade em que iniciou o apontar objetos" value={formCrianca.marcos_apontou} onChange={(v) => handleCrianca("marcos_apontou", v)} />
          <Field label="Cessou uso de fraldas — dia" value={formCrianca.marcos_fralda_dia} onChange={(v) => handleCrianca("marcos_fralda_dia", v)} />
          <Field label="Cessou uso de fraldas — noite" value={formCrianca.marcos_fralda_noite} onChange={(v) => handleCrianca("marcos_fralda_noite", v)} />
    
          <SectionTitle>Desenvolvimento no 1º Ano de Vida</SectionTitle>
          <Field label="Acompanhou a curva de crescimento?" value={formCrianca.dev1_curva} onChange={(v) => handleCrianca("dev1_curva", v)} options={simNaoOptions} />
          <Field label="Chorava muito?" value={formCrianca.dev1_chorava} onChange={(v) => handleCrianca("dev1_chorava", v)} options={simNaoOptions} />
          <Field label="Dormia muito?" value={formCrianca.dev1_dormia_muito} onChange={(v) => handleCrianca("dev1_dormia_muito", v)} options={simNaoOptions} />
          <Field label="Dormia pouco?" value={formCrianca.dev1_dormia_pouco} onChange={(v) => handleCrianca("dev1_dormia_pouco", v)} options={simNaoOptions} />
          <Field label="Teve muitas cólicas?" value={formCrianca.dev1_colicas} onChange={(v) => handleCrianca("dev1_colicas", v)} options={simNaoOptions} />
          <Field label="Vacinação completa no primeiro ano?" value={formCrianca.dev1_vacinacao} onChange={(v) => handleCrianca("dev1_vacinacao", v)} options={simNaoOptions} />
          <Field label="Como era o ambiente familiar nos primeiros anos de vida?" value={formCrianca.dev1_ambiente} onChange={(v) => handleCrianca("dev1_ambiente", v)} textarea gridSpan={2} />
        </div>
      )}
    
      {/* ─ Step 7: Histórico de Saúde ─ */}
      {criancaStep === 7 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <SectionTitle>Histórico de Saúde</SectionTitle>
          <Field label="Internações?" value={formCrianca.saude_internacoes} onChange={(v) => handleCrianca("saude_internacoes", v)} options={simNaoOptions} />
          {formCrianca.saude_internacoes === "Sim" && <Field label="Quantas, idades e duração" value={formCrianca.saude_internacoes_detalhes} onChange={(v) => handleCrianca("saude_internacoes_detalhes", v)} textarea />}
          <Field label="Uso de medicações atual?" value={formCrianca.saude_med_atual} onChange={(v) => handleCrianca("saude_med_atual", v)} options={simNaoOptions} />
          {formCrianca.saude_med_atual === "Sim" && <Field label="Quais e tempo de uso" value={formCrianca.saude_med_atual_detalhes} onChange={(v) => handleCrianca("saude_med_atual_detalhes", v)} textarea />}
          <Field label="Uso de medicações passada?" value={formCrianca.saude_med_passada} onChange={(v) => handleCrianca("saude_med_passada", v)} options={simNaoOptions} />
          {formCrianca.saude_med_passada === "Sim" && <Field label="Quais e tempo de uso" value={formCrianca.saude_med_passada_detalhes} onChange={(v) => handleCrianca("saude_med_passada_detalhes", v)} textarea />}
          <Field label="Problemas auditivos?" value={formCrianca.saude_auditivo} onChange={(v) => handleCrianca("saude_auditivo", v)} options={simNaoOptions} />
          {formCrianca.saude_auditivo === "Sim" && <Field label="Corrigidos?" value={formCrianca.saude_auditivo_corrigido} onChange={(v) => handleCrianca("saude_auditivo_corrigido", v)} options={simNaoOptions} />}
          <Field label="Problemas visuais?" value={formCrianca.saude_visual} onChange={(v) => handleCrianca("saude_visual", v)} options={simNaoOptions} />
          {formCrianca.saude_visual === "Sim" && <Field label="Corrigidos?" value={formCrianca.saude_visual_corrigido} onChange={(v) => handleCrianca("saude_visual_corrigido", v)} options={simNaoOptions} />}
          <Field label="Desmaios?" value={formCrianca.saude_desmaios} onChange={(v) => handleCrianca("saude_desmaios", v)} options={simNaoOptions} />
          {formCrianca.saude_desmaios === "Sim" && <Field label="Quantos e idades de ocorrência" value={formCrianca.saude_desmaios_detalhes} onChange={(v) => handleCrianca("saude_desmaios_detalhes", v)} />}
          <Field label="Convulsões?" value={formCrianca.saude_convulsoes} onChange={(v) => handleCrianca("saude_convulsoes", v)} options={simNaoOptions} />
          {formCrianca.saude_convulsoes === "Sim" && <Field label="Quantas e idades de ocorrência" value={formCrianca.saude_convulsoes_detalhes} onChange={(v) => handleCrianca("saude_convulsoes_detalhes", v)} />}
    
          <SectionTitle>Histórico de doenças</SectionTitle>
          <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            {([
              { key: "saude_meningite", label: "Meningite" },
              { key: "saude_encefalite", label: "Encefalite" },
              { key: "saude_sarampo", label: "Sarampo" },
              { key: "saude_rubeola", label: "Rubéola" },
              { key: "saude_caxumba", label: "Caxumba" },
              { key: "saude_coqueluche", label: "Coqueluche" },
              { key: "saude_pneumonia", label: "Pneumonia" },
            ] as { key: keyof FormCrianca; label: string }[]).map(({ key, label }) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", padding: "8px 10px", border: "0.5px solid #e0dbd2", borderRadius: "8px", background: formCrianca[key] === "Sim" ? "#f0f5f0" : "#fff" }}>
                <input type="checkbox" checked={formCrianca[key] === "Sim"} onChange={(e) => handleCrianca(key, e.target.checked ? "Sim" : "")} style={{ cursor: "pointer" }} />
                {label}
              </label>
            ))}
          </div>
          <Field label="Alergias?" value={formCrianca.saude_alergias} onChange={(v) => handleCrianca("saude_alergias", v)} options={simNaoOptions} />
          {formCrianca.saude_alergias === "Sim" && <Field label="Quais?" value={formCrianca.saude_alergias_quais} onChange={(v) => handleCrianca("saude_alergias_quais", v)} />}
          <Field label="Outras doenças?" value={formCrianca.saude_outras_doencas} onChange={(v) => handleCrianca("saude_outras_doencas", v)} options={simNaoOptions} />
          {formCrianca.saude_outras_doencas === "Sim" && <Field label="Quais?" value={formCrianca.saude_outras_doencas_quais} onChange={(v) => handleCrianca("saude_outras_doencas_quais", v)} />}
          <Field label="Realiza ou realizou acompanhamento com profissionais da saúde/educação?" value={formCrianca.saude_acompanhamento} onChange={(v) => handleCrianca("saude_acompanhamento", v)} options={simNaoOptions} />
          {formCrianca.saude_acompanhamento === "Sim" && <Field label="Quais profissionais, duração e objetivos" value={formCrianca.saude_acompanhamento_detalhes} onChange={(v) => handleCrianca("saude_acompanhamento_detalhes", v)} textarea />}
          <Field label="Reclama de dores físicas?" value={formCrianca.saude_dores} onChange={(v) => handleCrianca("saude_dores", v)} options={simNaoOptions} />
          {formCrianca.saude_dores === "Sim" && (<>
            <Field label="Quais?" value={formCrianca.saude_dores_quais} onChange={(v) => handleCrianca("saude_dores_quais", v)} />
            <Field label="Frequência" value={formCrianca.saude_dores_frequencia} onChange={(v) => handleCrianca("saude_dores_frequencia", v)} />
          </>)}
          <Field label="Diagnósticos prévios?" value={formCrianca.saude_diagnosticos} onChange={(v) => handleCrianca("saude_diagnosticos", v)} options={simNaoOptions} />
          {formCrianca.saude_diagnosticos === "Sim" && <Field label="Quais?" value={formCrianca.saude_diagnosticos_quais} onChange={(v) => handleCrianca("saude_diagnosticos_quais", v)} textarea />}
        </div>
      )}
    
      {/* ─ Step 8: Socialização + Autonomia ─ */}
      {criancaStep === 8 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <SectionTitle>Socialização</SectionTitle>
          <Field label="Tem amigos?" value={formCrianca.social_tem_amigos} onChange={(v) => handleCrianca("social_tem_amigos", v)} options={simNaoOptions} />
          <Field label="Tem um melhor amigo(a)?" value={formCrianca.social_melhor_amigo} onChange={(v) => handleCrianca("social_melhor_amigo", v)} options={simNaoOptions} />
          <Field label="Preferência por interação com crianças mais novas ou mais velhas?" value={formCrianca.social_preferencia_idade} onChange={(v) => handleCrianca("social_preferencia_idade", v)} gridSpan={2} />
          <Field label="Histórico de bullying na escola?" value={formCrianca.social_bullying} onChange={(v) => handleCrianca("social_bullying", v)} options={simNaoOptions} />
          <Field label="Ao chegar em ambientes novos, busca interação com outras pessoas?" value={formCrianca.social_busca_interacao} onChange={(v) => handleCrianca("social_busca_interacao", v)} textarea />
          <Field label="Consegue/conseguia se adaptar a brincadeiras propostas por outras crianças?" value={formCrianca.social_adapta_brincadeiras} onChange={(v) => handleCrianca("social_adapta_brincadeiras", v)} options={simNaoOptions} />
          <Field label="Mantém conversas com grupos sobre assuntos diversos?" value={formCrianca.social_conversa_grupos} onChange={(v) => handleCrianca("social_conversa_grupos", v)} options={simNaoOptions} />
          <Field label="Como você descreve a relação do paciente com o pai?" value={formCrianca.social_relacao_pai} onChange={(v) => handleCrianca("social_relacao_pai", v)} textarea gridSpan={2} />
          <Field label="Como você descreve a relação do paciente com a mãe?" value={formCrianca.social_relacao_mae} onChange={(v) => handleCrianca("social_relacao_mae", v)} textarea gridSpan={2} />
          <Field label="Como você descreve a relação do paciente com irmãos?" value={formCrianca.social_relacao_irmaos} onChange={(v) => handleCrianca("social_relacao_irmaos", v)} textarea gridSpan={2} />
          <Field label="Como você descreve a relação do paciente com professor(a)?" value={formCrianca.social_relacao_professor} onChange={(v) => handleCrianca("social_relacao_professor", v)} textarea gridSpan={2} />
          <Field label="Como reage quando é negado algum desejo?" value={formCrianca.social_reage_negacao} onChange={(v) => handleCrianca("social_reage_negacao", v)} textarea gridSpan={2} />
          <Field label="Frequenta casa de amigos ou eles frequentam a casa do paciente?" value={formCrianca.social_frequenta_amigos} onChange={(v) => handleCrianca("social_frequenta_amigos", v)} options={simNaoOptions} />
          <Field label="Tem outro familiar ou pessoa de quem o paciente é muito próximo?" value={formCrianca.social_familiar_proximo} onChange={(v) => handleCrianca("social_familiar_proximo", v)} textarea />
          <Field label="Tem interesses? Quais?" value={formCrianca.social_interesses} onChange={(v) => handleCrianca("social_interesses", v)} textarea gridSpan={2} />
          <Field label="Tem algum interesse específico? Apresenta dificuldades para mudar o foco?" value={formCrianca.social_interesse_especifico} onChange={(v) => handleCrianca("social_interesse_especifico", v)} textarea gridSpan={2} />
          <Field label="Como a criança lida com a rotina e com mudanças em sua rotina?" value={formCrianca.social_lida_rotina} onChange={(v) => handleCrianca("social_lida_rotina", v)} textarea gridSpan={2} />
          <Field label="Considera os interesses da criança apropriados para a faixa etária?" value={formCrianca.social_interesses_faixa_etaria} onChange={(v) => handleCrianca("social_interesses_faixa_etaria", v)} options={simNaoOptions} />
    
          <SectionTitle>Autonomia</SectionTitle>
          <Field label="Reconhece, maneja dinheiro e lida com troco?" value={formCrianca.auto_dinheiro} onChange={(v) => handleCrianca("auto_dinheiro", v)} textarea gridSpan={2} />
          <Field label="Realiza atividades de higiene pessoal sozinho? (se não, especificar)" value={formCrianca.auto_higiene} onChange={(v) => handleCrianca("auto_higiene", v)} textarea gridSpan={2} />
          <Field label="É capaz de fazer refeições simples sozinho(a)?" value={formCrianca.auto_refeicoes} onChange={(v) => handleCrianca("auto_refeicoes", v)} options={simNaoOptions} />
          <Field label="É capaz de olhar as horas?" value={formCrianca.auto_horas} onChange={(v) => handleCrianca("auto_horas", v)} options={simNaoOptions} />
          <Field label="É capaz de gerenciar o próprio tempo?" value={formCrianca.auto_tempo} onChange={(v) => handleCrianca("auto_tempo", v)} options={simNaoOptions} />
          <Field label="É capaz de vestir sozinho(a)?" value={formCrianca.auto_vestir} onChange={(v) => handleCrianca("auto_vestir", v)} options={simNaoOptions} />
          <Field label="É capaz de escolher as próprias roupas sozinho(a)?" value={formCrianca.auto_escolher_roupas} onChange={(v) => handleCrianca("auto_escolher_roupas", v)} options={simNaoOptions} />
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Escala de autonomia (0 = nada dependente, 3 = completamente dependente)</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { v: "0", label: "0 — nunca é dependente" },
                { v: "1", label: "1 — às vezes é dependente" },
                { v: "2", label: "2 — frequentemente é dependente" },
                { v: "3", label: "3 — sempre é dependente" },
              ].map(({ v, label }) => {
                const sel = formCrianca.auto_escala === v;
                return (
                  <button type="button" key={v} aria-pressed={sel} onClick={() => handleCrianca("auto_escala", v)} style={{ flex: 1, fontFamily: "inherit", textAlign: "center", padding: "10px 8px", cursor: "pointer", borderRadius: "8px", fontSize: "12px", fontWeight: 600, background: sel ? "#E07A6E" : "#f0ece4", color: sel ? "#fff" : "#2B1F14", border: sel ? "none" : "0.5px solid #d6d0c4", transition: "all 0.15s" }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    
      {/* ─ Step 9: Sono + Alimentação + Habilidades Narrativas ─ */}
      {criancaStep === 9 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <SectionTitle>Sono</SectionTitle>
          <Field label="Dificuldades para pegar no sono?" value={formCrianca.sono_pegar} onChange={(v) => handleCrianca("sono_pegar", v)} options={simNaoOptions} />
          <Field label="Dificuldades em despertar do sono?" value={formCrianca.sono_despertar} onChange={(v) => handleCrianca("sono_despertar", v)} options={simNaoOptions} />
          <Field label="Se movimenta muito dormindo?" value={formCrianca.sono_movimenta} onChange={(v) => handleCrianca("sono_movimenta", v)} options={simNaoOptions} />
          <Field label="Reclama de pesadelos?" value={formCrianca.sono_pesadelos} onChange={(v) => handleCrianca("sono_pesadelos", v)} options={simNaoOptions} />
          <Field label="Ronca?" value={formCrianca.sono_ronca} onChange={(v) => handleCrianca("sono_ronca", v)} options={simNaoOptions} />
          {formCrianca.sono_ronca === "Sim" && (<>
            <Field label="Desde quando?" value={formCrianca.sono_ronca_desde} onChange={(v) => handleCrianca("sono_ronca_desde", v)} />
            <Field label="Com que frequência?" value={formCrianca.sono_ronca_freq} onChange={(v) => handleCrianca("sono_ronca_freq", v)} />
          </>)}
          <Field label="Enurese (xixi na cama)?" value={formCrianca.sono_enurese} onChange={(v) => handleCrianca("sono_enurese", v)} options={simNaoOptions} />
          {formCrianca.sono_enurese === "Sim" && (<>
            <Field label="Desde quando?" value={formCrianca.sono_enurese_desde} onChange={(v) => handleCrianca("sono_enurese_desde", v)} />
            <Field label="Com que frequência?" value={formCrianca.sono_enurese_freq} onChange={(v) => handleCrianca("sono_enurese_freq", v)} />
          </>)}
          <Field label="Tempo médio de sono por noite" value={formCrianca.sono_tempo} onChange={(v) => handleCrianca("sono_tempo", v)} />
          <Field label="Tem rotina de sono?" value={formCrianca.sono_rotina} onChange={(v) => handleCrianca("sono_rotina", v)} options={simNaoOptions} />
          {formCrianca.sono_rotina === "Sim" && <Field label="Horário" value={formCrianca.sono_rotina_horario} onChange={(v) => handleCrianca("sono_rotina_horario", v)} />}
    
          <SectionTitle>Alimentação</SectionTitle>
          <Field label="Amamentou no peito?" value={formCrianca.alim_amamentou} onChange={(v) => handleCrianca("alim_amamentou", v)} options={simNaoOptions} />
          {formCrianca.alim_amamentou === "Sim" && <Field label="Até qual idade?" value={formCrianca.alim_amamentou_idade} onChange={(v) => handleCrianca("alim_amamentou_idade", v)} />}
          <Field label="Peso compatível ao esperado para tamanho e idade?" value={formCrianca.alim_peso} onChange={(v) => handleCrianca("alim_peso", v)} options={simNaoOptions} />
          <Field label="Restrição alérgica a algum alimento?" value={formCrianca.alim_restricao} onChange={(v) => handleCrianca("alim_restricao", v)} options={simNaoOptions} />
          <Field label="Apresenta resistência a ingestão de algum alimento?" value={formCrianca.alim_resistencia} onChange={(v) => handleCrianca("alim_resistencia", v)} options={simNaoOptions} />
          <Field label="Tem muita fome?" value={formCrianca.alim_muita_fome} onChange={(v) => handleCrianca("alim_muita_fome", v)} options={simNaoOptions} />
          <Field label="Tinha muita fome nos primeiros anos de vida?" value={formCrianca.alim_muita_fome_primeiros} onChange={(v) => handleCrianca("alim_muita_fome_primeiros", v)} options={simNaoOptions} />
          <Field label="Como descreve o padrão alimentar do(a) filho(a)?" value={formCrianca.alim_padrao} onChange={(v) => handleCrianca("alim_padrao", v)} textarea gridSpan={2} />
    
          <SectionTitle>Habilidades Narrativas</SectionTitle>
          <Field label="A criança se interessa por histórias (leitura, filmes)?" value={formCrianca.narr_historias} onChange={(v) => handleCrianca("narr_historias", v)} options={simNaoOptions} />
          <Field label="Consegue recontá-las de forma coesa e coerente?" value={formCrianca.narr_recontar} onChange={(v) => handleCrianca("narr_recontar", v)} options={simNaoOptions} />
          <Field label="Consegue entender humor (piadas)?" value={formCrianca.narr_humor} onChange={(v) => handleCrianca("narr_humor", v)} options={simNaoOptions} />
          <Field label="Consegue recontar piadas de forma engraçada?" value={formCrianca.narr_piadas} onChange={(v) => handleCrianca("narr_piadas", v)} options={simNaoOptions} />
          <Field label="Explica situações vivenciadas na escola de forma a se fazer entender?" value={formCrianca.narr_escola} onChange={(v) => handleCrianca("narr_escola", v)} options={simNaoOptions} />
          <Field label="Repassa recados de forma funcional?" value={formCrianca.narr_recados} onChange={(v) => handleCrianca("narr_recados", v)} options={simNaoOptions} />
        </div>
      )}
    
      {/* ─ Step 10: Orientação + Vida Escolar ─ */}
      {criancaStep === 10 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <SectionTitle>Orientação no Tempo e Espaço</SectionTitle>
          <div style={{ gridColumn: "1 / -1", background: "#faf9f6", borderRadius: "10px", padding: "16px", border: "0.5px solid #e0dbd2" }}>
            <label style={labelStyle}>A criança entende os seguintes conceitos?</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {([
                { key: "ori_direita_esquerda", label: "Direita / Esquerda" },
                { key: "ori_cima_baixo", label: "Cima / Baixo" },
                { key: "ori_atras_frente", label: "Atrás / Frente" },
                { key: "ori_ontem_hoje_amanha", label: "Ontem / Hoje / Amanhã" },
                { key: "ori_manha_tarde_noite", label: "Manhã / Tarde / Noite" },
                { key: "ori_dias_semana", label: "Sabe os dias da semana" },
                { key: "ori_calendario", label: "Sabe olhar no calendário" },
                { key: "ori_aniversario", label: "Sabe a data do próprio aniversário" },
                { key: "ori_ambientes_novos", label: "Sabe andar sozinha em ambientes novos" },
                { key: "ori_propria_casa", label: "Sabe se locomover sozinha na própria casa" },
                { key: "ori_escola", label: "Sabe se locomover sozinha na escola" },
              ] as { key: keyof FormCrianca; label: string }[]).map(({ key, label }) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer", padding: "6px 10px", borderRadius: "6px", background: formCrianca[key] === "Sim" ? "#e8f2e8" : "#fff", border: "0.5px solid #e0dbd2" }}>
                  <input type="checkbox" checked={formCrianca[key] === "Sim"} onChange={(e) => handleCrianca(key, e.target.checked ? "Sim" : "Não")} style={{ cursor: "pointer" }} />
                  {label}
                </label>
              ))}
            </div>
          </div>
    
          <SectionTitle>Vida Escolar</SectionTitle>
          <Field label="Iniciou a vida escolar com qual idade?" value={formCrianca.esc_idade_inicio} onChange={(v) => handleCrianca("esc_idade_inicio", v)} />
          <Field label="É alfabetizado(a)?" value={formCrianca.esc_alfabetizado} onChange={(v) => handleCrianca("esc_alfabetizado", v)} options={simNaoOptions} />
          <Field label="Reconhece letras?" value={formCrianca.esc_letras} onChange={(v) => handleCrianca("esc_letras", v)} options={simNaoOptions} />
          <Field label="Reconhece números?" value={formCrianca.esc_numeros} onChange={(v) => handleCrianca("esc_numeros", v)} options={simNaoOptions} />
          <Field label="Reconhece e identifica cores?" value={formCrianca.esc_cores} onChange={(v) => handleCrianca("esc_cores", v)} options={simNaoOptions} />
          <Field label="Histórico de reprovação?" value={formCrianca.esc_reprovacao} onChange={(v) => handleCrianca("esc_reprovacao", v)} options={simNaoOptions} />
          {formCrianca.esc_reprovacao === "Sim" && <Field label="Anos de reprovação e quantidade" value={formCrianca.esc_reprovacao_detalhes} onChange={(v) => handleCrianca("esc_reprovacao_detalhes", v)} />}
          <Field label="Dificuldades generalizadas em disciplinas escolares?" value={formCrianca.esc_dificuldades_gerais} onChange={(v) => handleCrianca("esc_dificuldades_gerais", v)} options={simNaoOptions} />
          <Field label="Dificuldades em alguma disciplina específica?" value={formCrianca.esc_dificuldades_especifica} onChange={(v) => handleCrianca("esc_dificuldades_especifica", v)} options={simNaoOptions} />
          {formCrianca.esc_dificuldades_especifica === "Sim" && <Field label="Qual(is)?" value={formCrianca.esc_dificuldades_quais} onChange={(v) => handleCrianca("esc_dificuldades_quais", v)} />}
          <Field label="Queixas de comportamento no ambiente escolar?" value={formCrianca.esc_queixas_comportamento} onChange={(v) => handleCrianca("esc_queixas_comportamento", v)} textarea gridSpan={2} />
          <Field label="Rotina de estudo em casa?" value={formCrianca.esc_rotina_estudo} onChange={(v) => handleCrianca("esc_rotina_estudo", v)} options={simNaoOptions} />
          <Field label="Que horas realiza o dever em casa?" value={formCrianca.esc_horario_dever} onChange={(v) => handleCrianca("esc_horario_dever", v)} />
          <Field label="Descreva o ambiente em que a criança estuda em casa" value={formCrianca.esc_ambiente_estudo} onChange={(v) => handleCrianca("esc_ambiente_estudo", v)} textarea gridSpan={2} />
          <Field label="Quem dá suporte na realização de tarefas escolares?" value={formCrianca.esc_suporte_tarefas} onChange={(v) => handleCrianca("esc_suporte_tarefas", v)} textarea gridSpan={2} />
        </div>
      )}
    
      {/* ─ Step 11: Estilo Parental + Histórico Genético + Temperamento ─ */}
      {criancaStep === 11 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <SectionTitle>Estilo Parental</SectionTitle>
          <Field label="Adoção de castigos físicos com a criança?" value={formCrianca.par_castigos_fisicos} onChange={(v) => handleCrianca("par_castigos_fisicos", v)} textarea gridSpan={2} />
          <Field label="Uso de xingamentos e ameaças com a criança?" value={formCrianca.par_xingamentos} onChange={(v) => handleCrianca("par_xingamentos", v)} textarea gridSpan={2} />
          <Field label="Adoção de conversas sobre comportamentos-problema?" value={formCrianca.par_conversas} onChange={(v) => handleCrianca("par_conversas", v)} textarea gridSpan={2} />
          <Field label="Adoção de negociações com a criança?" value={formCrianca.par_negociacoes} onChange={(v) => handleCrianca("par_negociacoes", v)} textarea gridSpan={2} />
          <Field label="Adoção de elogios com a criança?" value={formCrianca.par_elogios} onChange={(v) => handleCrianca("par_elogios", v)} textarea gridSpan={2} />
          <Field label="Hábito de troca de carinhos físicos (abraços, carinhos)?" value={formCrianca.par_carinhos} onChange={(v) => handleCrianca("par_carinhos", v)} textarea gridSpan={2} />
    
          <SectionTitle>Histórico Genético Familiar</SectionTitle>
          <Field label="Algum familiar apresenta dificuldades na escola? (grau de parentesco e dificuldades)" value={formCrianca.gen_dificuldades_escola} onChange={(v) => handleCrianca("gen_dificuldades_escola", v)} textarea gridSpan={2} />
          <Field label="Algum familiar apresenta diagnóstico psiquiátrico ou suspeita?" value={formCrianca.gen_diagnostico_psiquiatrico} onChange={(v) => handleCrianca("gen_diagnostico_psiquiatrico", v)} textarea gridSpan={2} />
          <Field label="Algum familiar apresenta diagnóstico de síndrome genética?" value={formCrianca.gen_sindrome} onChange={(v) => handleCrianca("gen_sindrome", v)} textarea gridSpan={2} />
          <Field label="Algum familiar faz uso de medicações controladas?" value={formCrianca.gen_medicacoes_controladas} onChange={(v) => handleCrianca("gen_medicacoes_controladas", v)} textarea gridSpan={2} />
          <Field label="Algum membro da família já teve tentativa de suicídio?" value={formCrianca.gen_tentativa_suicidio} onChange={(v) => handleCrianca("gen_tentativa_suicidio", v)} options={simNaoOptions} />
          {formCrianca.gen_tentativa_suicidio === "Sim" && <Field label="Grau de parentesco" value={formCrianca.gen_tentativa_suicidio_parentesco} onChange={(v) => handleCrianca("gen_tentativa_suicidio_parentesco", v)} />}
          <Field label="Algum membro da família já morreu por suicídio?" value={formCrianca.gen_morte_suicidio} onChange={(v) => handleCrianca("gen_morte_suicidio", v)} options={simNaoOptions} />
    
          <SectionTitle>Temperamento</SectionTitle>
          <Field label="Como você descreve o funcionamento da criança? (ativa/plácida, irritadiça/calma, desafiadora/adequada às regras, busca por contato social)" value={formCrianca.temp_descricao} onChange={(v) => handleCrianca("temp_descricao", v)} textarea gridSpan={2} />
          <Field label="Descreva as maiores dificuldades na interação com seu filho(a) atualmente (liste até 6):" value={formCrianca.temp_dificuldades} onChange={(v) => handleCrianca("temp_dificuldades", v)} textarea gridSpan={2} />
          <div style={{ gridColumn: "1 / -1" }}>{blocoVisibilidade}</div>
        </div>
      )}
    </>
  );
}
