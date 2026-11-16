// Geração do HTML de impressão dos prontuários.
//
// O documento é aberto como Blob (sem `document.write` em janela `about:blank`),
// todo valor interpolado passa por `escapeHtml` e a CSP do documento só admite o
// script de impressão fixo.

import type {
  FormAcupuntura,
  FormAnamnese,
  FormCrianca,
  FormFisioterapia,
  ModalType,
  Morador,
} from "./types/prontuario";

export const PDF_SECTIONS: Record<ModalType, Array<{ key: string; label: string }>> = {
  anamnese_adulto: [
    { key: "identificacao",    label: "Identificação e Atendimento" },
    { key: "queixa",           label: "Queixa e Demanda Atual" },
    { key: "saude_habitos",    label: "Histórico de Saúde e Hábitos" },
    { key: "historico_pessoal",label: "Histórico Pessoal e Familiar" },
    { key: "apresentacao",     label: "Exame Psíquico – Apresentação" },
    { key: "orientacao",       label: "Orientação" },
    { key: "atencao",          label: "Atenção e Funções Cognitivas" },
    { key: "pensamento",       label: "Pensamento e Conteúdo" },
    { key: "linguagem",        label: "Linguagem e Afetividade" },
    { key: "sintese",          label: "Síntese e Conclusão" },
  ],
  anamnese_crianca: [
    { key: "dados_pessoais",     label: "Dados Pessoais e Responsável" },
    { key: "informante",         label: "Informante e Disponibilidade" },
    { key: "queixa",             label: "Queixa" },
    { key: "familia",            label: "Família e Moradia" },
    { key: "gestacao",           label: "Gestação" },
    { key: "parto",              label: "Parto e Nascimento" },
    { key: "marcos",             label: "Marcos do Desenvolvimento" },
    { key: "saude",              label: "Histórico de Saúde" },
    { key: "socializacao",       label: "Socialização" },
    { key: "autonomia",          label: "Autonomia" },
    { key: "sono_alim",          label: "Sono e Alimentação" },
    { key: "narrativas",         label: "Habilidades Narrativas" },
    { key: "orientacao_escolar", label: "Orientação e Vida Escolar" },
    { key: "parental",           label: "Estilo Parental" },
    { key: "genetico",           label: "Histórico Genético Familiar" },
    { key: "temperamento",       label: "Temperamento" },
  ],
  fisioterapia: [
    { key: "identificacao", label: "Identificação" },
    { key: "historico",     label: "Histórico Clínico" },
    { key: "sinais",        label: "Sinais Vitais" },
    { key: "exame",         label: "Exame Físico" },
    { key: "dor",           label: "Avaliação de Dor e Diagnóstico" },
    { key: "tratamento",    label: "Plano de Tratamento" },
    { key: "assinatura",    label: "Assinatura" },
  ],
  acupuntura: [
    { key: "dados",        label: "Dados do Paciente" },
    { key: "anamnese_acu", label: "Anamnese" },
    { key: "atendimento",  label: "Atendimento" },
  ],
};

const ENTIDADES_HTML: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
};

/**
 * Escapa um valor para uso em conteúdo ou atributo HTML.
 * Todo dado vindo do usuário (nomes, rótulos, textos clínicos) deve passar por aqui
 * antes de entrar no documento de impressão.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"'`]/g, (ch) => ENTIDADES_HTML[ch]);
}

/** Mantém apenas caracteres seguros para uso em seletores/atributos gerados. */
function chaveSegura(value: string): string {
  return value.replace(/[^a-z0-9_]/gi, "");
}

