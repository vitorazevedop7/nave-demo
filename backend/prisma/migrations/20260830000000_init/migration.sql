
-- CreateEnum
CREATE TYPE "VisibilidadeProntuario" AS ENUM ('PRIVADO', 'ESPECIALIDADE', 'GESTORAS', 'EQUIPE_CLINICA');

-- CreateTable
CREATE TABLE "agendamentos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "beneficiaria_id" UUID,
    "profissional_id" UUID NOT NULL,
    "encaminhamento_id" UUID,
    "data_hora" TIMESTAMP(6) NOT NULL,
    "status" VARCHAR DEFAULT 'AGENDADO',
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bazares" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "data" DATE NOT NULL,
    "local" VARCHAR,
    "total_arrecadado" DECIMAL,
    "observacoes" TEXT,
    "registrado_por" UUID,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "descricao" TEXT,
    "horario_fim" TIME(6),
    "horario_inicio" TIME(6),
    "nome" VARCHAR NOT NULL,

    CONSTRAINT "bazares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bazar_profissionais" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bazar_id" UUID NOT NULL,
    "profissional_id" UUID NOT NULL,

    CONSTRAINT "bazar_profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiarias" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR NOT NULL,
    "cpf" VARCHAR,
    "data_nascimento" DATE,
    "telefone" VARCHAR,
    "endereco" VARCHAR,
    "tipo" VARCHAR,
    "responsavel_id" UUID,
    "status" VARCHAR,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "deletado_em" TIMESTAMP(6),
    "estado_civil" VARCHAR,
    "escolaridade" VARCHAR,
    "raca" VARCHAR,
    "ocupacao" VARCHAR,
    "empregada" BOOLEAN,

    CONSTRAINT "beneficiarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doacoes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "doador_id" UUID,
    "tipo" VARCHAR NOT NULL,
    "valor" DECIMAL,
    "quantidade" VARCHAR,
    "data" DATE NOT NULL,
    "observacao" TEXT,
    "registrado_por" UUID,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "campanha_id" UUID,

    CONSTRAINT "doacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campanhas_doacoes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR NOT NULL,
    "descricao" TEXT,
    "meta_valor" DECIMAL,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "encerrada_em" TIMESTAMP(6),

    CONSTRAINT "campanhas_doacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doadores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR NOT NULL,
    "tipo" VARCHAR,
    "telefone" VARCHAR,
    "email" VARCHAR,
    "registrado_por" UUID,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "deletado_em" TIMESTAMP(6),

    CONSTRAINT "doadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encaminhamentos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "triagem_id" UUID NOT NULL,
    "especialidade" VARCHAR NOT NULL,
    "status" VARCHAR DEFAULT 'PENDENTE',
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encaminhamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfis_usuario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "perfil" VARCHAR NOT NULL,

    CONSTRAINT "perfis_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prontuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "beneficiaria_id" UUID NOT NULL,
    "profissional_id" UUID NOT NULL,
    "agendamento_id" UUID,
    "especialidade" VARCHAR NOT NULL,
    "descricao" TEXT,
    "visibilidade" "VisibilidadeProntuario" NOT NULL DEFAULT 'PRIVADO',
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(6),

    CONSTRAINT "prontuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triagens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "beneficiaria_id" UUID NOT NULL,
    "triador_id" UUID NOT NULL,
    "data_triagem" TIMESTAMP(6) NOT NULL,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "triagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "senha_hash" VARCHAR NOT NULL,
    "especialidade" VARCHAR,
    "ativo" BOOLEAN DEFAULT true,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "deletado_em" TIMESTAMP(6),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prontuario_compartilhamentos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prontuario_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prontuario_compartilhamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queixas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "triagem_id" UUID NOT NULL,
    "queixa_principal" TEXT NOT NULL,
    "queixa_secundaria" TEXT,
    "sintomas" TEXT,
    "tipo_violencia" VARCHAR,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "queixas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prontuarios_acupuntura" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prontuario_id" UUID NOT NULL,
    "data_atendimento" DATE,
    "nome" VARCHAR,
    "profissional" VARCHAR,
    "queixa_principal" TEXT,
    "observacoes_clinicas" TEXT,
    "data_assinatura" DATE,

    CONSTRAINT "prontuarios_acupuntura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prontuarios_psicologia_adulto" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prontuario_id" UUID NOT NULL,
    "data_atendimento" DATE,
    "psicologo_estagiario" VARCHAR,
    "nome" VARCHAR,
    "idade" VARCHAR,
    "sexo" VARCHAR,
    "nacionalidade" VARCHAR,
    "civil" VARCHAR,
    "data_nascimento" DATE,
    "estado" VARCHAR,
    "escolaridade" VARCHAR,
    "profissao" VARCHAR,
    "desempregado" VARCHAR,
    "tempo_desemprego" VARCHAR,
    "residencia" TEXT,
    "telefone" VARCHAR,
    "ocupacao" VARCHAR,
    "hobbies" TEXT,
    "queixa_principal" TEXT,
    "queixa_secundaria" TEXT,
    "sintomas" TEXT,
    "psicoterapia_anterior" TEXT,
    "expectativas_objetivos" TEXT,
    "historico_infancia" TEXT,
    "rotina" TEXT,
    "vicios" TEXT,
    "trabalho" TEXT,
    "doencas_transtornos" TEXT,
    "medicamentos" TEXT,
    "uso_drogas" TEXT,
    "ideacao_suicida" TEXT,
    "pais_cuidadores" TEXT,
    "irmaos" TEXT,
    "conjuge" TEXT,
    "filhos" TEXT,
    "lar" TEXT,
    "patologia_pregressa" TEXT,
    "adolescencia" TEXT,
    "relacionamentos_atuais" TEXT,
    "aparencia" TEXT,
    "comportamento" TEXT,
    "atitude_entrevistador" VARCHAR,
    "orientacao_autoidentificatoria" BOOLEAN DEFAULT false,
    "orientacao_corporal" BOOLEAN DEFAULT false,
    "orientacao_temporal" BOOLEAN DEFAULT false,
    "orientacao_espacial" BOOLEAN DEFAULT false,
    "orientacao_patologia" BOOLEAN DEFAULT false,
    "orientacao_observacoes" TEXT,
    "atencao_vigilancia" TEXT,
    "atencao_tenacidade" TEXT,
    "memoria" TEXT,
    "inteligencia" TEXT,
    "sensopercpcao" VARCHAR,
    "pensamento_acelerado" BOOLEAN DEFAULT false,
    "pensamento_retardado" BOOLEAN DEFAULT false,
    "pensamento_fuga" BOOLEAN DEFAULT false,
    "pensamento_bloqueio" BOOLEAN DEFAULT false,
    "pensamento_prolixo" BOOLEAN DEFAULT false,
    "pensamento_repeticao" BOOLEAN DEFAULT false,
    "conteudo_obsessoes" BOOLEAN DEFAULT false,
    "conteudo_hipocondrias" BOOLEAN DEFAULT false,
    "conteudo_fobias" BOOLEAN DEFAULT false,
    "conteudo_delirios" BOOLEAN DEFAULT false,
    "expansao_eu_opcoes" TEXT,
    "retracao_eu_opcoes" TEXT,
    "negacao_eu_opcoes" TEXT,
    "linguagem_disturbios" TEXT,
    "afetividade" TEXT,
    "humor_opcoes" VARCHAR,
    "consciencia_doenca" VARCHAR,
    "observacao_linguagem_nao_verbal" TEXT,
    "observacoes_finais" TEXT,

    CONSTRAINT "prontuarios_psicologia_adulto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prontuarios_psicologia_crianca" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prontuario_id" UUID NOT NULL,
    "data_atendimento" DATE,
    "profissional" VARCHAR,
    "nome" VARCHAR,
    "idade" VARCHAR,
    "sexo" VARCHAR,
    "responsavel" VARCHAR,
    "queixa_principal" TEXT,
    "observacoes" TEXT,
    "dados_json" TEXT,

    CONSTRAINT "prontuarios_psicologia_crianca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prontuarios_fisioterapia" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prontuario_id" UUID NOT NULL,
    "nome" VARCHAR,
    "idade" VARCHAR,
    "sexo" VARCHAR,
    "ocupacao" VARCHAR,
    "cpf" VARCHAR,
    "rg" VARCHAR,
    "contato" VARCHAR,
    "caso_clinico" TEXT,
    "historico_medico" TEXT,
    "usa_medicamento" VARCHAR,
    "medicamentos_lista" TEXT,
    "sv_fc" VARCHAR,
    "sv_fr" VARCHAR,
    "sv_pa" VARCHAR,
    "apresentacao_paciente" TEXT,
    "inspecao_palpacao" TEXT,
    "exames_complementares" VARCHAR,
    "exames_complementares_obs" TEXT,
    "protese_ortese" VARCHAR,
    "protese_ortese_obs" TEXT,
    "limitacao_movimento" VARCHAR,
    "limitacao_movimento_obs" TEXT,
    "equilibrio_coordenacao" VARCHAR,
    "queixa_principal" TEXT,
    "historia_clinica" TEXT,
    "demais_observacoes" TEXT,
    "dor_intensidade" INTEGER DEFAULT 0,
    "objetivo_tratamento" TEXT,
    "recursos_terapeuticos" TEXT,
    "anotacoes_gerais" TEXT,
    "data_assinatura" DATE,
    "assinatura" VARCHAR,

    CONSTRAINT "prontuarios_fisioterapia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bazar_profissionais_bazar_id_profissional_id_key" ON "bazar_profissionais"("bazar_id", "profissional_id");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiarias_cpf_key" ON "beneficiarias"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "prontuarios_agendamento_id_key" ON "prontuarios"("agendamento_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "prontuario_compartilhamentos_prontuario_id_usuario_id_key" ON "prontuario_compartilhamentos"("prontuario_id", "usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "prontuarios_acupuntura_prontuario_id_key" ON "prontuarios_acupuntura"("prontuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "prontuarios_psicologia_adulto_prontuario_id_key" ON "prontuarios_psicologia_adulto"("prontuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "prontuarios_psicologia_crianca_prontuario_id_key" ON "prontuarios_psicologia_crianca"("prontuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "prontuarios_fisioterapia_prontuario_id_key" ON "prontuarios_fisioterapia"("prontuario_id");

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_beneficiaria_id_fkey" FOREIGN KEY ("beneficiaria_id") REFERENCES "beneficiarias"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_encaminhamento_id_fkey" FOREIGN KEY ("encaminhamento_id") REFERENCES "encaminhamentos"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bazares" ADD CONSTRAINT "bazares_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bazar_profissionais" ADD CONSTRAINT "bazar_profissionais_bazar_id_fkey" FOREIGN KEY ("bazar_id") REFERENCES "bazares"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bazar_profissionais" ADD CONSTRAINT "bazar_profissionais_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "beneficiarias" ADD CONSTRAINT "beneficiarias_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "beneficiarias"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "doacoes" ADD CONSTRAINT "doacoes_doador_id_fkey" FOREIGN KEY ("doador_id") REFERENCES "doadores"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "doacoes" ADD CONSTRAINT "doacoes_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "doacoes" ADD CONSTRAINT "doacoes_campanha_id_fkey" FOREIGN KEY ("campanha_id") REFERENCES "campanhas_doacoes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "doadores" ADD CONSTRAINT "doadores_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "encaminhamentos" ADD CONSTRAINT "encaminhamentos_triagem_id_fkey" FOREIGN KEY ("triagem_id") REFERENCES "triagens"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "perfis_usuario" ADD CONSTRAINT "perfis_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prontuarios" ADD CONSTRAINT "prontuarios_agendamento_id_fkey" FOREIGN KEY ("agendamento_id") REFERENCES "agendamentos"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prontuarios" ADD CONSTRAINT "prontuarios_beneficiaria_id_fkey" FOREIGN KEY ("beneficiaria_id") REFERENCES "beneficiarias"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prontuarios" ADD CONSTRAINT "prontuarios_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "triagens" ADD CONSTRAINT "triagens_beneficiaria_id_fkey" FOREIGN KEY ("beneficiaria_id") REFERENCES "beneficiarias"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "triagens" ADD CONSTRAINT "triagens_triador_id_fkey" FOREIGN KEY ("triador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prontuario_compartilhamentos" ADD CONSTRAINT "prontuario_compartilhamentos_prontuario_id_fkey" FOREIGN KEY ("prontuario_id") REFERENCES "prontuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prontuario_compartilhamentos" ADD CONSTRAINT "prontuario_compartilhamentos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "queixas" ADD CONSTRAINT "queixas_triagem_id_fkey" FOREIGN KEY ("triagem_id") REFERENCES "triagens"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prontuarios_acupuntura" ADD CONSTRAINT "prontuarios_acupuntura_prontuario_id_fkey" FOREIGN KEY ("prontuario_id") REFERENCES "prontuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prontuarios_psicologia_adulto" ADD CONSTRAINT "prontuarios_psicologia_adulto_prontuario_id_fkey" FOREIGN KEY ("prontuario_id") REFERENCES "prontuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prontuarios_psicologia_crianca" ADD CONSTRAINT "prontuarios_psicologia_crianca_prontuario_id_fkey" FOREIGN KEY ("prontuario_id") REFERENCES "prontuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prontuarios_fisioterapia" ADD CONSTRAINT "prontuarios_fisioterapia_prontuario_id_fkey" FOREIGN KEY ("prontuario_id") REFERENCES "prontuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
