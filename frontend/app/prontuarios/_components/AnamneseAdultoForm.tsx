"use client";

import type { ReactNode } from "react";
import type { FormAnamnese } from "@/lib/types/prontuario";
import type { CheckboxFieldKey } from "../_lib/tipos";
import { labelStyle, SectionTitle, Field, CheckboxGroup, MultiSelectGroup } from "./ui";
import {
  sexoOptions,
  estadoCivilOptions,
  escolaridadeOptions,
  desempregadoOptions,
  atitudeOptions,
  sensopercpcaoOptions,
  humorOptions,
  conscienciaDoencaOptions,
  expansaoEuOptions,
  retracaoEuOptions,
  negacaoEuOptions,
  linguagemOptions,
} from "../_lib/opcoes";

interface AnamneseAdultoFormProps {
  formAnamnese: FormAnamnese;
  errors: Record<string, string>;
  currentStep: number;
  handleAnamnese: (field: keyof FormAnamnese, value: string | boolean) => void;
  handleCheckbox: (field: CheckboxFieldKey, checked: boolean) => void;
  blocoVisibilidade: ReactNode;
}

export default function AnamneseAdultoForm({ formAnamnese, errors, currentStep, handleAnamnese, handleCheckbox, blocoVisibilidade }: AnamneseAdultoFormProps) {
  return (
    <>
      {currentStep === 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <SectionTitle>Informações do Atendimento</SectionTitle>
          <Field label="Data do Atendimento *" error={errors.data_atendimento} type="date" value={formAnamnese.data_atendimento} onChange={(v) => handleAnamnese("data_atendimento", v)} />
          <Field label="Psicólogo/Estagiário" value={formAnamnese.psicologo_estagiario} onChange={(v) => handleAnamnese("psicologo_estagiario", v)} disabled />
    
          <SectionTitle>Identificação do Paciente</SectionTitle>
          <Field label="Nome *" error={errors.nome} value={formAnamnese.nome} onChange={(v) => handleAnamnese("nome", v)} gridSpan={2} />
          <Field label="Data de Nascimento" type="date" value={formAnamnese.data_nascimento} onChange={(v) => handleAnamnese("data_nascimento", v)} />
          <Field label="Idade" value={formAnamnese.idade} onChange={(v) => handleAnamnese("idade", v)} />
          <Field label="Sexo" value={formAnamnese.sexo} onChange={(v) => handleAnamnese("sexo", v)} options={sexoOptions} />
          <Field label="Nacionalidade" value={formAnamnese.nacionalidade} onChange={(v) => handleAnamnese("nacionalidade", v)} />
          <Field label="Estado Civil" value={formAnamnese.civil} onChange={(v) => handleAnamnese("civil", v)} options={estadoCivilOptions} />
          <Field label="Telefone" value={formAnamnese.telefone} onChange={(v) => handleAnamnese("telefone", v)} />
          <Field label="Residência (Endereço)" value={formAnamnese.residencia} onChange={(v) => handleAnamnese("residencia", v)} gridSpan={2} />
    
          <SectionTitle>Aspectos Sociais e Profissionais</SectionTitle>
          <Field label="Escolaridade" value={formAnamnese.escolaridade} onChange={(v) => handleAnamnese("escolaridade", v)} options={escolaridadeOptions} />
          <Field label="Ocupação Atual" value={formAnamnese.ocupacao} onChange={(v) => handleAnamnese("ocupacao", v)} />
          <Field label="Profissão (Formação)" value={formAnamnese.profissao} onChange={(v) => handleAnamnese("profissao", v)} />
          <div />
          <Field label="Desempregado?" value={formAnamnese.desempregado} onChange={(v) => handleAnamnese("desempregado", v)} options={desempregadoOptions} />
          {formAnamnese.desempregado === "Sim" && (
            <Field label="Tempo Desemprego" value={formAnamnese.tempo_desemprego} onChange={(v) => handleAnamnese("tempo_desemprego", v)} />
          )}
        </div>
      )}
    
      {currentStep === 2 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
          <SectionTitle>Queixa e Demanda Atual</SectionTitle>
          <Field label="Queixa Principal *" error={errors.queixa_principal} value={formAnamnese.queixa_principal} onChange={(v) => handleAnamnese("queixa_principal", v)} textarea />
          <Field label="Queixa Secundária" value={formAnamnese.queixa_secundaria} onChange={(v) => handleAnamnese("queixa_secundaria", v)} textarea />
          <Field label="Sintomas" value={formAnamnese.sintomas} onChange={(v) => handleAnamnese("sintomas", v)} textarea />
          <Field label="Expectativas e Objetivos com a Terapia" value={formAnamnese.expectativas_objetivos} onChange={(v) => handleAnamnese("expectativas_objetivos", v)} textarea />
    
          <SectionTitle>Histórico de Saúde e Hábitos</SectionTitle>
          <Field label="Psicoterapia Anterior" value={formAnamnese.psicoterapia_anterior} onChange={(v) => handleAnamnese("psicoterapia_anterior", v)} textarea />
          <Field label="Doenças / Transtornos Psiquiátricos" value={formAnamnese.doencas_transtornos} onChange={(v) => handleAnamnese("doencas_transtornos", v)} textarea />
          <Field label="Patologia Pregressa" value={formAnamnese.patologia_pregressa} onChange={(v) => handleAnamnese("patologia_pregressa", v)} textarea />
          <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "8px", border: "1px solid #e0dbd2", display: "grid", gap: "12px" }}>
            <Field label="Uso de Medicamentos" value={formAnamnese.medicamentos} onChange={(v) => handleAnamnese("medicamentos", v)} textarea />
            <Field label="Uso de Drogas / Substâncias" value={formAnamnese.uso_drogas} onChange={(v) => handleAnamnese("uso_drogas", v)} textarea />
            <Field label="Ideação Suicida" value={formAnamnese.ideacao_suicida} onChange={(v) => handleAnamnese("ideacao_suicida", v)} textarea />
          </div>
        </div>
      )}
    
      {currentStep === 3 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
          <SectionTitle>Histórico Pessoal e Rotina</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="Infância" value={formAnamnese.historico_infancia} onChange={(v) => handleAnamnese("historico_infancia", v)} textarea />
            <Field label="Adolescência" value={formAnamnese.adolescencia} onChange={(v) => handleAnamnese("adolescencia", v)} textarea />
          </div>
          <Field label="Rotina Diária" value={formAnamnese.rotina} onChange={(v) => handleAnamnese("rotina", v)} textarea />
          <Field label="Dinâmica de Trabalho" value={formAnamnese.trabalho} onChange={(v) => handleAnamnese("trabalho", v)} textarea />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="Vícios ou Hábitos" value={formAnamnese.vicios} onChange={(v) => handleAnamnese("vicios", v)} textarea />
            <Field label="Hobbies e Lazer" value={formAnamnese.hobbies} onChange={(v) => handleAnamnese("hobbies", v)} textarea />
          </div>
    
          <SectionTitle>Histórico Familiar e Social</SectionTitle>
          <Field label="Composição do Lar" value={formAnamnese.lar} onChange={(v) => handleAnamnese("lar", v)} textarea />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="Pais/Cuidadores" value={formAnamnese.pais_cuidadores} onChange={(v) => handleAnamnese("pais_cuidadores", v)} textarea />
            <Field label="Irmãos" value={formAnamnese.irmaos} onChange={(v) => handleAnamnese("irmaos", v)} textarea />
            <Field label="Cônjuge" value={formAnamnese.conjuge} onChange={(v) => handleAnamnese("conjuge", v)} textarea />
            <Field label="Filhos" value={formAnamnese.filhos} onChange={(v) => handleAnamnese("filhos", v)} textarea />
          </div>
          <Field label="Relacionamentos Atuais" value={formAnamnese.relacionamentos_atuais} onChange={(v) => handleAnamnese("relacionamentos_atuais", v)} textarea />
        </div>
      )}
    
      {currentStep === 4 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
          <SectionTitle>Aspectos Gerais</SectionTitle>
          <Field label="Aparência" value={formAnamnese.aparencia} onChange={(v) => handleAnamnese("aparencia", v)} textarea />
          <Field label="Comportamento Geral" value={formAnamnese.comportamento} onChange={(v) => handleAnamnese("comportamento", v)} textarea />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="Atitude com o entrevistador" value={formAnamnese.atitude_entrevistador} onChange={(v) => handleAnamnese("atitude_entrevistador", v)} options={atitudeOptions} />
          </div>
    
          <SectionTitle>Orientação</SectionTitle>
          <div style={{ background: "#f9f9f9", padding: "16px", borderRadius: "8px", border: "1px solid #e0dbd2" }}>
            <label style={labelStyle}>O paciente encontra-se orientado de forma:</label>
            <CheckboxGroup items={[
              { key: "orientacao_autoidentificatoria", label: "Autoidentificatória (sabe quem é)" },
              { key: "orientacao_corporal", label: "Corporal (reconhece o próprio corpo)" },
              { key: "orientacao_temporal", label: "Temporal (sabe data, hora, ano)" },
              { key: "orientacao_espacial", label: "Espacial (sabe onde está)" },
              { key: "orientacao_patologia", label: "Em relação à patologia (sabe por que está ali)" },
            ]} form={formAnamnese} onChange={handleCheckbox} />
          </div>
          <Field label="Observações sobre Orientação" value={formAnamnese.orientacao_observacoes} onChange={(v) => handleAnamnese("orientacao_observacoes", v)} textarea />
    
          <SectionTitle>Atenção e Funções Cognitivas</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="Atenção — Vigilância (capacidade de focar)" value={formAnamnese.atencao_vigilancia} onChange={(v) => handleAnamnese("atencao_vigilancia", v)} textarea />
            <Field label="Atenção — Tenacidade (capacidade de manter o foco)" value={formAnamnese.atencao_tenacidade} onChange={(v) => handleAnamnese("atencao_tenacidade", v)} textarea />
            <Field label="Memória (imediata, recente, remota)" value={formAnamnese.memoria} onChange={(v) => handleAnamnese("memoria", v)} textarea />
            <Field label="Inteligência (aparente/estimada)" value={formAnamnese.inteligencia} onChange={(v) => handleAnamnese("inteligencia", v)} textarea />
          </div>
    
          <SectionTitle>Sensopercepção</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="Sensopercepção" value={formAnamnese.sensopercpcao} onChange={(v) => handleAnamnese("sensopercpcao", v)} options={sensopercpcaoOptions} />
          </div>
        </div>
      )}
    
      {currentStep === 5 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
          <SectionTitle>Pensamento e Conteúdo</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div style={{ background: "#f9f9f9", padding: "16px", borderRadius: "8px", border: "1px solid #e0dbd2" }}>
              <label style={labelStyle}>Curso do Pensamento:</label>
              <CheckboxGroup items={[
                { key: "pensamento_acelerado", label: "Acelerado" },
                { key: "pensamento_retardado", label: "Retardado" },
                { key: "pensamento_fuga", label: "Fuga de Ideias" },
                { key: "pensamento_bloqueio", label: "Bloqueio" },
                { key: "pensamento_prolixo", label: "Prolixo" },
                { key: "pensamento_repeticao", label: "Repetição" },
              ]} form={formAnamnese} onChange={handleCheckbox} />
            </div>
            <div style={{ background: "#f9f9f9", padding: "16px", borderRadius: "8px", border: "1px solid #e0dbd2" }}>
              <label style={labelStyle}>Conteúdo Predominante:</label>
              <CheckboxGroup items={[
                { key: "conteudo_obsessoes", label: "Obsessões" },
                { key: "conteudo_hipocondrias", label: "Hipocondrias" },
                { key: "conteudo_fobias", label: "Fobias" },
                { key: "conteudo_delirios", label: "Delírios" },
              ]} form={formAnamnese} onChange={handleCheckbox} />
            </div>
          </div>
    
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "8px" }}>
            <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "8px", border: "1px solid #e0dbd2" }}>
              <label style={labelStyle}>Expansão do Eu:</label>
              <MultiSelectGroup value={formAnamnese.expansao_eu_opcoes} options={expansaoEuOptions} onChange={(v) => handleAnamnese("expansao_eu_opcoes", v)} />
            </div>
            <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "8px", border: "1px solid #e0dbd2" }}>
              <label style={labelStyle}>Retração do Eu:</label>
              <MultiSelectGroup value={formAnamnese.retracao_eu_opcoes} options={retracaoEuOptions} onChange={(v) => handleAnamnese("retracao_eu_opcoes", v)} />
            </div>
            <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "8px", border: "1px solid #e0dbd2" }}>
              <label style={labelStyle}>Negação do Eu:</label>
              <MultiSelectGroup value={formAnamnese.negacao_eu_opcoes} options={negacaoEuOptions} onChange={(v) => handleAnamnese("negacao_eu_opcoes", v)} />
            </div>
          </div>
    
          <SectionTitle>Linguagem e Afetividade</SectionTitle>
          <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "8px", border: "1px solid #e0dbd2" }}>
            <label style={labelStyle}>Distúrbios de Linguagem:</label>
            <MultiSelectGroup value={formAnamnese.linguagem_disturbios} options={linguagemOptions} onChange={(v) => handleAnamnese("linguagem_disturbios", v)} />
          </div>
          <Field label="Afetividade" value={formAnamnese.afetividade} onChange={(v) => handleAnamnese("afetividade", v)} textarea />
    
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="Humor" value={formAnamnese.humor_opcoes} onChange={(v) => handleAnamnese("humor_opcoes", v)} options={humorOptions} />
            <Field label="Consciência da Doença Atual" value={formAnamnese.consciencia_doenca} onChange={(v) => handleAnamnese("consciencia_doenca", v)} options={conscienciaDoencaOptions} />
          </div>
        </div>
      )}
    
      {currentStep === 6 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
          <SectionTitle>Síntese e Conclusão</SectionTitle>
          <Field label="Observação / Linguagem Não Verbal" value={formAnamnese.observacao_linguagem_nao_verbal} onChange={(v) => handleAnamnese("observacao_linguagem_nao_verbal", v)} textarea />
          <Field label="Observações Finais e Conduta" value={formAnamnese.observacoes_finais} onChange={(v) => handleAnamnese("observacoes_finais", v)} textarea />
          {blocoVisibilidade}
        </div>
      )}
    </>
  );
}