function pdfFieldKey(label: string): string {
  return label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function pdfCampo(label: string, value: string | boolean | undefined, full = false): string {
  if (value === undefined || value === null || value === "") return "";
  const v = typeof value === "boolean" ? (value ? "Sim" : "Não") : String(value);
  if (!v.trim()) return "";
  const fk = pdfFieldKey(label);
  return `<div class="field${full ? " full" : ""}" data-field="${fk}"><label>${escapeHtml(label)}</label><div class="value">${escapeHtml(v).replace(/\n/g, "<br>")}</div></div>`;
}

function pdfSecao(titulo: string, conteudo: string, key = ""): string {
  if (!conteudo.replace(/<[^>]*>/g, "").trim()) return "";
  const attr = key ? ` data-key="${chaveSegura(key)}"` : "";
  return `<div class="section"${attr}><h2>${escapeHtml(titulo)}</h2><div class="grid">${conteudo}</div></div>`;
}

function pdfBadges(value: string): string {
  if (!value) return "";
  return value.split(" | ").filter(Boolean).map(v => `<span class="badge">${escapeHtml(v.trim())}</span>`).join("");
}

function pdfChk(label: string, value: boolean | string): string {
  return `<span class="chk">${(value === true || value === "Sim") ? "&#9745;" : "&#9744;"} ${escapeHtml(label)}</span>`;
}

/**
 * A seleção de seções/campos do seletor de impressão vira CSS estático,
 * assim o documento não precisa de script para filtrar o conteúdo.
 */
function pdfSelecaoCss(selectedKeys?: string[], selectedFields?: Record<string, string[]>): string {
  if (!selectedKeys) return "";
  const regras: string[] = [];
  const chaves = selectedKeys.map(chaveSegura);
  regras.push(`[data-key]${chaves.map((k) => `:not([data-key="${k}"])`).join("")} { display:none; }`);
  if (selectedFields) {
    for (const sk of chaves) {
      const campos = selectedFields[sk];
      if (!campos) continue;
      const exceto = campos.map((c) => `:not([data-field="${chaveSegura(c)}"])`).join("");
      regras.push(`[data-key="${sk}"] [data-field]${exceto} { display:none; }`);
    }
  }
  return regras.join("\n  ");
}

// Hash (sha256) do único script do documento, usado na CSP: qualquer outro script
// ou handler inline injetado é bloqueado pelo navegador.
const SCRIPT_IMPRESSAO = "window.onload=function(){window.print();};";
const SCRIPT_IMPRESSAO_HASH = "sha256-XmrhVstiuRdY8Yx8a8hW7NU3yTdvPbLYooDearxLgWc=";

function pdfBase(titulo: string, subtitulo: string, body: string, selectedKeys?: string[], selectedFields?: Record<string, string[]>): string {
  return `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src '${SCRIPT_IMPRESSAO_HASH}'">
<title>${escapeHtml(titulo)}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,Helvetica,sans-serif; font-size:11px; color:#1a1a1a; padding:18mm 16mm; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #E07A6E; padding-bottom:12px; margin-bottom:20px; }
  .header h1 { font-size:17px; font-weight:700; color:#2B1F14; }
  .header p { font-size:11px; color:#6B5E54; margin-top:3px; }
  .header-right { text-align:right; font-size:10px; color:#9B8E84; line-height:1.6; }
  h2 { font-size:10px; font-weight:700; color:#E07A6E; border-bottom:1px solid #e8e0d8; padding-bottom:3px; margin:16px 0 10px; text-transform:uppercase; letter-spacing:.5px; page-break-after:avoid; break-after:avoid; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 20px; }
  .field { page-break-inside:avoid; break-inside:avoid; }
  .field label { font-size:9px; font-weight:700; color:#9B8E84; text-transform:uppercase; letter-spacing:.3px; display:block; margin-bottom:2px; }
  .field .value { font-size:11px; color:#2B1F14; border-bottom:.5px solid #e0dbd2; padding:2px 0 4px; min-height:18px; line-height:1.5; }
  .field.full { grid-column:1/-1; page-break-inside:avoid; break-inside:avoid; }
  .badge { display:inline-block; background:#f0ece4; color:#6B5E54; padding:2px 7px; border-radius:4px; font-size:10px; margin:2px 2px 2px 0; font-weight:600; }
  .chk-group { display:flex; flex-wrap:wrap; gap:10px; padding:4px 0; page-break-inside:avoid; break-inside:avoid; }
  .chk { font-size:11px; color:#2B1F14; }
  .footer { border-top:1px solid #e0dbd2; margin-top:28px; padding-top:12px; display:flex; justify-content:space-between; font-size:10px; color:#9B8E84; page-break-inside:avoid; break-inside:avoid; }
  @media print { body { padding:0; } @page { margin:15mm 12mm; size:A4; } }
  ${pdfSelecaoCss(selectedKeys, selectedFields)}
</style>
</head><body>
<div class="header">
  <div><h1>${escapeHtml(titulo)}</h1><p>${escapeHtml(subtitulo)}</p></div>
  <div class="header-right">Data: ${new Date().toLocaleDateString("pt-BR")}<br>Sistema Nave</div>
</div>
${body}
<div class="footer">
  <span>Emitido em ${new Date().toLocaleString("pt-BR")}</span>
  <span>Sistema Nave &mdash; Prontuário Eletrônico</span>
</div>
<script>${SCRIPT_IMPRESSAO}</script>
</body></html>`;
}

export function gerarHtmlAnamnese(f: FormAnamnese, nome: string, profissional: string, selectedKeys?: string[], selectedFields?: Record<string, string[]>): string {
  const body = [
    pdfSecao("Identificação e Atendimento", [
      pdfCampo("Data do Atendimento", f.data_atendimento),
      pdfCampo("Psicólogo / Estagiário", profissional || f.psicologo_estagiario),
      pdfCampo("Nome", f.nome, true),
      pdfCampo("Data de Nascimento", f.data_nascimento),
      pdfCampo("Idade", f.idade),
      pdfCampo("Sexo", f.sexo),
      pdfCampo("Nacionalidade", f.nacionalidade),
      pdfCampo("Estado Civil", f.civil),
      pdfCampo("Telefone", f.telefone),
      pdfCampo("Residência", f.residencia, true),
      pdfCampo("Escolaridade", f.escolaridade),
      pdfCampo("Ocupação Atual", f.ocupacao),
      pdfCampo("Profissão (Formação)", f.profissao),
      pdfCampo("Situação Empregatícia", f.desempregado),
      f.desempregado === "Sim" ? pdfCampo("Tempo Desemprego", f.tempo_desemprego) : "",
      pdfCampo("Hobbies e Lazer", f.hobbies),
    ].join(""), "identificacao"),
    pdfSecao("Queixa e Demanda Atual", [
      pdfCampo("Queixa Principal", f.queixa_principal, true),
      pdfCampo("Queixa Secundária", f.queixa_secundaria, true),
      pdfCampo("Sintomas", f.sintomas, true),
      pdfCampo("Expectativas e Objetivos", f.expectativas_objetivos, true),
      pdfCampo("Psicoterapia Anterior", f.psicoterapia_anterior, true),
    ].join(""), "queixa"),
    pdfSecao("Histórico de Saúde e Hábitos", [
      pdfCampo("Doenças / Transtornos Psiquiátricos", f.doencas_transtornos, true),
      pdfCampo("Patologia Pregressa", f.patologia_pregressa, true),
      pdfCampo("Uso de Medicamentos", f.medicamentos, true),
      pdfCampo("Uso de Drogas / Substâncias", f.uso_drogas, true),
      pdfCampo("Ideação Suicida", f.ideacao_suicida, true),
    ].join(""), "saude_habitos"),
    pdfSecao("Histórico Pessoal e Familiar", [
      pdfCampo("Infância", f.historico_infancia),
      pdfCampo("Adolescência", f.adolescencia),
      pdfCampo("Rotina Diária", f.rotina, true),
      pdfCampo("Dinâmica de Trabalho", f.trabalho, true),
      pdfCampo("Vícios / Hábitos", f.vicios),
      pdfCampo("Composição do Lar", f.lar),
      pdfCampo("Pais / Cuidadores", f.pais_cuidadores),
      pdfCampo("Irmãos", f.irmaos),
      pdfCampo("Cônjuge", f.conjuge),
      pdfCampo("Filhos", f.filhos),
      pdfCampo("Relacionamentos Atuais", f.relacionamentos_atuais, true),
    ].join(""), "historico_pessoal"),
    pdfSecao("Exame Psíquico — Apresentação", [
      pdfCampo("Aparência", f.aparencia, true),
      pdfCampo("Comportamento", f.comportamento, true),
      pdfCampo("Atitude com o Entrevistador", f.atitude_entrevistador),
      pdfCampo("Sensopercepção", f.sensopercpcao),
    ].join(""), "apresentacao"),
    `<div class="section" data-key="orientacao"><h2>Orientação</h2><div class="grid">
      <div class="field full" data-field="orientacao_grupo"><label>O paciente encontra-se orientado de forma:</label>
        <div class="chk-group">
          ${pdfChk("Autoidentificatória", f.orientacao_autoidentificatoria)}
          ${pdfChk("Corporal", f.orientacao_corporal)}
          ${pdfChk("Temporal", f.orientacao_temporal)}
          ${pdfChk("Espacial", f.orientacao_espacial)}
          ${pdfChk("Em relação à patologia", f.orientacao_patologia)}
        </div>
      </div>
      ${pdfCampo("Observações sobre Orientação", f.orientacao_observacoes, true)}
    </div></div>`,
    pdfSecao("Atenção e Funções Cognitivas", [
      pdfCampo("Atenção — Vigilância", f.atencao_vigilancia),
      pdfCampo("Atenção — Tenacidade", f.atencao_tenacidade),
      pdfCampo("Memória", f.memoria),
      pdfCampo("Inteligência", f.inteligencia),
    ].join(""), "atencao"),
    `<div class="section" data-key="pensamento"><h2>Pensamento e Conteúdo</h2><div class="grid">
      <div class="field" data-field="curso_pensamento"><label>Curso do Pensamento</label>
        <div class="chk-group">
          ${pdfChk("Acelerado", f.pensamento_acelerado)}
          ${pdfChk("Retardado", f.pensamento_retardado)}
          ${pdfChk("Fuga de Ideias", f.pensamento_fuga)}
          ${pdfChk("Bloqueio", f.pensamento_bloqueio)}
          ${pdfChk("Prolixo", f.pensamento_prolixo)}
          ${pdfChk("Repetição", f.pensamento_repeticao)}
        </div>
      </div>
      <div class="field" data-field="conteudo_predominante"><label>Conteúdo Predominante</label>
        <div class="chk-group">
          ${pdfChk("Obsessões", f.conteudo_obsessoes)}
          ${pdfChk("Hipocondrias", f.conteudo_hipocondrias)}
          ${pdfChk("Fobias", f.conteudo_fobias)}
          ${pdfChk("Delírios", f.conteudo_delirios)}
        </div>
      </div>
      ${f.expansao_eu_opcoes ? `<div class="field" data-field="expansao_eu"><label>Expansão do Eu</label><div class="value">${pdfBadges(f.expansao_eu_opcoes)}</div></div>` : ""}
      ${f.retracao_eu_opcoes ? `<div class="field" data-field="retracao_eu"><label>Retração do Eu</label><div class="value">${pdfBadges(f.retracao_eu_opcoes)}</div></div>` : ""}
      ${f.negacao_eu_opcoes ? `<div class="field full" data-field="negacao_eu"><label>Negação do Eu</label><div class="value">${pdfBadges(f.negacao_eu_opcoes)}</div></div>` : ""}
    </div></div>`,
    pdfSecao("Linguagem e Afetividade", [
      f.linguagem_disturbios ? `<div class="field full"><label>Distúrbios de Linguagem</label><div class="value">${pdfBadges(f.linguagem_disturbios)}</div></div>` : "",
      pdfCampo("Afetividade", f.afetividade, true),
      pdfCampo("Humor", f.humor_opcoes),
      pdfCampo("Consciência da Doença", f.consciencia_doenca),
    ].join(""), "linguagem"),
    pdfSecao("Síntese e Conclusão", [
      pdfCampo("Observação / Linguagem Não Verbal", f.observacao_linguagem_nao_verbal, true),
      pdfCampo("Observações Finais e Conduta", f.observacoes_finais, true),
    ].join(""), "sintese"),
  ].join("");
  return pdfBase("Anamnese Psicológica — Adulto", `${nome} | Profissional: ${profissional || f.psicologo_estagiario}`, body, selectedKeys, selectedFields);
}

export function gerarHtmlCrianca(f: FormCrianca, moradores: Morador[], nome: string, selectedKeys?: string[], selectedFields?: Record<string, string[]>): string {
  const moradoresHtml = moradores.length
    ? `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:4px"><thead><tr style="background:#f5f0e8"><th style="padding:4px 8px;text-align:left">Nome</th><th style="padding:4px 8px;text-align:left">Parentesco</th><th style="padding:4px 8px;text-align:left">Idade</th></tr></thead><tbody>${moradores.map(m=>`<tr><td style="padding:3px 8px;border-bottom:.5px solid #e0dbd2">${escapeHtml(m.nome)}</td><td style="padding:3px 8px;border-bottom:.5px solid #e0dbd2">${escapeHtml(m.parentesco)}</td><td style="padding:3px 8px;border-bottom:.5px solid #e0dbd2">${escapeHtml(m.idade)}</td></tr>`).join("")}</tbody></table>`
    : "<em style='color:#9B8E84'>Não informado</em>";

  const body = [
    pdfSecao("Dados Pessoais e Responsável", [
      pdfCampo("Data do Atendimento", f.data_atendimento),
      pdfCampo("Profissional", f.profissional),
      pdfCampo("Nome", f.nome, true),
      pdfCampo("Data de Nascimento", f.data_nascimento),
      pdfCampo("Idade", f.idade),
      pdfCampo("Sexo", f.sexo),
      pdfCampo("Ano Escolar", f.ano_escolar),
      pdfCampo("Religião", f.religiao),
      pdfCampo("Responsável Legal", f.resp_nome, true),
      pdfCampo("Parentesco", f.resp_parentesco),
      pdfCampo("Adoção?", f.resp_adocao),
      pdfCampo("Idade do Responsável", f.resp_idade),
      pdfCampo("Escolaridade do Responsável", f.resp_escolaridade),
      pdfCampo("Profissão do Responsável", f.resp_profissao),
      pdfCampo("CPF / RG", f.resp_cpf_rg),
    ].join(""), "dados_pessoais"),
    pdfSecao("Informante e Disponibilidade", [
      pdfCampo("Parentesco do informante", f.info_parentesco),
      pdfCampo("Endereço", f.info_endereco),
      pdfCampo("Contatos", f.info_contatos),
      pdfCampo("Familiar atendido?", f.info_familiar_atendido),
      `<div class="field full" data-field="horarios_disponiveis"><label>Horários Disponíveis</label><div class="value">
        ${[["Segunda",f.disp_segunda],["Terça",f.disp_terca],["Quarta",f.disp_quarta],["Quinta",f.disp_quinta],["Sexta",f.disp_sexta],["Sábado",f.disp_sabado]].filter(([,v])=>v).map(([d,v])=>`<strong>${d}:</strong> ${escapeHtml(v)}`).join(" &bull; ") || "Não informado"}
      </div></div>`,
    ].join(""), "informante"),
    pdfSecao("Queixa", [
      pdfCampo("Origem da procura", f.queixa_origem, true),
      pdfCampo("Encaminhamento", f.queixa_encaminhamento, true),
      pdfCampo("Paciente sabe do atendimento?", f.queixa_paciente_sabe),
      pdfCampo("Observação", f.queixa_paciente_sabe_obs),
      pdfCampo("Queixa Principal", f.queixa_principal, true),
    ].join(""), "queixa"),
    `<div class="section" data-key="familia"><h2>Família e Moradia</h2><div class="grid">
      <div class="field full" data-field="moradores_residencia"><label>Moradores da residência</label><div class="value">${moradoresHtml}</div></div>
      ${pdfCampo("Renda familiar", f.familia_renda)}
      ${pdfCampo("Possui cuidador/babá?", f.familia_cuidador)}
      ${pdfCampo("Membros que trabalham", f.familia_membros_trabalham)}
      ${pdfCampo("Auxílio governamental?", f.familia_auxilio)}
      ${pdfCampo("Pais são provedores?", f.familia_pais_provedores)}
      ${pdfCampo("Tipo de casa", f.familia_casa_tipo)}
      ${pdfCampo("Valor aluguel/financiamento", f.familia_valor_aluguel)}
      ${pdfCampo("Rua pavimentada?", f.familia_rua_pavimentada)}
      ${pdfCampo("Água encanada e energia?", f.familia_agua_energia)}
      ${pdfCampo("Sensação de segurança no bairro", f.familia_seguranca, true)}
      ${pdfCampo("Dorme na própria cama?", f.familia_cama_propria)}
      ${pdfCampo("Dorme sozinho no quarto?", f.familia_quarto_sozinho)}
      ${pdfCampo("Rotina do paciente", f.familia_rotina_paciente, true)}
      ${pdfCampo("Rotina da família", f.familia_rotina_familia, true)}
      ${pdfCampo("Clima geral da casa", f.familia_clima_casa, true)}
      ${pdfCampo("Eventos importantes na família", f.familia_eventos_importantes, true)}
    </div></div>`,
    pdfSecao("Gestação", [
      pdfCampo("Gestação planejada?", f.gest_planejada),
      pdfCampo("Gestação aceita?", f.gest_aceita),
      pdfCampo("Descoberta com quantas semanas?", f.gest_semanas_descoberta),
      pdfCampo("Realizou pré-natal?", f.gest_pre_natal),
      pdfCampo("Onde realizou o pré-natal?", f.gest_pre_natal_onde),
      pdfCampo("A partir de quantas semanas?", f.gest_pre_natal_semanas),
      pdfCampo("Relação gestante–família", f.gest_relacao_familia, true),
      pdfCampo("Trabalhou na gestação?", f.gest_trabalhou),
      pdfCampo("Cargo", f.gest_trabalhou_cargo),
      pdfCampo("Trabalhou até a semana", f.gest_trabalhou_semana),
      pdfCampo("Hospitalizações?", f.gest_hospitalizacoes),
      pdfCampo("Motivo hospitalizações", f.gest_hospitalizacoes_motivo),
      pdfCampo("Cirurgias?", f.gest_cirurgias),
      pdfCampo("Motivo cirurgias", f.gest_cirurgias_motivo),
      pdfCampo("Medicamentos?", f.gest_medicamentos),
      pdfCampo("Quais medicamentos?", f.gest_medicamentos_quais),
      pdfCampo("Quedas?", f.gest_quedas),
      pdfCampo("Período da queda", f.gest_quedas_periodo),
      pdfCampo("Uso de álcool/cigarro/drogas?", f.gest_drogas),
      pdfCampo("Especificar", f.gest_drogas_especificar),
      pdfCampo("Raio-X na gestação?", f.gest_raio_x),
      pdfCampo("Doenças na mãe?", f.gest_doencas_mae),
      pdfCampo("Quais doenças?", f.gest_doencas_mae_especificar),
    ].join(""), "gestacao"),
    pdfSecao("Parto e Nascimento", [
      pdfCampo("Semanas gestacionais no nascimento", f.gest_semanas_nascimento),
      pdfCampo("Tipo de parto", f.gest_tipo_parto),
      pdfCampo("Parto induzido ou natural?", f.gest_parto_induzido),
      pdfCampo("Uso de fórceps?", f.gest_forceps),
      pdfCampo("Local de nascimento", f.gest_local_nascimento),
      pdfCampo("Tempo bolsa → nascimento", f.gest_tempo_bolsa),
      pdfCampo("Bebê nasceu roxinho?", f.gest_bebe_roxo),
      pdfCampo("Chorou ao nascer?", f.gest_chorou_nascer),
      pdfCampo("Precisou de cuidados intensivos?", f.gest_cuidados_intensivos),
      pdfCampo("Tempo em cuidados intensivos", f.gest_cuidados_intensivos_tempo),
      pdfCampo("Respirou sozinho?", f.gest_respirou_sozinho),
    ].join(""), "parto"),
    pdfSecao("Marcos do Desenvolvimento", [
      pdfCampo("Primeiros balbucios", f.marcos_balbucios),
      pdfCampo("Primeiras palavras", f.marcos_palavras),
      pdfCampo("Primeiras frases completas", f.marcos_frases),
      pdfCampo("Firmou a cabeça", f.marcos_firmou_cabeca),
      pdfCampo("Sentou sozinho", f.marcos_sentou),
      pdfCampo("Primeiros passos (com apoio)", f.marcos_passos_apoio),
      pdfCampo("Caminhou sem apoio", f.marcos_caminhou),
      pdfCampo("Sorriu para pessoas", f.marcos_sorriu),
      pdfCampo("Seguiu o olhar de adultos", f.marcos_seguiu_olhar),
      pdfCampo("Iniciou apontar objetos", f.marcos_apontou),
      pdfCampo("Cessou fralda — dia", f.marcos_fralda_dia),
      pdfCampo("Cessou fralda — noite", f.marcos_fralda_noite),
      pdfCampo("Acompanhou curva de crescimento?", f.dev1_curva),
      pdfCampo("Chorava muito?", f.dev1_chorava),
      pdfCampo("Dormia muito?", f.dev1_dormia_muito),
      pdfCampo("Dormia pouco?", f.dev1_dormia_pouco),
      pdfCampo("Muitas cólicas?", f.dev1_colicas),
      pdfCampo("Vacinação completa?", f.dev1_vacinacao),
      pdfCampo("Ambiente familiar nos primeiros anos", f.dev1_ambiente, true),
    ].join(""), "marcos"),
    pdfSecao("Histórico de Saúde", [
      pdfCampo("Internações?", f.saude_internacoes),
      pdfCampo("Detalhes internações", f.saude_internacoes_detalhes),
      pdfCampo("Medicação atual?", f.saude_med_atual),
      pdfCampo("Quais medicações atuais?", f.saude_med_atual_detalhes),
      pdfCampo("Medicação passada?", f.saude_med_passada),
      pdfCampo("Quais medicações passadas?", f.saude_med_passada_detalhes),
      pdfCampo("Problemas auditivos?", f.saude_auditivo),
      pdfCampo("Auditivo corrigido?", f.saude_auditivo_corrigido),
      pdfCampo("Problemas visuais?", f.saude_visual),
      pdfCampo("Visual corrigido?", f.saude_visual_corrigido),
      pdfCampo("Desmaios?", f.saude_desmaios),
      pdfCampo("Detalhes desmaios", f.saude_desmaios_detalhes),
      pdfCampo("Convulsões?", f.saude_convulsoes),
      pdfCampo("Detalhes convulsões", f.saude_convulsoes_detalhes),
      [["Meningite",f.saude_meningite],["Encefalite",f.saude_encefalite],["Sarampo",f.saude_sarampo],["Rubéola",f.saude_rubeola],["Caxumba",f.saude_caxumba],["Coqueluche",f.saude_coqueluche],["Pneumonia",f.saude_pneumonia]].filter(([,v])=>v==="Sim").length
        ? `<div class="field full" data-field="historico_doencas"><label>Histórico de doenças</label><div class="value">${[["Meningite",f.saude_meningite],["Encefalite",f.saude_encefalite],["Sarampo",f.saude_sarampo],["Rubéola",f.saude_rubeola],["Caxumba",f.saude_caxumba],["Coqueluche",f.saude_coqueluche],["Pneumonia",f.saude_pneumonia]].filter(([,v])=>v==="Sim").map(([d])=>`<span class="badge">${d}</span>`).join("")}</div></div>`
        : "",
      pdfCampo("Alergias?", f.saude_alergias),
      pdfCampo("Quais alergias?", f.saude_alergias_quais),
      pdfCampo("Outras doenças?", f.saude_outras_doencas),
      pdfCampo("Quais outras doenças?", f.saude_outras_doencas_quais),
      pdfCampo("Acompanhamento profissional?", f.saude_acompanhamento),
      pdfCampo("Detalhes acompanhamento", f.saude_acompanhamento_detalhes, true),
      pdfCampo("Dores físicas?", f.saude_dores),
      pdfCampo("Quais dores?", f.saude_dores_quais),
      pdfCampo("Frequência das dores", f.saude_dores_frequencia),
      pdfCampo("Diagnósticos prévios?", f.saude_diagnosticos),
      pdfCampo("Quais diagnósticos?", f.saude_diagnosticos_quais, true),
    ].join(""), "saude"),
    pdfSecao("Socialização", [
      pdfCampo("Tem amigos?", f.social_tem_amigos),
      pdfCampo("Tem melhor amigo(a)?", f.social_melhor_amigo),
      pdfCampo("Preferência de interação por idade", f.social_preferencia_idade),
      pdfCampo("Histórico de bullying?", f.social_bullying),
      pdfCampo("Busca interação em ambientes novos?", f.social_busca_interacao, true),
      pdfCampo("Adapta-se a brincadeiras?", f.social_adapta_brincadeiras),
      pdfCampo("Mantém conversas em grupos?", f.social_conversa_grupos),
      pdfCampo("Relação com o pai", f.social_relacao_pai, true),
      pdfCampo("Relação com a mãe", f.social_relacao_mae, true),
      pdfCampo("Relação com irmãos", f.social_relacao_irmaos, true),
      pdfCampo("Relação com professor(a)", f.social_relacao_professor, true),
      pdfCampo("Reage à negação de desejos", f.social_reage_negacao, true),
      pdfCampo("Frequenta / recebe amigos?", f.social_frequenta_amigos),
      pdfCampo("Familiar próximo", f.social_familiar_proximo, true),
      pdfCampo("Interesses", f.social_interesses, true),
      pdfCampo("Interesse específico / dificuldade de mudar foco?", f.social_interesse_especifico, true),
      pdfCampo("Lida com mudanças na rotina", f.social_lida_rotina, true),
      pdfCampo("Interesses adequados à faixa etária?", f.social_interesses_faixa_etaria),
    ].join(""), "socializacao"),
    pdfSecao("Autonomia", [
      pdfCampo("Maneja dinheiro?", f.auto_dinheiro, true),
      pdfCampo("Higiene pessoal sozinho?", f.auto_higiene, true),
      pdfCampo("Refeições simples sozinho?", f.auto_refeicoes),
      pdfCampo("Olha as horas?", f.auto_horas),
      pdfCampo("Gerencia o próprio tempo?", f.auto_tempo),
      pdfCampo("Veste-se sozinho?", f.auto_vestir),
      pdfCampo("Escolhe roupas sozinho?", f.auto_escolher_roupas),
      pdfCampo("Escala de dependência (0–3)", f.auto_escala),
    ].join(""), "autonomia"),
    pdfSecao("Sono e Alimentação", [
      pdfCampo("Dificuldade para pegar no sono?", f.sono_pegar),
      pdfCampo("Dificuldade ao despertar?", f.sono_despertar),
      pdfCampo("Movimenta muito dormindo?", f.sono_movimenta),
      pdfCampo("Pesadelos?", f.sono_pesadelos),
      pdfCampo("Ronca?", f.sono_ronca),
      pdfCampo("Ronca desde quando?", f.sono_ronca_desde),
      pdfCampo("Frequência do ronco", f.sono_ronca_freq),
      pdfCampo("Enurese?", f.sono_enurese),
      pdfCampo("Enurese desde quando?", f.sono_enurese_desde),
      pdfCampo("Frequência enurese", f.sono_enurese_freq),
      pdfCampo("Tempo médio de sono", f.sono_tempo),
      pdfCampo("Rotina de sono?", f.sono_rotina),
      pdfCampo("Horário de dormir", f.sono_rotina_horario),
      pdfCampo("Amamentou no peito?", f.alim_amamentou),
      pdfCampo("Amamentou até qual idade?", f.alim_amamentou_idade),
      pdfCampo("Peso compatível?", f.alim_peso),
      pdfCampo("Restrição alérgica?", f.alim_restricao),
      pdfCampo("Resistência a alimentos?", f.alim_resistencia),
      pdfCampo("Tem muita fome?", f.alim_muita_fome),
      pdfCampo("Tinha muita fome nos primeiros anos?", f.alim_muita_fome_primeiros),
      pdfCampo("Padrão alimentar", f.alim_padrao, true),
    ].join(""), "sono_alim"),
    pdfSecao("Habilidades Narrativas", [
      pdfCampo("Interesse por histórias?", f.narr_historias),
      pdfCampo("Reconta histórias de forma coesa?", f.narr_recontar),
      pdfCampo("Entende humor / piadas?", f.narr_humor),
      pdfCampo("Reconta piadas?", f.narr_piadas),
      pdfCampo("Explica situações da escola?", f.narr_escola),
      pdfCampo("Repassa recados?", f.narr_recados),
    ].join(""), "narrativas"),
    pdfSecao("Orientação Tempo/Espaço e Vida Escolar", [
      `<div class="field full" data-field="conceitos_orientacao"><label>Conceitos que a criança compreende</label><div class="value chk-group">
        ${pdfChk("Direita/Esquerda", f.ori_direita_esquerda)}
        ${pdfChk("Cima/Baixo", f.ori_cima_baixo)}
        ${pdfChk("Atrás/Frente", f.ori_atras_frente)}
        ${pdfChk("Ontem/Hoje/Amanhã", f.ori_ontem_hoje_amanha)}
        ${pdfChk("Manhã/Tarde/Noite", f.ori_manha_tarde_noite)}
        ${pdfChk("Dias da semana", f.ori_dias_semana)}
        ${pdfChk("Calendário", f.ori_calendario)}
        ${pdfChk("Data do aniversário", f.ori_aniversario)}
        ${pdfChk("Ambientes novos", f.ori_ambientes_novos)}
        ${pdfChk("Locomove-se em casa", f.ori_propria_casa)}
        ${pdfChk("Locomove-se na escola", f.ori_escola)}
      </div></div>`,
      pdfCampo("Iniciou escola com qual idade?", f.esc_idade_inicio),
      pdfCampo("É alfabetizado?", f.esc_alfabetizado),
      pdfCampo("Reconhece letras?", f.esc_letras),
      pdfCampo("Reconhece números?", f.esc_numeros),
      pdfCampo("Reconhece cores?", f.esc_cores),
      pdfCampo("Histórico de reprovação?", f.esc_reprovacao),
      pdfCampo("Detalhes reprovação", f.esc_reprovacao_detalhes),
      pdfCampo("Dificuldades generalizadas?", f.esc_dificuldades_gerais),
      pdfCampo("Dificuldade em disciplina específica?", f.esc_dificuldades_especifica),
      pdfCampo("Qual disciplina?", f.esc_dificuldades_quais),
      pdfCampo("Queixas de comportamento escolar", f.esc_queixas_comportamento, true),
      pdfCampo("Rotina de estudo?", f.esc_rotina_estudo),
      pdfCampo("Horário do dever", f.esc_horario_dever),
      pdfCampo("Ambiente de estudo", f.esc_ambiente_estudo, true),
      pdfCampo("Suporte nas tarefas escolares", f.esc_suporte_tarefas, true),
    ].join(""), "orientacao_escolar"),
    pdfSecao("Estilo Parental", [
      pdfCampo("Castigos físicos?", f.par_castigos_fisicos, true),
      pdfCampo("Xingamentos / ameaças?", f.par_xingamentos, true),
      pdfCampo("Conversas sobre comportamento?", f.par_conversas, true),
      pdfCampo("Negociações?", f.par_negociacoes, true),
      pdfCampo("Elogios?", f.par_elogios, true),
      pdfCampo("Troca de carinhos físicos?", f.par_carinhos, true),
    ].join(""), "parental"),
    pdfSecao("Histórico Genético Familiar", [
      pdfCampo("Familiar com dificuldades escolares?", f.gen_dificuldades_escola, true),
      pdfCampo("Familiar com diagnóstico psiquiátrico?", f.gen_diagnostico_psiquiatrico, true),
      pdfCampo("Familiar com síndrome genética?", f.gen_sindrome, true),
      pdfCampo("Familiar com medicações controladas?", f.gen_medicacoes_controladas, true),
      pdfCampo("Tentativa de suicídio na família?", f.gen_tentativa_suicidio),
      pdfCampo("Parentesco (tentativa)", f.gen_tentativa_suicidio_parentesco),
      pdfCampo("Morte por suicídio na família?", f.gen_morte_suicidio),
    ].join(""), "genetico"),
    pdfSecao("Temperamento", [
      pdfCampo("Descrição do funcionamento da criança", f.temp_descricao, true),
      pdfCampo("Maiores dificuldades na interação", f.temp_dificuldades, true),
    ].join(""), "temperamento"),
  ].join("");
  return pdfBase("Anamnese Psicológica — Criança", `${nome} | Profissional: ${f.profissional}`, body, selectedKeys, selectedFields);
}

export function gerarHtmlFisio(f: FormFisioterapia, nome: string, selectedKeys?: string[], selectedFields?: Record<string, string[]>): string {
  const body = [
    pdfSecao("Identificação", [
      pdfCampo("Nome", f.nome, true),
      pdfCampo("Idade", f.idade),
      pdfCampo("Sexo", f.sexo),
      pdfCampo("Ocupação", f.ocupacao),
      pdfCampo("CPF", f.cpf),
      pdfCampo("RG", f.rg),
      pdfCampo("Contato", f.contato),
    ].join(""), "identificacao"),
    pdfSecao("Histórico Clínico", [
      pdfCampo("Caso Clínico", f.caso_clinico, true),
      pdfCampo("Histórico Médico", f.historico_medico, true),
      pdfCampo("Usa Medicamento?", f.usa_medicamento),
      pdfCampo("Quais Medicamentos?", f.medicamentos_lista),
    ].join(""), "historico"),
    pdfSecao("Sinais Vitais", [
      pdfCampo("FC (bpm)", f.sv_fc),
      pdfCampo("FR (rpm)", f.sv_fr),
      pdfCampo("PA (mmHg)", f.sv_pa),
    ].join(""), "sinais"),
    pdfSecao("Exame Físico", [
      pdfCampo("Apresentação do Paciente", f.apresentacao_paciente, true),
      pdfCampo("Inspeção / Palpação", f.inspecao_palpacao, true),
      pdfCampo("Exames Complementares?", f.exames_complementares),
      pdfCampo("Observações (exames)", f.exames_complementares_obs),
      pdfCampo("Prótese / Órtese?", f.protese_ortese),
      pdfCampo("Qual prótese/órtese?", f.protese_ortese_obs),
      pdfCampo("Limitação de Movimento?", f.limitacao_movimento),
      pdfCampo("Qual limitação?", f.limitacao_movimento_obs),
      pdfCampo("Equilíbrio / Coordenação", f.equilibrio_coordenacao, true),
    ].join(""), "exame"),
    pdfSecao("Avaliação de Dor e Diagnóstico", [
      `<div class="field full" data-field="intensidade_dor"><label>Intensidade da Dor (0–10)</label><div class="value">
        <span style="font-size:24px;font-weight:700;color:${parseInt(f.dor_intensidade)<=3?"#3D7845":parseInt(f.dor_intensidade)<=7?"#eab308":"#ef4444"}">${escapeHtml(f.dor_intensidade || "0")}</span>
        <span style="font-size:11px;color:#9B8E84;margin-left:8px">${parseInt(f.dor_intensidade)<=3?"Leve":parseInt(f.dor_intensidade)<=7?"Moderada":"Intensa"}</span>
      </div></div>`,
      pdfCampo("Queixa Principal", f.queixa_principal, true),
      pdfCampo("História Clínica", f.historia_clinica, true),
      pdfCampo("Demais Observações", f.demais_observacoes, true),
    ].join(""), "dor"),
    pdfSecao("Plano de Tratamento", [
      pdfCampo("Objetivo do Tratamento", f.objetivo_tratamento, true),
      pdfCampo("Recursos Terapêuticos", f.recursos_terapeuticos, true),
      pdfCampo("Anotações Gerais", f.anotacoes_gerais, true),
    ].join(""), "tratamento"),
    pdfSecao("Assinatura", [
      pdfCampo("Data", f.data_assinatura),
      pdfCampo("Profissional", f.assinatura),
    ].join(""), "assinatura"),
  ].join("");
  return pdfBase("Ficha de Fisioterapia", `${nome}`, body, selectedKeys, selectedFields);
}

export function gerarHtmlAcupuntura(f: FormAcupuntura, nome: string, profissional: string, selectedKeys?: string[], selectedFields?: Record<string, string[]>): string {
  const body = [
    pdfSecao("Dados do Paciente", [
      pdfCampo("Nome", f.nome, true),
      pdfCampo("Endereço", f.endereco, true),
      pdfCampo("Idade", f.idade),
      pdfCampo("Data de Nascimento", f.data_nascimento),
      pdfCampo("Telefone", f.telefone),
      pdfCampo("Profissão", f.profissao),
      pdfCampo("Estado Civil", f.estado_civil),
      pdfCampo("Filho(s)", f.filho),
      pdfCampo("Pacote", f.pacote),
      pdfCampo("Data da Consulta", f.data_consulta),
    ].join(""), "dados"),
    pdfSecao("Anamnese", [
      pdfCampo("História / Queixa Principal", f.historia, true),
      pdfCampo("IG", f.ig),
      pdfCampo("Sono", f.sono),
      pdfCampo("Alimentação", f.alimentacao),
      pdfCampo("Língua", f.lingua),
    ].join(""), "anamnese_acu"),
    pdfSecao("Atendimento", [
      pdfCampo("Técnicas Utilizadas", f.tecnicas_utilizadas, true),
      pdfCampo("Profissional", profissional),
    ].join(""), "atendimento"),
  ].join("");
  return pdfBase("Ficha de Acupuntura", `${nome}`, body, selectedKeys, selectedFields);
}

export interface DadosProntuarioPdf {
  anamneseAdulto: FormAnamnese;
  anamneseCrianca: FormCrianca;
  moradores: Morador[];
  fisioterapia: FormFisioterapia;
  acupuntura: FormAcupuntura;
}

/** Monta o HTML de impressão do prontuário do tipo informado. */
export function gerarHtmlProntuario(
  tipo: ModalType,
  dados: DadosProntuarioPdf,
  nome: string,
  profissional: string,
  selectedKeys?: string[],
  selectedFields?: Record<string, string[]>,
): string {
  switch (tipo) {
    case "anamnese_adulto":
      return gerarHtmlAnamnese(dados.anamneseAdulto, nome, profissional, selectedKeys, selectedFields);
    case "anamnese_crianca":
      return gerarHtmlCrianca(dados.anamneseCrianca, dados.moradores, nome, selectedKeys, selectedFields);
    case "fisioterapia":
      return gerarHtmlFisio(dados.fisioterapia, nome, selectedKeys, selectedFields);
    case "acupuntura":
      return gerarHtmlAcupuntura(dados.acupuntura, nome, profissional, selectedKeys, selectedFields);
  }
}

/**
 * Abre o documento de impressão em uma nova janela a partir de um Blob.
 * `noopener` impede que a janela acesse a aplicação; a CSP do documento bloqueia
 * qualquer script além do que dispara a impressão.
 */
export function abrirImpressao(html: string): void {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  window.open(url, "_blank", "noopener,noreferrer,width=900,height=700");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
