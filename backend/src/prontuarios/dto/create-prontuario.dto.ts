import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VisibilidadeProntuario } from '@prisma/client';

export class AnamneseAdultoDto {
  @IsOptional() @IsString() data_atendimento?: string;
  @IsOptional() @IsString() psicologo_estagiario?: string;
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsString() idade?: string;
  @IsOptional() @IsString() sexo?: string;
  @IsOptional() @IsString() nacionalidade?: string;
  @IsOptional() @IsString() civil?: string;
  @IsOptional() @IsString() data_nascimento?: string;
  @IsOptional() @IsString() estado?: string;
  @IsOptional() @IsString() escolaridade?: string;
  @IsOptional() @IsString() profissao?: string;
  @IsOptional() @IsString() desempregado?: string;
  @IsOptional() @IsString() tempo_desemprego?: string;
  @IsOptional() @IsString() residencia?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsString() ocupacao?: string;
  @IsOptional() @IsString() hobbies?: string;
  @IsOptional() @IsString() queixa_principal?: string;
  @IsOptional() @IsString() queixa_secundaria?: string;
  @IsOptional() @IsString() sintomas?: string;
  @IsOptional() @IsString() psicoterapia_anterior?: string;
  @IsOptional() @IsString() expectativas_objetivos?: string;
  @IsOptional() @IsString() historico_infancia?: string;
  @IsOptional() @IsString() rotina?: string;
  @IsOptional() @IsString() vicios?: string;
  @IsOptional() @IsString() trabalho?: string;
  @IsOptional() @IsString() doencas_transtornos?: string;
  @IsOptional() @IsString() medicamentos?: string;
  @IsOptional() @IsString() uso_drogas?: string;
  @IsOptional() @IsString() ideacao_suicida?: string;
  @IsOptional() @IsString() pais_cuidadores?: string;
  @IsOptional() @IsString() irmaos?: string;
  @IsOptional() @IsString() conjuge?: string;
  @IsOptional() @IsString() filhos?: string;
  @IsOptional() @IsString() lar?: string;
  @IsOptional() @IsString() patologia_pregressa?: string;
  @IsOptional() @IsString() adolescencia?: string;
  @IsOptional() @IsString() relacionamentos_atuais?: string;
  @IsOptional() @IsString() aparencia?: string;
  @IsOptional() @IsString() comportamento?: string;
  @IsOptional() @IsString() atitude_entrevistador?: string;
  @IsOptional() @IsBoolean() orientacao_autoidentificatoria?: boolean;
  @IsOptional() @IsBoolean() orientacao_corporal?: boolean;
  @IsOptional() @IsBoolean() orientacao_temporal?: boolean;
  @IsOptional() @IsBoolean() orientacao_espacial?: boolean;
  @IsOptional() @IsBoolean() orientacao_patologia?: boolean;
  @IsOptional() @IsString() orientacao_observacoes?: string;
  @IsOptional() @IsString() atencao_vigilancia?: string;
  @IsOptional() @IsString() atencao_tenacidade?: string;
  @IsOptional() @IsString() memoria?: string;
  @IsOptional() @IsString() inteligencia?: string;
  @IsOptional() @IsString() sensopercpcao?: string;
  @IsOptional() @IsBoolean() pensamento_acelerado?: boolean;
  @IsOptional() @IsBoolean() pensamento_retardado?: boolean;
  @IsOptional() @IsBoolean() pensamento_fuga?: boolean;
  @IsOptional() @IsBoolean() pensamento_bloqueio?: boolean;
  @IsOptional() @IsBoolean() pensamento_prolixo?: boolean;
  @IsOptional() @IsBoolean() pensamento_repeticao?: boolean;
  @IsOptional() @IsBoolean() conteudo_obsessoes?: boolean;
  @IsOptional() @IsBoolean() conteudo_hipocondrias?: boolean;
  @IsOptional() @IsBoolean() conteudo_fobias?: boolean;
  @IsOptional() @IsBoolean() conteudo_delirios?: boolean;
  @IsOptional() @IsString() expansao_eu_opcoes?: string;
  @IsOptional() @IsString() retracao_eu_opcoes?: string;
  @IsOptional() @IsString() negacao_eu_opcoes?: string;
  @IsOptional() @IsString() linguagem_disturbios?: string;
  @IsOptional() @IsString() afetividade?: string;
  @IsOptional() @IsString() humor_opcoes?: string;
  @IsOptional() @IsString() consciencia_doenca?: string;
  @IsOptional() @IsString() observacao_linguagem_nao_verbal?: string;
  @IsOptional() @IsString() observacoes_finais?: string;
}

