import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, VisibilidadeProntuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WHERE_USUARIO_COMPARTILHAVEL } from '../usuarios/usuario-compartilhavel';
import {
  AcupunturaDto,
  AnamneseAdultoDto,
  AnamneseCriancaDto,
  CreateProntuarioDto,
  FisioterapiaDto,
} from './dto/create-prontuario.dto';
import { UpdateProntuarioDto } from './dto/update-prontuario.dto';

const toDate = (value?: string): Date | null => {
  if (!value || !value.trim()) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const includeProntuarioFields = {
  prontuarios_psicologia_adulto: true,
  prontuarios_psicologia_crianca: true,
  prontuarios_fisioterapia: true,
  prontuarios_acupuntura: true,
  prontuario_compartilhamentos: {
    select: { usuario_id: true },
  },
  usuarios: {
    select: { nome: true },
  },
  beneficiarias: {
    select: { id: true, nome: true },
  },
} as const;

const selectProntuarioResumo = {
  id: true,
  profissional_id: true,
  especialidade: true,
  descricao: true,
  visibilidade: true,
  criado_em: true,
  prontuario_compartilhamentos: {
    select: { usuario_id: true },
  },
  usuarios: {
    select: { nome: true },
  },
} as const;

/** Prontuários excluídos (soft delete) nunca aparecem em leitura alguma. */
const NAO_EXCLUIDO = { deletado_em: null } as const;

type UsuarioVisibilidade = {
  id: string;
  especialidade: string | null;
  perfis: string[];
};

type ProntuarioRedigivel = {
  id: string;
  profissional_id: string;
  especialidade: string;
  visibilidade: VisibilidadeProntuario;
  criado_em: Date | null;
  prontuario_compartilhamentos: { usuario_id: string }[];
  usuarios: { nome: string };
};

type OrigemAcessoProntuario =
  | 'COMPARTILHADO_COM_VOCE'
  | 'ESPECIALIDADE'
  | 'GESTORAS'
  | 'EQUIPE_CLINICA';

export function redigirProntuario<T extends ProntuarioRedigivel>(
  prontuario: T,
  usuario: UsuarioVisibilidade,
) {
  const compartilhado = prontuario.prontuario_compartilhamentos.some(
    (compartilhamento) => compartilhamento.usuario_id === usuario.id,
  );

  const autor = prontuario.profissional_id === usuario.id;
  const perfis = new Set(usuario.perfis);

  let perfilCompativel = false;
  switch (prontuario.visibilidade) {
    case VisibilidadeProntuario.PRIVADO:
      perfilCompativel = false;
      break;
    case VisibilidadeProntuario.ESPECIALIDADE:
      perfilCompativel =
        perfis.has('PROFISSIONAL') &&
        usuario.especialidade === prontuario.especialidade;
      break;
    case VisibilidadeProntuario.GESTORAS:
      perfilCompativel = perfis.has('GESTORA');
      break;
    case VisibilidadeProntuario.EQUIPE_CLINICA:
      perfilCompativel = perfis.has('GESTORA') || perfis.has('PROFISSIONAL');
      break;
  }

  if (autor || compartilhado || perfilCompativel) {
    const { usuarios, prontuario_compartilhamentos, ...conteudo } = prontuario;

    return {
      ...conteudo,
      autor: usuarios.nome,
      ...(autor && {
        compartilhamentos: prontuario_compartilhamentos.map(
          (compartilhamento) => compartilhamento.usuario_id,
        ),
      }),
    };
  }

  return {
    id: prontuario.id,
    data: prontuario.criado_em,
    profissional: prontuario.usuarios.nome,
    especialidade: prontuario.especialidade,
    conteudo_restrito: true as const,
  };
}

@Injectable()
export class ProntuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProntuarioDto, usuarioId: string) {
    const autor = await this.prisma.usuarios.findFirst({
      where: { id: usuarioId, deletado_em: null, ativo: true },
      select: { especialidade: true },
    });

    if (!autor) throw new UnauthorizedException('Usuário inativo ou removido');
    if (!autor.especialidade?.trim()) {
      throw new BadRequestException(
        'Profissional sem especialidade cadastrada não pode criar prontuário',
      );
    }

