// Formulários de prontuário (compartilhados entre a página e a geração de PDF).

export interface FormAnamnese {
  data_atendimento: string;
  psicologo_estagiario: string;
  nome: string; idade: string; sexo: string; nacionalidade: string;
  civil: string; data_nascimento: string; estado: string; escolaridade: string;
  profissao: string; desempregado: string; tempo_desemprego: string;
  residencia: string; telefone: string; ocupacao: string; hobbies: string;
  queixa_principal: string; queixa_secundaria: string; sintomas: string;
  psicoterapia_anterior: string; expectativas_objetivos: string;
  historico_infancia: string; rotina: string; vicios: string; trabalho: string;
  doencas_transtornos: string; medicamentos: string; uso_drogas: string; ideacao_suicida: string;
  pais_cuidadores: string; irmaos: string; conjuge: string; filhos: string; lar: string;
  patologia_pregressa: string; adolescencia: string; relacionamentos_atuais: string;
  aparencia: string; comportamento: string; atitude_entrevistador: string;
  orientacao_autoidentificatoria: boolean; orientacao_corporal: boolean;
  orientacao_temporal: boolean; orientacao_espacial: boolean; orientacao_patologia: boolean;
  orientacao_observacoes: string; atencao_vigilancia: string; atencao_tenacidade: string;
  memoria: string; inteligencia: string; sensopercpcao: string;
  pensamento_acelerado: boolean; pensamento_retardado: boolean; pensamento_fuga: boolean;
  pensamento_bloqueio: boolean; pensamento_prolixo: boolean; pensamento_repeticao: boolean;
  conteudo_obsessoes: boolean; conteudo_hipocondrias: boolean;
  conteudo_fobias: boolean; conteudo_delirios: boolean;
  expansao_eu_opcoes: string; retracao_eu_opcoes: string; negacao_eu_opcoes: string;
  linguagem_disturbios: string; afetividade: string; humor_opcoes: string;
  consciencia_doenca: string; observacao_linguagem_nao_verbal: string; observacoes_finais: string;
}

