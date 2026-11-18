import { AppE2E, como, criarApp, login, prismaDe } from './support/app';
import {
  BaseE2E,
  CAMPOS_CLINICOS,
  ChaveUsuario,
  EMAILS,
  semearBase,
} from './support/fixtures';

type Prontuario = keyof BaseE2E['prontuarios'];
type Acesso = 'completo' | 'carimbo' | 'oculto';
type Leitor = 'psi' | 'gestora' | 'psi2' | 'fisio';

/**
 * Matriz de visibilidade. Todos os prontuários são de `psi` (PSICOLOGIA).
 * - completo: 200 com conteúdo clínico
 * - carimbo: 200 só com id/data/profissional/especialidade (gestora vê que
 *   existe, mas não o conteúdo)
 * - oculto: 404 — para quem não pode ver, o registro não existe
 */
const MATRIZ: Record<Prontuario, Record<Leitor, Acesso>> = {
  privado: {
    psi: 'completo',
    gestora: 'carimbo',
    psi2: 'oculto',
    fisio: 'oculto',
  },
  especialidade: {
    psi: 'completo',
    gestora: 'carimbo',
    psi2: 'completo',
    fisio: 'oculto',
  },
  gestoras: {
    psi: 'completo',
    gestora: 'completo',
    psi2: 'oculto',
    fisio: 'oculto',
  },
  equipeClinica: {
    psi: 'completo',
    gestora: 'completo',
    psi2: 'completo',
    fisio: 'completo',
  },
  privadoCompartilhado: {
    psi: 'completo',
    gestora: 'carimbo',
    psi2: 'oculto',
    fisio: 'completo',
  },
};

const CASOS = Object.entries(MATRIZ).flatMap(([prontuario, acessos]) =>
  Object.entries(acessos).map(
    ([leitor, acesso]) =>
      [prontuario as Prontuario, leitor as Leitor, acesso] as const,
  ),
);