    if (dto.agendamento_id) {
      const [agendamento, existente] = await Promise.all([
        this.prisma.agendamentos.findUnique({
          where: { id: dto.agendamento_id },
          select: { beneficiaria_id: true, profissional_id: true },
        }),
        this.prisma.prontuarios.findFirst({
          where: { agendamento_id: dto.agendamento_id, ...NAO_EXCLUIDO },
          select: { id: true },
        }),
      ]);

      if (!agendamento) {
        throw new NotFoundException('Agendamento não encontrado');
      }
      if (agendamento.profissional_id !== usuarioId) {
        throw new ForbiddenException(
          'O prontuário deve ser criado pelo profissional do agendamento',
        );
      }
      if (agendamento.beneficiaria_id !== dto.beneficiaria_id) {
        throw new BadRequestException(
          'A beneficiária do prontuário diverge da beneficiária do agendamento',
        );
      }
      if (existente) {
        throw new ConflictException('Este agendamento já possui um prontuário');
      }
    }

    if (dto.compartilhamentos?.length) {
      await this.validarCompartilhamentos(dto.compartilhamentos);
    }

    const prontuario = await this.prisma.prontuarios.create({
      data: {
        beneficiaria_id: dto.beneficiaria_id,
        profissional_id: usuarioId,
        agendamento_id: dto.agendamento_id,
        especialidade: autor.especialidade,
        descricao: dto.descricao,
        visibilidade: dto.visibilidade,
        ...(dto.compartilhamentos && {
          prontuario_compartilhamentos: {
            create: dto.compartilhamentos.map((usuario_id) => ({
              usuarios: { connect: { id: usuario_id } },
            })),
          },
        }),
        ...(dto.psicologia_adulto && {
          prontuarios_psicologia_adulto: {
            create: buildAnamneseAdulto(dto.psicologia_adulto),
          },
        }),
        ...(dto.psicologia_crianca && {
          prontuarios_psicologia_crianca: {
            create: buildAnamneseCrianca(dto.psicologia_crianca),
          },
        }),
        ...(dto.fisioterapia && {
          prontuarios_fisioterapia: {
            create: buildFisioterapia(dto.fisioterapia),
          },
        }),
        ...(dto.acupuntura && {
          prontuarios_acupuntura: {
            create: buildAcupuntura(dto.acupuntura),
          },
        }),
      },
      include: includeProntuarioFields,
    });