export class AnamneseCriancaDto {
  @IsOptional() @IsString() data_atendimento?: string;
  @IsOptional() @IsString() profissional?: string;
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsString() idade?: string;
  @IsOptional() @IsString() sexo?: string;
  @IsOptional() @IsString() responsavel?: string;
  @IsOptional() @IsString() queixa_principal?: string;
  @IsOptional() @IsString() observacoes?: string;
  @IsOptional() @IsString() dados_json?: string;
}

export class FisioterapiaDto {
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsString() idade?: string;
  @IsOptional() @IsString() sexo?: string;
  @IsOptional() @IsString() ocupacao?: string;
  @IsOptional() @IsString() cpf?: string;
  @IsOptional() @IsString() rg?: string;
  @IsOptional() @IsString() contato?: string;
  @IsOptional() @IsString() caso_clinico?: string;
  @IsOptional() @IsString() historico_medico?: string;
  @IsOptional() @IsString() usa_medicamento?: string;
  @IsOptional() @IsString() medicamentos_lista?: string;
  @IsOptional() @IsString() sv_fc?: string;
  @IsOptional() @IsString() sv_fr?: string;
  @IsOptional() @IsString() sv_pa?: string;
  @IsOptional() @IsString() apresentacao_paciente?: string;
  @IsOptional() @IsString() inspecao_palpacao?: string;
  @IsOptional() @IsString() exames_complementares?: string;
  @IsOptional() @IsString() exames_complementares_obs?: string;
  @IsOptional() @IsString() protese_ortese?: string;
  @IsOptional() @IsString() protese_ortese_obs?: string;
  @IsOptional() @IsString() limitacao_movimento?: string;
  @IsOptional() @IsString() limitacao_movimento_obs?: string;
  @IsOptional() @IsString() equilibrio_coordenacao?: string;
  @IsOptional() @IsString() queixa_principal?: string;
  @IsOptional() @IsString() historia_clinica?: string;
  @IsOptional() @IsString() demais_observacoes?: string;
  @IsOptional() @IsNumber() dor_intensidade?: number;
  @IsOptional() @IsString() objetivo_tratamento?: string;
  @IsOptional() @IsString() recursos_terapeuticos?: string;
  @IsOptional() @IsString() anotacoes_gerais?: string;
  @IsOptional() @IsString() data_assinatura?: string;
  @IsOptional() @IsString() assinatura?: string;
}

export class AcupunturaDto {
  @IsOptional() @IsString() data_atendimento?: string;
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsString() profissional?: string;
  @IsOptional() @IsString() queixa_principal?: string;
  @IsOptional() @IsString() observacoes_clinicas?: string;
  @IsOptional() @IsString() data_assinatura?: string;
}

export class PsicologiaDto {
  @IsOptional() @IsString() data_atendimento?: string;
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsString() profissional?: string;
  @IsOptional() @IsString() queixa_principal?: string;
  @IsOptional() @IsString() observacoes_clinicas?: string;
  @IsOptional() @IsString() data_assinatura?: string;
}

export class CreateProntuarioDto {
  @IsString() beneficiaria_id: string;
  @IsString() profissional_id: string;
  @IsOptional() @IsString() agendamento_id?: string;
  // Campo legado: aceito para compatibilidade, mas ignorado pelo serviço.
  // A especialidade persistida é sempre derivada do usuário autenticado.
  @IsOptional() @IsString() especialidade?: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional()
  @IsEnum(VisibilidadeProntuario)
  visibilidade?: VisibilidadeProntuario;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  compartilhamentos?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AnamneseAdultoDto)
  psicologia_adulto?: AnamneseAdultoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AnamneseCriancaDto)
  psicologia_crianca?: AnamneseCriancaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FisioterapiaDto)
  fisioterapia?: FisioterapiaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AcupunturaDto)
  acupuntura?: AcupunturaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PsicologiaDto)
  psicologia?: PsicologiaDto;
}