export interface FormCrianca {
  data_atendimento: string; profissional: string;
  nome: string; data_nascimento: string; idade: string; sexo: string; ano_escolar: string; religiao: string;
  resp_nome: string; resp_parentesco: string; resp_adocao: string; resp_idade: string;
  resp_escolaridade: string; resp_profissao: string; resp_cpf_rg: string;
  info_parentesco: string; info_endereco: string; info_contatos: string; info_familiar_atendido: string;
  disp_segunda: string; disp_terca: string; disp_quarta: string; disp_quinta: string; disp_sexta: string; disp_sabado: string;
  queixa_origem: string; queixa_encaminhamento: string; queixa_paciente_sabe: string; queixa_paciente_sabe_obs: string; queixa_principal: string;
  familia_moradores: string; familia_renda: string; familia_cuidador: string; familia_membros_trabalham: string;
  familia_auxilio: string; familia_pais_provedores: string; familia_casa_tipo: string; familia_valor_aluguel: string;
  familia_rua_pavimentada: string; familia_agua_energia: string; familia_seguranca: string;
  familia_cama_propria: string; familia_quarto_sozinho: string; familia_rotina_paciente: string;
  familia_rotina_familia: string; familia_clima_casa: string; familia_eventos_importantes: string;
  gest_planejada: string; gest_aceita: string; gest_semanas_descoberta: string; gest_pre_natal: string;
  gest_pre_natal_onde: string; gest_pre_natal_semanas: string; gest_relacao_familia: string;
  gest_trabalhou: string; gest_trabalhou_cargo: string; gest_trabalhou_semana: string;
  gest_hospitalizacoes: string; gest_hospitalizacoes_motivo: string; gest_cirurgias: string; gest_cirurgias_motivo: string;
  gest_medicamentos: string; gest_medicamentos_quais: string; gest_quedas: string; gest_quedas_periodo: string;
  gest_drogas: string; gest_drogas_especificar: string; gest_raio_x: string;
  gest_doencas_mae: string; gest_doencas_mae_especificar: string; gest_semanas_nascimento: string;
  gest_tipo_parto: string; gest_parto_induzido: string; gest_forceps: string; gest_local_nascimento: string;
  gest_tempo_bolsa: string; gest_bebe_roxo: string; gest_chorou_nascer: string;
  gest_cuidados_intensivos: string; gest_cuidados_intensivos_tempo: string; gest_respirou_sozinho: string;
  marcos_balbucios: string; marcos_palavras: string; marcos_frases: string; marcos_firmou_cabeca: string;
  marcos_sentou: string; marcos_passos_apoio: string; marcos_caminhou: string; marcos_sorriu: string;
  marcos_seguiu_olhar: string; marcos_apontou: string; marcos_fralda_dia: string; marcos_fralda_noite: string;
  dev1_curva: string; dev1_chorava: string; dev1_dormia_muito: string; dev1_dormia_pouco: string;
  dev1_colicas: string; dev1_vacinacao: string; dev1_ambiente: string;
  saude_internacoes: string; saude_internacoes_detalhes: string; saude_med_atual: string; saude_med_atual_detalhes: string;
  saude_med_passada: string; saude_med_passada_detalhes: string; saude_auditivo: string; saude_auditivo_corrigido: string;
  saude_visual: string; saude_visual_corrigido: string; saude_desmaios: string; saude_desmaios_detalhes: string;
  saude_convulsoes: string; saude_convulsoes_detalhes: string; saude_meningite: string; saude_encefalite: string;
  saude_sarampo: string; saude_rubeola: string; saude_caxumba: string; saude_coqueluche: string;
  saude_pneumonia: string; saude_alergias: string; saude_alergias_quais: string;
  saude_outras_doencas: string; saude_outras_doencas_quais: string;
  saude_acompanhamento: string; saude_acompanhamento_detalhes: string;
  saude_dores: string; saude_dores_quais: string; saude_dores_frequencia: string;
  saude_diagnosticos: string; saude_diagnosticos_quais: string;
  social_tem_amigos: string; social_melhor_amigo: string; social_preferencia_idade: string; social_bullying: string;
  social_busca_interacao: string; social_adapta_brincadeiras: string; social_conversa_grupos: string;
  social_relacao_pai: string; social_relacao_mae: string; social_relacao_irmaos: string; social_relacao_professor: string;
  social_reage_negacao: string; social_frequenta_amigos: string; social_familiar_proximo: string;
  social_interesses: string; social_interesse_especifico: string; social_lida_rotina: string; social_interesses_faixa_etaria: string;
  auto_dinheiro: string; auto_higiene: string; auto_refeicoes: string; auto_horas: string;
  auto_tempo: string; auto_vestir: string; auto_escolher_roupas: string; auto_escala: string;
  sono_pegar: string; sono_despertar: string; sono_movimenta: string; sono_pesadelos: string;
  sono_ronca: string; sono_ronca_desde: string; sono_ronca_freq: string;
  sono_enurese: string; sono_enurese_desde: string; sono_enurese_freq: string;
  sono_tempo: string; sono_rotina: string; sono_rotina_horario: string;
  alim_amamentou: string; alim_amamentou_idade: string; alim_peso: string; alim_restricao: string;
  alim_resistencia: string; alim_muita_fome: string; alim_muita_fome_primeiros: string; alim_padrao: string;
  narr_historias: string; narr_recontar: string; narr_humor: string; narr_piadas: string; narr_escola: string; narr_recados: string;
  ori_direita_esquerda: string; ori_cima_baixo: string; ori_atras_frente: string; ori_ontem_hoje_amanha: string;
  ori_manha_tarde_noite: string; ori_dias_semana: string; ori_calendario: string; ori_aniversario: string;
  ori_ambientes_novos: string; ori_propria_casa: string; ori_escola: string;
  esc_idade_inicio: string; esc_alfabetizado: string; esc_letras: string; esc_numeros: string; esc_cores: string;
  esc_reprovacao: string; esc_reprovacao_detalhes: string; esc_dificuldades_gerais: string;
  esc_dificuldades_especifica: string; esc_dificuldades_quais: string; esc_queixas_comportamento: string;
  esc_rotina_estudo: string; esc_ambiente_estudo: string; esc_suporte_tarefas: string; esc_horario_dever: string;
  par_castigos_fisicos: string; par_xingamentos: string; par_conversas: string;
  par_negociacoes: string; par_elogios: string; par_carinhos: string;
  gen_dificuldades_escola: string; gen_diagnostico_psiquiatrico: string; gen_sindrome: string;
  gen_medicacoes_controladas: string; gen_tentativa_suicidio: string;
  gen_tentativa_suicidio_parentesco: string; gen_morte_suicidio: string;
  temp_descricao: string; temp_dificuldades: string;
}

export interface FormAcupuntura {
  nome: string;
  endereco: string;
  idade: string;
  data_nascimento: string;
  telefone: string;
  profissao: string;
  estado_civil: string;
  filho: string;
  pacote: string;
  historia: string;
  ig: string;
  sono: string;
  alimentacao: string;
  lingua: string;
  data_consulta: string;
  tecnicas_utilizadas: string;
}

export interface FormFisioterapia {
  nome: string; idade: string; sexo: string; ocupacao: string;
  cpf: string; rg: string; contato: string;
  caso_clinico: string; historico_medico: string;
  usa_medicamento: string; medicamentos_lista: string;
  sv_fc: string; sv_fr: string; sv_pa: string;
  apresentacao_paciente: string; inspecao_palpacao: string;
  exames_complementares: string; exames_complementares_obs: string;
  protese_ortese: string; protese_ortese_obs: string;
  limitacao_movimento: string; limitacao_movimento_obs: string;
  equilibrio_coordenacao: string; queixa_principal: string;
  historia_clinica: string; demais_observacoes: string;
  dor_intensidade: string; objetivo_tratamento: string;
  recursos_terapeuticos: string; anotacoes_gerais: string;
  data_assinatura: string; assinatura: string;
}

export type ModalType = "anamnese_adulto" | "anamnese_crianca" | "fisioterapia" | "acupuntura";

export interface Morador {
  nome: string;
  parentesco: string;
  idade: string;
}