    return redigirProntuario(prontuario, {
      id: usuarioId,
      especialidade: null,
      perfis: [],
    });
  }

  async findAll(usuarioId: string) {
    const usuario = await this.buscarUsuarioVisibilidade(usuarioId);
    const prontuarios = await this.prisma.prontuarios.findMany({
      where: { AND: [NAO_EXCLUIDO, this.whereVisibilidade(usuario)] },
      select: selectProntuarioResumo,
      orderBy: { criado_em: 'desc' },
    });

    return prontuarios.map((prontuario) =>
      redigirProntuario(prontuario, usuario),
    );
  }

  async findByProfissional(profissional_id: string, usuarioId: string) {
    const usuario = await this.buscarUsuarioVisibilidade(usuarioId);
    const prontuarios = await this.prisma.prontuarios.findMany({
      where: {
        AND: [
          { profissional_id, ...NAO_EXCLUIDO },
          this.whereVisibilidade(usuario),
        ],
      },
      select: selectProntuarioResumo,
      orderBy: { criado_em: 'desc' },
    });

    return prontuarios.map((prontuario) =>
      redigirProntuario(prontuario, usuario),
    );
  }

  async findOutrosAcessiveis(usuarioId: string) {
    const usuario = await this.buscarUsuarioVisibilidade(usuarioId);
    const prontuarios = await this.prisma.prontuarios.findMany({
      where: {
        AND: [
          { profissional_id: { not: usuario.id }, ...NAO_EXCLUIDO },
          this.whereLeitura(usuario),
        ],
      },
      select: {
        id: true,
        especialidade: true,
        visibilidade: true,
        criado_em: true,
        prontuario_compartilhamentos: {
          select: { usuario_id: true },
        },
        beneficiarias: { select: { id: true, nome: true } },
        usuarios: { select: { nome: true } },
      },
      orderBy: { criado_em: 'desc' },
    });

    return prontuarios.map(
      ({ prontuario_compartilhamentos, visibilidade, ...prontuario }) => ({
        ...prontuario,
        origem_acesso: this.origemAcesso(
          {
            especialidade: prontuario.especialidade,
            visibilidade,
            prontuario_compartilhamentos,
          },
          usuario,
        ),
      }),
    );
  }

  async findByBeneficiaria(beneficiaria_id: string, usuarioId: string) {
    const usuario = await this.buscarUsuarioVisibilidade(usuarioId);
    const prontuarios = await this.prisma.prontuarios.findMany({
      where: {
        AND: [
          { beneficiaria_id, ...NAO_EXCLUIDO },
          this.whereVisibilidade(usuario),
        ],
      },
      include: includeProntuarioFields,
      orderBy: { criado_em: 'desc' },
    });

    return prontuarios.map((prontuario) =>
      redigirProntuario(prontuario, usuario),
    );
  }

  async findByAgendamento(agendamento_id: string, usuarioId: string) {
    const [usuario, agendamento] = await Promise.all([
      this.buscarUsuarioVisibilidade(usuarioId),
      this.prisma.agendamentos.findUnique({
        where: { id: agendamento_id },
        select: { profissional_id: true },
      }),
    ]);

    if (!agendamento) throw new NotFoundException('Agendamento não encontrado');
    if (
      !usuario.perfis.includes('GESTORA') &&
      agendamento.profissional_id !== usuarioId
    ) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const prontuario = await this.prisma.prontuarios.findFirst({
      where: { agendamento_id, ...NAO_EXCLUIDO },
      include: includeProntuarioFields,
    });

    if (!prontuario) return { estado: 'AUSENTE' as const };

    const resultado = redigirProntuario(prontuario, usuario);
    if ('conteudo_restrito' in resultado) {
      return { estado: 'RESTRITO' as const, prontuario: resultado };
    }

    return { estado: 'DISPONIVEL' as const, prontuario: resultado };
  }

  async findOne(id: string, usuarioId: string) {
    const usuario = await this.buscarUsuarioVisibilidade(usuarioId);
    const prontuario = await this.prisma.prontuarios.findFirst({
      where: {
        AND: [{ id, ...NAO_EXCLUIDO }, this.whereVisibilidade(usuario)],
      },
      include: includeProntuarioFields,
    });
    if (!prontuario) throw new NotFoundException('Prontuário não encontrado');
    return redigirProntuario(prontuario, usuario);
  }

  async update(id: string, dto: UpdateProntuarioDto, usuarioId: string) {
    await this.verificarAutoria(id, usuarioId);

    if (dto.compartilhamentos?.length) {
      await this.validarCompartilhamentos(dto.compartilhamentos);
    }

    const prontuario = await this.prisma.prontuarios.update({
      where: { id },
      data: {
        atualizado_em: new Date(),
        ...(dto.descricao !== undefined && { descricao: dto.descricao }),
        ...(dto.visibilidade !== undefined && {
          visibilidade: dto.visibilidade,
        }),
        ...(dto.compartilhamentos !== undefined && {
          prontuario_compartilhamentos: {
            deleteMany: {},
            create: dto.compartilhamentos.map((usuario_id) => ({
              usuarios: { connect: { id: usuario_id } },
            })),
          },
        }),
        ...(dto.psicologia_adulto && {
          prontuarios_psicologia_adulto: {
            upsert: {
              create: buildAnamneseAdulto(dto.psicologia_adulto),
              update: buildAnamneseAdulto(dto.psicologia_adulto),
            },
          },
        }),
        ...(dto.psicologia_crianca && {
          prontuarios_psicologia_crianca: {
            upsert: {
              create: buildAnamneseCrianca(dto.psicologia_crianca),
              update: buildAnamneseCrianca(dto.psicologia_crianca),
            },
          },
        }),
        ...(dto.fisioterapia && {
          prontuarios_fisioterapia: {
            upsert: {
              create: buildFisioterapia(dto.fisioterapia),
              update: buildFisioterapia(dto.fisioterapia),
            },
          },
        }),
        ...(dto.acupuntura && {
          prontuarios_acupuntura: {
            upsert: {
              create: buildAcupuntura(dto.acupuntura),
              update: buildAcupuntura(dto.acupuntura),
            },
          },
        }),
      },
      include: includeProntuarioFields,
    });

    return redigirProntuario(prontuario, {
      id: usuarioId,
      especialidade: null,
      perfis: [],
    });
  }

  /**
   * Exclusão lógica: o registro some de todas as leituras, mas permanece no
   * banco. O vínculo com o agendamento é liberado (`agendamento_id` é único)
   * para que o profissional possa registrar um novo prontuário naquele
   * atendimento; beneficiária e autoria continuam gravadas.
   */
  async remove(id: string, usuarioId: string): Promise<void> {
    await this.verificarAutoria(id, usuarioId);
    await this.prisma.prontuarios.update({
      where: { id },
      data: { deletado_em: new Date(), agendamento_id: null },
    });
  }

  private async buscarUsuarioVisibilidade(
    usuarioId: string,
  ): Promise<UsuarioVisibilidade> {
    const usuario = await this.prisma.usuarios.findFirst({
      where: { id: usuarioId, deletado_em: null, ativo: true },
      select: {
        id: true,
        especialidade: true,
        perfis_usuario: { select: { perfil: true } },
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuário inativo ou removido');
    }

    return {
      id: usuario.id,
      especialidade: usuario.especialidade,
      perfis: usuario.perfis_usuario.map(({ perfil }) => perfil),
    };
  }

  private whereVisibilidade(
    usuario: UsuarioVisibilidade,
  ): Prisma.prontuariosWhereInput {
    const perfis = new Set(usuario.perfis);

    if (perfis.has('GESTORA')) return {};

    const permissoes: Prisma.prontuariosWhereInput[] = [
      { profissional_id: usuario.id },
      ...this.permissoesLeitura(usuario),
    ];

    return { OR: permissoes };
  }

  private whereLeitura(
    usuario: UsuarioVisibilidade,
  ): Prisma.prontuariosWhereInput {
    return { OR: this.permissoesLeitura(usuario) };
  }

  private permissoesLeitura(
    usuario: UsuarioVisibilidade,
  ): Prisma.prontuariosWhereInput[] {
    const perfis = new Set(usuario.perfis);
    const permissoes: Prisma.prontuariosWhereInput[] = [
      {
        prontuario_compartilhamentos: {
          some: { usuario_id: usuario.id },
        },
      },
    ];

    if (perfis.has('PROFISSIONAL')) {
      permissoes.push({ visibilidade: VisibilidadeProntuario.EQUIPE_CLINICA });

      if (usuario.especialidade) {
        permissoes.push({
          visibilidade: VisibilidadeProntuario.ESPECIALIDADE,
          especialidade: usuario.especialidade,
        });
      }
    }

    if (perfis.has('GESTORA')) {
      permissoes.push(
        { visibilidade: VisibilidadeProntuario.GESTORAS },
        { visibilidade: VisibilidadeProntuario.EQUIPE_CLINICA },
      );
    }

    return permissoes;
  }

  private origemAcesso(
    prontuario: Pick<
      ProntuarioRedigivel,
      'especialidade' | 'visibilidade' | 'prontuario_compartilhamentos'
    >,
    usuario: UsuarioVisibilidade,
  ): OrigemAcessoProntuario {
    if (
      prontuario.prontuario_compartilhamentos.some(
        ({ usuario_id }) => usuario_id === usuario.id,
      )
    ) {
      return 'COMPARTILHADO_COM_VOCE';
    }

    switch (prontuario.visibilidade) {
      case VisibilidadeProntuario.ESPECIALIDADE:
        return 'ESPECIALIDADE';
      case VisibilidadeProntuario.GESTORAS:
        return 'GESTORAS';
      case VisibilidadeProntuario.EQUIPE_CLINICA:
        return 'EQUIPE_CLINICA';
      default:
        throw new Error('Prontuário sem origem de acesso compatível');
    }
  }

  private async verificarAutoria(id: string, usuarioId: string) {
    const prontuario = await this.prisma.prontuarios.findFirst({
      where: { id, ...NAO_EXCLUIDO },
      select: { profissional_id: true },
    });

    if (!prontuario) throw new NotFoundException('Prontuário não encontrado');

    if (prontuario.profissional_id !== usuarioId) {
      throw new ForbiddenException(
        'Apenas o autor pode alterar ou excluir o prontuário',
      );
    }
  }

  /**
   * Só aceita destinatários que o seletor do frontend também ofereceria:
   * ativos, não removidos e com perfil clínico (GESTORA ou PROFISSIONAL).
   */
  private async validarCompartilhamentos(usuarioIds: string[]) {
    const validos = await this.prisma.usuarios.count({
      where: { id: { in: usuarioIds }, ...WHERE_USUARIO_COMPARTILHAVEL },
    });

    if (validos !== new Set(usuarioIds).size) {
      throw new BadRequestException(
        'Compartilhamento inválido: todos os destinatários precisam ser usuários ativos com perfil GESTORA ou PROFISSIONAL.',
      );
    }
  }
}

function buildAnamneseAdulto(d: AnamneseAdultoDto) {
  return {
    data_atendimento: toDate(d.data_atendimento),
    psicologo_estagiario: d.psicologo_estagiario ?? null,
    nome: d.nome ?? null,
    idade: d.idade ?? null,
    sexo: d.sexo ?? null,
    nacionalidade: d.nacionalidade ?? null,
    civil: d.civil ?? null,
    data_nascimento: toDate(d.data_nascimento),
    estado: d.estado ?? null,
    escolaridade: d.escolaridade ?? null,
    profissao: d.profissao ?? null,
    desempregado: d.desempregado ?? null,
    tempo_desemprego: d.tempo_desemprego ?? null,
    residencia: d.residencia ?? null,
    telefone: d.telefone ?? null,
    ocupacao: d.ocupacao ?? null,
    hobbies: d.hobbies ?? null,
    queixa_principal: d.queixa_principal ?? null,
    queixa_secundaria: d.queixa_secundaria ?? null,
    sintomas: d.sintomas ?? null,
    psicoterapia_anterior: d.psicoterapia_anterior ?? null,
    expectativas_objetivos: d.expectativas_objetivos ?? null,
    historico_infancia: d.historico_infancia ?? null,
    rotina: d.rotina ?? null,
    vicios: d.vicios ?? null,
    trabalho: d.trabalho ?? null,
    doencas_transtornos: d.doencas_transtornos ?? null,
    medicamentos: d.medicamentos ?? null,
    uso_drogas: d.uso_drogas ?? null,
    ideacao_suicida: d.ideacao_suicida ?? null,
    pais_cuidadores: d.pais_cuidadores ?? null,
    irmaos: d.irmaos ?? null,
    conjuge: d.conjuge ?? null,
    filhos: d.filhos ?? null,
    lar: d.lar ?? null,
    patologia_pregressa: d.patologia_pregressa ?? null,
    adolescencia: d.adolescencia ?? null,
    relacionamentos_atuais: d.relacionamentos_atuais ?? null,
    aparencia: d.aparencia ?? null,
    comportamento: d.comportamento ?? null,
    atitude_entrevistador: d.atitude_entrevistador ?? null,
    orientacao_autoidentificatoria: d.orientacao_autoidentificatoria ?? false,
    orientacao_corporal: d.orientacao_corporal ?? false,
    orientacao_temporal: d.orientacao_temporal ?? false,
    orientacao_espacial: d.orientacao_espacial ?? false,
    orientacao_patologia: d.orientacao_patologia ?? false,
    orientacao_observacoes: d.orientacao_observacoes ?? null,
    atencao_vigilancia: d.atencao_vigilancia ?? null,
    atencao_tenacidade: d.atencao_tenacidade ?? null,
    memoria: d.memoria ?? null,
    inteligencia: d.inteligencia ?? null,
    sensopercpcao: d.sensopercpcao ?? null,
    pensamento_acelerado: d.pensamento_acelerado ?? false,
    pensamento_retardado: d.pensamento_retardado ?? false,
    pensamento_fuga: d.pensamento_fuga ?? false,
    pensamento_bloqueio: d.pensamento_bloqueio ?? false,
    pensamento_prolixo: d.pensamento_prolixo ?? false,
    pensamento_repeticao: d.pensamento_repeticao ?? false,
    conteudo_obsessoes: d.conteudo_obsessoes ?? false,
    conteudo_hipocondrias: d.conteudo_hipocondrias ?? false,
    conteudo_fobias: d.conteudo_fobias ?? false,
    conteudo_delirios: d.conteudo_delirios ?? false,
    expansao_eu_opcoes: d.expansao_eu_opcoes ?? null,
    retracao_eu_opcoes: d.retracao_eu_opcoes ?? null,
    negacao_eu_opcoes: d.negacao_eu_opcoes ?? null,
    linguagem_disturbios: d.linguagem_disturbios ?? null,
    afetividade: d.afetividade ?? null,
    humor_opcoes: d.humor_opcoes ?? null,
    consciencia_doenca: d.consciencia_doenca ?? null,
    observacao_linguagem_nao_verbal: d.observacao_linguagem_nao_verbal ?? null,
    observacoes_finais: d.observacoes_finais ?? null,
  };
}

function buildAnamneseCrianca(d: AnamneseCriancaDto) {
  return {
    data_atendimento: toDate(d.data_atendimento),
    profissional: d.profissional ?? null,
    nome: d.nome ?? null,
    idade: d.idade ?? null,
    sexo: d.sexo ?? null,
    responsavel: d.responsavel ?? null,
    queixa_principal: d.queixa_principal ?? null,
    observacoes: d.observacoes ?? null,
    dados_json: d.dados_json ?? null,
  };
}

function buildFisioterapia(d: FisioterapiaDto) {
  return {
    nome: d.nome ?? null,
    idade: d.idade ?? null,
    sexo: d.sexo ?? null,
    ocupacao: d.ocupacao ?? null,
    cpf: d.cpf ?? null,
    rg: d.rg ?? null,
    contato: d.contato ?? null,
    caso_clinico: d.caso_clinico ?? null,
    historico_medico: d.historico_medico ?? null,
    usa_medicamento: d.usa_medicamento ?? null,
    medicamentos_lista: d.medicamentos_lista ?? null,
    sv_fc: d.sv_fc ?? null,
    sv_fr: d.sv_fr ?? null,
    sv_pa: d.sv_pa ?? null,
    apresentacao_paciente: d.apresentacao_paciente ?? null,
    inspecao_palpacao: d.inspecao_palpacao ?? null,
    exames_complementares: d.exames_complementares ?? null,
    exames_complementares_obs: d.exames_complementares_obs ?? null,
    protese_ortese: d.protese_ortese ?? null,
    protese_ortese_obs: d.protese_ortese_obs ?? null,
    limitacao_movimento: d.limitacao_movimento ?? null,
    limitacao_movimento_obs: d.limitacao_movimento_obs ?? null,
    equilibrio_coordenacao: d.equilibrio_coordenacao ?? null,
    queixa_principal: d.queixa_principal ?? null,
    historia_clinica: d.historia_clinica ?? null,
    demais_observacoes: d.demais_observacoes ?? null,
    dor_intensidade: d.dor_intensidade ?? 0,
    objetivo_tratamento: d.objetivo_tratamento ?? null,
    recursos_terapeuticos: d.recursos_terapeuticos ?? null,
    anotacoes_gerais: d.anotacoes_gerais ?? null,
    data_assinatura: toDate(d.data_assinatura),
    assinatura: d.assinatura ?? null,
  };
}

function buildAcupuntura(d: AcupunturaDto) {
  return {
    data_atendimento: toDate(d.data_atendimento),
    nome: d.nome ?? null,
    profissional: d.profissional ?? null,
    queixa_principal: d.queixa_principal ?? null,
    observacoes_clinicas: d.observacoes_clinicas ?? null,
    data_assinatura: toDate(d.data_assinatura),
  };
}