describe('Prontuários (e2e)', () => {
  let app: AppE2E;
  let base: BaseE2E;
  const tokens = {} as Record<ChaveUsuario, string>;

  beforeAll(async () => {
    app = await criarApp();
    base = await semearBase(prismaDe(app));
    for (const chave of [
      'gestora',
      'triadora',
      'psi',
      'psi2',
      'fisio',
    ] as const) {
      tokens[chave] = await login(app, EMAILS[chave]);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('matriz de visibilidade em GET /prontuarios/:id', () => {
    it.each(CASOS)(
      '%s lido por %s → %s',
      async (prontuario, leitor, acesso) => {
        const id = base.prontuarios[prontuario].id;
        const resposta = await como(app, tokens[leitor]).get(
          `/prontuarios/${id}`,
        );

        if (acesso === 'oculto') {
          expect(resposta.status).toBe(404);
          return;
        }

        expect(resposta.status).toBe(200);
        const corpo = resposta.body as Record<string, unknown>;

        if (acesso === 'carimbo') {
          expect(corpo).toEqual({
            id,
            data: expect.any(String) as unknown,
            profissional: 'Usuário psi',
            especialidade: 'PSICOLOGIA',
            conteudo_restrito: true,
          });
          for (const campo of CAMPOS_CLINICOS) {
            expect(corpo).not.toHaveProperty(campo);
          }
          return;
        }

        expect(corpo).toMatchObject({
          id,
          descricao: expect.stringContaining('sigilosa') as unknown,
          prontuarios_psicologia_adulto: {
            queixa_principal: 'Queixa clínica sigilosa',
          },
          autor: 'Usuário psi',
        });
        expect(corpo).not.toHaveProperty('conteudo_restrito');
      },
    );
  });

  it('TRIADORA não acessa prontuário algum, nem por id (403)', async () => {
    await como(app, tokens.triadora)
      .get(`/prontuarios/${base.prontuarios.equipeClinica.id}`)
      .expect(403);
  });

  it('a lista por beneficiária aplica a mesma matriz', async () => {
    const url = `/prontuarios/beneficiaria/${base.beneficiaria.id}`;
    const ids = async (leitor: Leitor) =>
      (
        (await como(app, tokens[leitor]).get(url).expect(200)).body as {
          id: string;
          conteudo_restrito?: boolean;
        }[]
      ).map(({ id, conteudo_restrito }) => ({ id, conteudo_restrito }));

    const visiveis = (leitor: Leitor) =>
      CASOS.filter(([, l, acesso]) => l === leitor && acesso !== 'oculto')
        .map(([prontuario, , acesso]) => ({
          id: base.prontuarios[prontuario].id,
          conteudo_restrito: acesso === 'carimbo' ? true : undefined,
        }))
        .sort((a, b) => a.id.localeCompare(b.id));

    for (const leitor of ['psi', 'gestora', 'psi2', 'fisio'] as const) {
      const recebidos = (await ids(leitor)).sort((a, b) =>
        a.id.localeCompare(b.id),
      );
      expect(recebidos).toEqual(visiveis(leitor));
    }
  });

  it('só o autor vê a lista de compartilhamentos', async () => {
    const id = base.prontuarios.privadoCompartilhado.id;

    const autor = await como(app, tokens.psi).get(`/prontuarios/${id}`);
    const destinatario = await como(app, tokens.fisio).get(
      `/prontuarios/${id}`,
    );

    expect(autor.body).toMatchObject({
      compartilhamentos: [base.usuarios.fisio.id],
    });
    expect(destinatario.body).not.toHaveProperty('compartilhamentos');
  });

  it('"outros prontuários" lista o que o profissional pode ler, com a origem do acesso', async () => {
    const resposta = await como(app, tokens.fisio)
      .get('/prontuarios/outros')
      .expect(200);

    const porId = new Map(
      (resposta.body as { id: string; origem_acesso: string }[]).map((p) => [
        p.id,
        p.origem_acesso,
      ]),
    );
    expect(porId.get(base.prontuarios.privadoCompartilhado.id)).toBe(
      'COMPARTILHADO_COM_VOCE',
    );
    expect(porId.get(base.prontuarios.equipeClinica.id)).toBe('EQUIPE_CLINICA');
    expect(porId.has(base.prontuarios.privado.id)).toBe(false);
    expect(porId.has(base.prontuarios.especialidade.id)).toBe(false);
    expect(porId.has(base.prontuarios.gestoras.id)).toBe(false);
  });

  describe('autoria', () => {
    it.each(['gestora', 'fisio', 'psi2'] as const)(
      'PATCH de não autor (%s) responde 403, mesmo com compartilhamento',
      async (leitor) => {
        await como(app, tokens[leitor])
          .patch(`/prontuarios/${base.prontuarios.privadoCompartilhado.id}`)
          .send({ descricao: 'alteração indevida' })
          .expect(403);
      },
    );

    it.each(['gestora', 'fisio'] as const)(
      'DELETE de não autor (%s) responde 403, mesmo com compartilhamento',
      async (leitor) => {
        await como(app, tokens[leitor])
          .delete(`/prontuarios/${base.prontuarios.privadoCompartilhado.id}`)
          .expect(403);
      },
    );

    it('PATCH não aceita trocar beneficiária, agendamento ou autor (400)', async () => {
      const id = base.prontuarios.privado.id;
      for (const campo of [
        { beneficiaria_id: base.outraBeneficiaria.id },
        { agendamento_id: base.agendamentoLivre.id },
        { profissional_id: base.usuarios.psi2.id },
      ]) {
        await como(app, tokens.psi)
          .patch(`/prontuarios/${id}`)
          .send(campo)
          .expect(400);
      }
    });

    it('autor atualiza conteúdo e visibilidade', async () => {
      const id = base.prontuarios.privado.id;

      await como(app, tokens.psi)
        .patch(`/prontuarios/${id}`)
        .send({ descricao: 'Nova evolução', visibilidade: 'ESPECIALIDADE' })
        .expect(200);

      const lido = await como(app, tokens.psi2)
        .get(`/prontuarios/${id}`)
        .expect(200);
      expect(lido.body).toMatchObject({ descricao: 'Nova evolução' });

      await como(app, tokens.psi)
        .patch(`/prontuarios/${id}`)
        .send({ visibilidade: 'PRIVADO' })
        .expect(200);
      await como(app, tokens.psi2).get(`/prontuarios/${id}`).expect(404);
    });
  });

  describe('compartilhamento', () => {
    it.each([
      ['TRIADORA', 'triadora'],
      ['usuário desativado', 'inativo'],
    ] as const)(
      'rejeita compartilhar com %s (400)',
      async (_descricao, chave) => {
        await como(app, tokens.psi)
          .patch(`/prontuarios/${base.prontuarios.privado.id}`)
          .send({ compartilhamentos: [base.usuarios[chave].id] })
          .expect(400);
      },
    );

    it('rejeita compartilhar com usuário inexistente (400)', async () => {
      await como(app, tokens.psi)
        .patch(`/prontuarios/${base.prontuarios.privado.id}`)
        .send({ compartilhamentos: ['3f0f1c4e-1b2a-4c3d-8e9f-0a1b2c3d4e5f'] })
        .expect(400);
    });

    it('aceita compartilhar com profissional ativo e libera a leitura', async () => {
      const id = base.prontuarios.privado.id;
      await como(app, tokens.psi2).get(`/prontuarios/${id}`).expect(404);

      await como(app, tokens.psi)
        .patch(`/prontuarios/${id}`)
        .send({ compartilhamentos: [base.usuarios.psi2.id] })
        .expect(200);

      await como(app, tokens.psi2).get(`/prontuarios/${id}`).expect(200);
    });
  });

  describe('criação', () => {
    it('cria prontuário do agendamento com autor e especialidade do token', async () => {
      const resposta = await como(app, tokens.psi)
        .post('/prontuarios')
        .send({
          beneficiaria_id: base.beneficiaria.id,
          agendamento_id: base.agendamentoLivre.id,
          descricao: 'Primeiro atendimento',
          visibilidade: 'EQUIPE_CLINICA',
          psicologia_adulto: { queixa_principal: 'Ansiedade' },
        })
        .expect(201);

      expect(resposta.body).toMatchObject({
        profissional_id: base.usuarios.psi.id,
        especialidade: 'PSICOLOGIA',
        agendamento_id: base.agendamentoLivre.id,
      });
    });

    it('rejeita profissional_id no corpo (400)', async () => {
      await como(app, tokens.psi)
        .post('/prontuarios')
        .send({
          beneficiaria_id: base.beneficiaria.id,
          profissional_id: base.usuarios.psi2.id,
        })
        .expect(400);
    });

    it('não cria prontuário em agendamento de outro profissional (403)', async () => {
      await como(app, tokens.psi2)
        .post('/prontuarios')
        .send({
          beneficiaria_id: base.beneficiaria.id,
          agendamento_id: base.agendamentoLivre.id,
        })
        .expect(403);
    });
  });

  describe('exclusão (soft delete)', () => {
    it('some de todas as leituras, permanece no banco e libera o agendamento', async () => {
      const prontuario = base.prontuarios.gestoras;
      const agendamentoId = prontuario.agendamento_id!;

      await como(app, tokens.psi)
        .delete(`/prontuarios/${prontuario.id}`)
        .expect(204);

      await como(app, tokens.psi)
        .get(`/prontuarios/${prontuario.id}`)
        .expect(404);
      await como(app, tokens.gestora)
        .get(`/prontuarios/${prontuario.id}`)
        .expect(404);
      const lista = await como(app, tokens.gestora)
        .get('/prontuarios')
        .expect(200);
      expect(
        (lista.body as { id: string }[]).map(({ id }) => id),
      ).not.toContain(prontuario.id);
      const doAgendamento = await como(app, tokens.psi)
        .get(`/prontuarios/agendamento/${agendamentoId}`)
        .expect(200);
      expect(doAgendamento.body).toEqual({ estado: 'AUSENTE' });

      const noBanco = await prismaDe(app).prontuarios.findUnique({
        where: { id: prontuario.id },
      });
      expect(noBanco?.deletado_em).toBeInstanceOf(Date);
      expect(noBanco?.descricao).toBe(prontuario.descricao);

      await como(app, tokens.psi)
        .delete(`/prontuarios/${prontuario.id}`)
        .expect(404);
      await como(app, tokens.psi)
        .post('/prontuarios')
        .send({
          beneficiaria_id: base.beneficiaria.id,
          agendamento_id: agendamentoId,
        })
        .expect(201);
    });
  });
});
