import { VisibilidadeProntuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { limparBase } from '../../src/prisma/limpar-base';
import type { PrismaService } from '../../src/prisma/prisma.service';

/** Senha de todos os usuários de teste. Custo baixo do bcrypt: só acelera os testes. */
export const SENHA_E2E = 'senha-e2e-123';
const HASH_E2E = bcrypt.hashSync(SENHA_E2E, 4);

export const EMAILS = {
  gestora: 'gestora@e2e.test',
  triadora: 'triadora@e2e.test',
  psi: 'psi@e2e.test',
  psi2: 'psi2@e2e.test',
  fisio: 'fisio@e2e.test',
  inativo: 'inativo@e2e.test',
} as const;

export type ChaveUsuario = keyof typeof EMAILS;

/**
 * Base mínima e determinística para os testes e2e. Apaga tudo antes de criar,
 * então cada suíte pode chamá-la no `beforeAll` e rodar quantas vezes quiser
 * contra o mesmo banco.
 *
 * Prontuários (todos de autoria de `psi`, especialidade PSICOLOGIA):
 * um por nível de visibilidade + um PRIVADO compartilhado com `fisio`.
 */
export async function semearBase(prisma: PrismaService) {
  await limparBase(prisma);

  const criarUsuario = (
    chave: ChaveUsuario,
    perfis: string[],
    extra: { especialidade?: string; ativo?: boolean } = {},
  ) =>
    prisma.usuarios.create({
      data: {
        nome: `Usuário ${chave}`,
        email: EMAILS[chave],
        senha_hash: HASH_E2E,
        especialidade: extra.especialidade ?? null,
        ativo: extra.ativo ?? true,
        perfis_usuario: { create: perfis.map((perfil) => ({ perfil })) },
      },
    });

  const usuarios = {
    gestora: await criarUsuario('gestora', ['GESTORA']),
    triadora: await criarUsuario('triadora', ['TRIADORA']),
    psi: await criarUsuario('psi', ['PROFISSIONAL'], {
      especialidade: 'PSICOLOGIA',
    }),
    psi2: await criarUsuario('psi2', ['PROFISSIONAL'], {
      especialidade: 'PSICOLOGIA',
    }),
    fisio: await criarUsuario('fisio', ['PROFISSIONAL'], {
      especialidade: 'FISIOTERAPIA',
    }),
    inativo: await criarUsuario('inativo', ['PROFISSIONAL'], {
      especialidade: 'PSICOLOGIA',
      ativo: false,
    }),
  };

  const beneficiaria = await prisma.beneficiarias.create({
    data: {
      nome: 'Beneficiária E2E Alfa',
      cpf: '12345678901',
      tipo: 'ADULTA',
      status: 'ATIVA',
    },
  });
  const outraBeneficiaria = await prisma.beneficiarias.create({
    data: { nome: 'Beneficiária E2E Beta', tipo: 'ADULTA', status: 'ATIVA' },
  });

  let proximoDia = 0;
  const criarAgendamento = (dias = proximoDia++) =>
    prisma.agendamentos.create({
      data: {
        beneficiaria_id: beneficiaria.id,
        profissional_id: usuarios.psi.id,
        data_hora: new Date(Date.UTC(2026, 0, 10 + dias, 13)),
        status: 'REALIZADO',
      },
    });

  const criarProntuario = async (
    visibilidade: VisibilidadeProntuario,
    compartilharCom: string[] = [],
  ) =>
    prisma.prontuarios.create({
      data: {
        beneficiaria_id: beneficiaria.id,
        profissional_id: usuarios.psi.id,
        agendamento_id: (await criarAgendamento()).id,
        especialidade: 'PSICOLOGIA',
        descricao: `Evolução clínica sigilosa (${visibilidade})`,
        visibilidade,
        prontuarios_psicologia_adulto: {
          create: { queixa_principal: 'Queixa clínica sigilosa' },
        },
        prontuario_compartilhamentos: {
          create: compartilharCom.map((usuario_id) => ({ usuario_id })),
        },
      },
    });

  const prontuarios = {
    privado: await criarProntuario(VisibilidadeProntuario.PRIVADO),
    especialidade: await criarProntuario(VisibilidadeProntuario.ESPECIALIDADE),
    gestoras: await criarProntuario(VisibilidadeProntuario.GESTORAS),
    equipeClinica: await criarProntuario(VisibilidadeProntuario.EQUIPE_CLINICA),
    privadoCompartilhado: await criarProntuario(
      VisibilidadeProntuario.PRIVADO,
      [usuarios.fisio.id],
    ),
  };

  const agendamentoLivre = await criarAgendamento();

  return {
    usuarios,
    beneficiaria,
    outraBeneficiaria,
    prontuarios,
    agendamentoLivre,
  };
}

export type BaseE2E = Awaited<ReturnType<typeof semearBase>>;

/** Campos que só podem aparecer num prontuário com acesso liberado. */
export const CAMPOS_CLINICOS = [
  'descricao',
  'prontuarios_psicologia_adulto',
  'prontuarios_psicologia_crianca',
  'prontuarios_fisioterapia',
  'prontuarios_acupuntura',
  'beneficiaria_id',
  'compartilhamentos',
] as const;
