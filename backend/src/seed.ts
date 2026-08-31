/**
 * DADOS EXCLUSIVAMENTE FICTÍCIOS.
 *
 * Todos os nomes, documentos, contatos, atendimentos e valores deste arquivo
 * foram inventados para demonstração. Nenhum registro representa uma pessoa
 * ou uma operação real da organização.
 */
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import {
  Prisma,
  PrismaClient,
  VisibilidadeProntuario,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<
  typeof PrismaClient
>[0]);

// Credencial pública e intencional do ambiente de demonstração.
// Nunca reutilize esta senha fora de uma instalação local da demo.
const DEMO_PASSWORD = 'NaveDemo@2026';

const agora = new Date();
const dataRelativa = (dias: number, hora = 10, minuto = 0) => {
  const data = new Date(agora);
  data.setDate(data.getDate() + dias);
  data.setHours(hora, minuto, 0, 0);
  return data;
};
const mesRelativo = (meses: number) =>
  new Date(agora.getFullYear(), agora.getMonth() + meses, 10, 12);

async function limparBase(db: Prisma.TransactionClient) {
  await db.prontuario_compartilhamentos.deleteMany({});
  await db.prontuarios_acupuntura.deleteMany({});
  await db.prontuarios_fisioterapia.deleteMany({});
  await db.prontuarios_psicologia_adulto.deleteMany({});
  await db.prontuarios_psicologia_crianca.deleteMany({});
  await db.prontuarios.deleteMany({});
  await db.agendamentos.deleteMany({});
  await db.queixas.deleteMany({});
  await db.encaminhamentos.deleteMany({});
  await db.triagens.deleteMany({});
  await db.doacoes.deleteMany({});
  await db.campanhas_doacoes.deleteMany({});
  await db.bazar_profissionais.deleteMany({});
  await db.bazares.deleteMany({});
  await db.doadores.deleteMany({});
  await db.perfis_usuario.deleteMany({});
  await db.beneficiarias.updateMany({ data: { responsavel_id: null } });
  await db.beneficiarias.deleteMany({});
  await db.usuarios.deleteMany({});
}

async function seedDemo(db: Prisma.TransactionClient) {
  console.log('🌱 Iniciando seed fictício de demonstração...');
  await limparBase(db);

  const senhaHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const gestora = await db.usuarios.create({
    data: {
      nome: 'Gestora Demo Aurora',
      email: 'gestora.demo@example.com',
      senha_hash: senhaHash,
      ativo: true,
      perfis_usuario: { create: [{ perfil: 'GESTORA' }] },
    },
  });
  const triadora = await db.usuarios.create({
    data: {
      nome: 'Triadora Demo Estrela',
      email: 'triadora.demo@example.com',
      senha_hash: senhaHash,
      ativo: true,
      perfis_usuario: { create: [{ perfil: 'TRIADORA' }] },
    },
  });
  const profissionalPsi = await db.usuarios.create({
    data: {
      nome: 'Profissional Demo Brisa',
      email: 'profissional.psi.demo@example.com',
      senha_hash: senhaHash,
      especialidade: 'PSICOLOGIA',
      ativo: true,
      perfis_usuario: { create: [{ perfil: 'PROFISSIONAL' }] },
    },
  });
  const profissionalSocial = await db.usuarios.create({
    data: {
      nome: 'Profissional Demo Cais',
      email: 'profissional.social.demo@example.com',
      senha_hash: senhaHash,
      especialidade: 'ASSISTENCIA_SOCIAL',
      ativo: true,
      perfis_usuario: { create: [{ perfil: 'PROFISSIONAL' }] },
    },
  });
  const profissionalFisio = await db.usuarios.create({
    data: {
      nome: 'Profissional Demo Duna',
      email: 'profissional.fisio.demo@example.com',
      senha_hash: senhaHash,
      especialidade: 'FISIOTERAPIA',
      ativo: true,
      perfis_usuario: { create: [{ perfil: 'PROFISSIONAL' }] },
    },
  });

  // Sequências repetidas são rejeitadas por validadores de CPF.
  const pessoasDemo = [
    ['Pessoa Demo Alfa', '000.000.000-00', '(00) 90000-0001', 'ATIVA'],
    ['Pessoa Demo Beta', '111.111.111-11', '(00) 90000-0002', 'ATIVA'],
    ['Pessoa Demo Gama', '222.222.222-22', '(00) 90000-0003', 'ATIVA'],
    ['Pessoa Demo Delta', '333.333.333-33', '(00) 90000-0004', 'ATIVA'],
    ['Pessoa Demo Épsilon', '444.444.444-44', '(00) 90000-0005', 'ATIVA'],
    ['Pessoa Demo Zeta', '555.555.555-55', '(00) 90000-0006', 'ATIVA'],
    ['Pessoa Demo Eta', '666.666.666-66', '(00) 90000-0007', 'EM_ESPERA'],
    ['Pessoa Demo Teta', '777.777.777-77', '(00) 90000-0008', 'EM_ESPERA'],
    ['Pessoa Demo Iota', '888.888.888-88', '(00) 90000-0009', 'EM_ESPERA'],
    ['Pessoa Demo Kappa', '999.999.999-99', '(00) 90000-0010', 'ENCERRADA'],
  ] as const;

  const beneficiarias: { id: string }[] = [];
  for (const [indice, [nome, cpf, telefone, status]] of pessoasDemo.entries()) {
    beneficiarias.push(
      await db.beneficiarias.create({
        data: {
          nome,
          cpf,
          telefone,
          data_nascimento: new Date(1980 + indice, indice % 12, 10 + indice),
          tipo: 'ADULTA',
          status,
          raca: 'não informado - demo',
          estado_civil: 'não informado - demo',
          escolaridade: 'não informado - demo',
          ocupacao: 'ocupação fictícia de demonstração',
          empregada: indice % 2 === 0,
        },
      }),
    );
  }

  const especialidades = [
    'PSICOLOGIA',
    'ASSISTENCIA_SOCIAL',
    'FISIOTERAPIA',
    'PSICOLOGIA',
    'ASSISTENCIA_SOCIAL',
    'FISIOTERAPIA',
  ] as const;
  const encaminhamentos: { id: string }[] = [];
  for (let indice = 0; indice < especialidades.length; indice++) {
    const triagem = await db.triagens.create({
      data: {
        beneficiaria_id: beneficiarias[indice].id,
        triador_id: triadora.id,
        data_triagem: dataRelativa(-indice, 9 + (indice % 3)),
        criado_em: dataRelativa(-indice, 9 + (indice % 3)),
        queixas: {
          create: {
            queixa_principal:
              'Solicitação fictícia de orientação sobre os serviços disponíveis.',
            queixa_secundaria:
              'Registro genérico criado exclusivamente para demonstração.',
            tipo_violencia: null,
            observacoes: 'Sem informações clínicas reais.',
          },
        },
      },
    });
    encaminhamentos.push(
      await db.encaminhamentos.create({
        data: {
          triagem_id: triagem.id,
          especialidade: especialidades[indice],
          status: indice < 4 ? 'PENDENTE' : 'AGENDADO',
        },
      }),
    );
  }

  const profissionais = {
    PSICOLOGIA: profissionalPsi,
    ASSISTENCIA_SOCIAL: profissionalSocial,
    FISIOTERAPIA: profissionalFisio,
  };
  const agenda = [
    [0, 9, 0, 'CONFIRMADO'],
    [0, 11, 0, 'AGENDADO'],
    [0, 14, 30, 'CONFIRMADO'],
    [1, 9, 30, 'AGENDADO'],
    [2, 10, 0, 'CONFIRMADO'],
    [3, 14, 0, 'AGENDADO'],
    [5, 15, 30, 'AGENDADO'],
    [-1, 9, 0, 'REALIZADO'],
    [-2, 10, 30, 'REALIZADO'],
    [-3, 14, 0, 'REALIZADO'],
    [-5, 15, 0, 'REALIZADO'],
    [-8, 11, 0, 'REALIZADO'],
    [-4, 16, 0, 'CANCELADO'],
    [-12, 9, 30, 'CANCELADO'],
    [0, 8, 0, 'REALIZADO'],
    [0, 16, 30, 'CANCELADO'],
  ] as const;

  const agendamentos: { id: string }[] = [];
  for (const [indice, [dias, hora, minuto, status]] of agenda.entries()) {
    const especialidade = especialidades[indice % especialidades.length];
    agendamentos.push(
      await db.agendamentos.create({
        data: {
          beneficiaria_id: beneficiarias[indice % beneficiarias.length].id,
          profissional_id: profissionais[especialidade].id,
          encaminhamento_id:
            indice < encaminhamentos.length ? encaminhamentos[indice].id : null,
          data_hora: dataRelativa(dias, hora, minuto),
          status,
          observacoes: 'Agendamento fictício para demonstração da agenda.',
        },
      }),
    );
  }

  const prontuariosDemo = [
    [0, profissionalPsi, VisibilidadeProntuario.PRIVADO],
    [1, profissionalPsi, VisibilidadeProntuario.ESPECIALIDADE],
    [2, profissionalSocial, VisibilidadeProntuario.GESTORAS],
    [3, profissionalFisio, VisibilidadeProntuario.EQUIPE_CLINICA],
  ] as const;
  for (const [indice, profissional, visibilidade] of prontuariosDemo) {
    await db.prontuarios.create({
      data: {
        beneficiaria_id: beneficiarias[indice].id,
        profissional_id: profissional.id,
        agendamento_id: agendamentos[7 + indice].id,
        especialidade: profissional.especialidade!,
        descricao:
          'Registro fictício e genérico para demonstrar regras de visibilidade.',
        visibilidade,
        ...(indice === 0 && {
          prontuario_compartilhamentos: {
            create: [{ usuario_id: profissionalSocial.id }],
          },
        }),
      },
    });
  }

  const doadorPessoa = await db.doadores.create({
    data: {
      nome: 'Doador Demo Aurora',
      tipo: 'PESSOA_FISICA',
      telefone: '(00) 90000-0101',
      email: 'doador.aurora@example.com',
      registrado_por: gestora.id,
    },
  });
  const doadorEmpresa = await db.doadores.create({
    data: {
      nome: 'Empresa Demo Horizonte',
      tipo: 'PESSOA_JURIDICA',
      telefone: '(00) 90000-0102',
      email: 'empresa.horizonte@example.com',
      registrado_por: gestora.id,
    },
  });
  const campanha = await db.campanhas_doacoes.create({
    data: {
      nome: 'Campanha Fictícia de Demonstração',
      descricao: 'Campanha sem arrecadação real.',
      meta_valor: 5000,
    },
  });
  for (let mes = -5; mes <= 0; mes++) {
    await db.doacoes.create({
      data: {
        doador_id: mes % 2 === 0 ? doadorPessoa.id : doadorEmpresa.id,
        campanha_id: campanha.id,
        tipo: 'DINHEIRO',
        valor: 180 + (mes + 5) * 75,
        data: mesRelativo(mes),
        criado_em: mesRelativo(mes),
        observacao: 'Doação monetária inteiramente fictícia.',
        registrado_por: gestora.id,
      },
    });
  }

  await db.bazares.createMany({
    data: [
      {
        nome: 'Bazar Demo Aurora',
        data: dataRelativa(-5),
        total_arrecadado: 640,
        local: 'Espaço fictício A',
      },
      {
        nome: 'Bazar Demo Horizonte',
        data: dataRelativa(-2),
        total_arrecadado: 915.5,
        local: 'Espaço fictício B',
      },
      {
        nome: 'Bazar Demo Estrela',
        data: dataRelativa(0),
        total_arrecadado: 780,
        local: 'Espaço fictício A',
      },
    ],
  });

  console.log('\n✅ Seed fictício concluído.');
  console.log('gestora.demo@example.com          → GESTORA');
  console.log('profissional.psi.demo@example.com → PROFISSIONAL');
  console.log('triadora.demo@example.com         → TRIADORA');
  console.log(`Senha de demonstração: ${DEMO_PASSWORD}`);
}

async function main() {
  await prisma.$transaction((db) => seedDemo(db), {
    maxWait: 10_000,
    timeout: 60_000,
  });
}

main()
  .catch((error) => {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
