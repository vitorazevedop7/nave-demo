import { randomUUID } from 'node:crypto';
import { AppE2E, como, criarApp, login, prismaDe } from './support/app';
import { BaseE2E, ChaveUsuario, EMAILS, semearBase } from './support/fixtures';

type Metodo = 'get' | 'post' | 'patch' | 'delete';

describe('Autorização por perfil (e2e)', () => {
  let app: AppE2E;
  let base: BaseE2E;
  const tokens = {} as Record<ChaveUsuario, string>;

  beforeAll(async () => {
    app = await criarApp();
    base = await semearBase(prismaDe(app));
    for (const chave of ['gestora', 'triadora', 'psi', 'fisio'] as const) {
      tokens[chave] = await login(app, EMAILS[chave]);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  const negados: [ChaveUsuario, Metodo, string][] = [
    ['triadora', 'get', '/prontuarios'],
    ['triadora', 'get', '/prontuarios/meus'],
    ['triadora', 'get', '/usuarios/compartilhaveis'],
    ['triadora', 'get', '/doacoes'],
    ['triadora', 'get', '/doadores'],
    ['triadora', 'get', '/usuarios'],
    ['psi', 'get', '/beneficiarias'],
    ['psi', 'get', '/usuarios'],
    ['psi', 'get', '/triagens'],
    ['psi', 'get', '/encaminhamentos/pendentes'],
    ['psi', 'get', '/doacoes'],
    ['psi', 'get', '/doadores'],
    ['psi', 'get', '/agendamentos'],
    ['psi', 'get', '/campanhas-doacoes'],
    ['psi', 'get', '/bazares'],
    ['psi', 'post', '/campanhas-doacoes'],
    ['gestora', 'get', '/agendamentos/meus'],
  ];

  it.each(negados)('%s → %s %s responde 403', async (perfil, metodo, url) => {
    await como(app, tokens[perfil])[metodo](url).send({}).expect(403);
  });

  it('PROFISSIONAL não exclui agendamento (403), nem o próprio', async () => {
    await como(app, tokens.psi)
      .delete(`/agendamentos/${base.agendamentoLivre.id}`)
      .expect(403);
  });

  const permitidos: [ChaveUsuario, string][] = [
    ['gestora', '/beneficiarias'],
    ['gestora', '/usuarios'],
    ['gestora', '/doacoes'],
    ['gestora', '/doadores'],
    ['gestora', '/prontuarios'],
    ['gestora', '/dashboard/stats'],
    ['triadora', '/beneficiarias'],
    ['triadora', '/triagens'],
    ['triadora', '/usuarios/profissionais'],
    ['triadora', '/dashboard/stats?period=mes'],
    ['psi', '/prontuarios'],
    ['psi', '/agendamentos/meus'],
    ['psi', '/beneficiarias/buscar?busca=E2E'],
    ['psi', '/usuarios/compartilhaveis'],
    ['psi', '/dashboard/stats?period=hoje'],
  ];

  it.each(permitidos)('%s → GET %s responde 200', async (perfil, url) => {
    await como(app, tokens[perfil]).get(url).expect(200);
  });

  it.each(['/beneficiarias', '/prontuarios', '/usuarios', '/dashboard/stats'])(
    'sem token → GET %s responde 401',
    async (url) => {
      await como(app).get(url).expect(401);
    },
  );

  describe('minimização de dados', () => {
    it('busca de beneficiárias não expõe CPF a PROFISSIONAL', async () => {
      const resposta = await como(app, tokens.psi)
        .get('/beneficiarias/buscar?busca=Alfa')
        .expect(200);

      expect(resposta.body).toEqual([
        { id: base.beneficiaria.id, nome: 'Beneficiária E2E Alfa' },
      ]);
    });

    it('busca de beneficiárias mantém o CPF para TRIADORA', async () => {
      const resposta = await como(app, tokens.triadora)
        .get('/beneficiarias/buscar?busca=Alfa')
        .expect(200);

      expect(resposta.body).toEqual([
        {
          id: base.beneficiaria.id,
          nome: 'Beneficiária E2E Alfa',
          cpf: '12345678901',
        },
      ]);
    });

    it('lista de usuários nunca expõe senha_hash', async () => {
      const resposta = await como(app, tokens.gestora)
        .get('/usuarios')
        .expect(200);

      expect(JSON.stringify(resposta.body)).not.toContain('senha');
    });
  });

  describe('validação de parâmetros e erros', () => {
    it('id que não é UUID responde 400 com mensagem clara', async () => {
      const resposta = await como(app, tokens.gestora)
        .get('/beneficiarias/nao-e-uuid')
        .expect(400);

      expect(resposta.body).toMatchObject({
        message: 'Identificador inválido: UUID esperado.',
      });
    });

    it.each([
      '/prontuarios/123',
      '/usuarios/abc',
      '/triagens/1',
      '/agendamentos/x',
      '/prontuarios/beneficiaria/x',
    ])('GET %s responde 400', async (url) => {
      const token = url.startsWith('/prontuarios')
        ? tokens.psi
        : url.startsWith('/triagens')
          ? tokens.triadora
          : tokens.gestora;
      await como(app, token).get(url).expect(400);
    });

    it('query de UUID opcional também é validada', async () => {
      await como(app, tokens.triadora)
        .get('/triagens?beneficiaria_id=nao-e-uuid')
        .expect(400);
    });

    it('período inválido do dashboard responde 400', async () => {
      await como(app, tokens.gestora)
        .get('/dashboard/stats?period=ano')
        .expect(400);
    });

    it('registro inexistente responde 404 em leitura', async () => {
      await como(app, tokens.gestora)
        .get(`/beneficiarias/${randomUUID()}`)
        .expect(404);
    });

    it('registro inexistente responde 404 em escrita (P2025 traduzido)', async () => {
      const resposta = await como(app, tokens.gestora)
        .patch(`/beneficiarias/${randomUUID()}`)
        .send({ nome: 'Fantasma' })
        .expect(404);

      expect(resposta.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: 'Registro não encontrado.',
      });
    });

    it('CPF duplicado responde 409 sem vazar detalhes do banco', async () => {
      const resposta = await como(app, tokens.triadora)
        .post('/beneficiarias')
        .send({ nome: 'Outra pessoa', cpf: '12345678901' })
        .expect(409);

      expect(resposta.body).toEqual({
        statusCode: 409,
        error: 'Conflict',
        message: 'Já existe uma beneficiária com este CPF.',
      });
    });
  });

  describe('regras de negócio sensíveis', () => {
    it('triagem registra a triadora autenticada, não um id enviado', async () => {
      const resposta = await como(app, tokens.triadora)
        .post('/triagens')
        .send({ beneficiaria_id: base.outraBeneficiaria.id })
        .expect(201);

      expect(resposta.body).toMatchObject({
        triador_id: base.usuarios.triadora.id,
      });
    });

    it('triagem com triador_id no corpo é rejeitada (400)', async () => {
      await como(app, tokens.triadora)
        .post('/triagens')
        .send({
          beneficiaria_id: base.outraBeneficiaria.id,
          triador_id: base.usuarios.gestora.id,
        })
        .expect(400);
    });

    it('cadastro de usuário rejeita perfil inexistente (400)', async () => {
      await como(app, tokens.gestora)
        .post('/usuarios')
        .send({
          nome: 'Novo',
          email: 'novo@e2e.test',
          senha: 'segredo123',
          perfis: ['ADMIN'],
        })
        .expect(400);
    });

    it('gestora não pode desativar nem remover a própria conta (400)', async () => {
      const id = base.usuarios.gestora.id;

      await como(app, tokens.gestora)
        .patch(`/usuarios/${id}`)
        .send({ ativo: false })
        .expect(400);
      await como(app, tokens.gestora).delete(`/usuarios/${id}`).expect(400);
      await como(app, tokens.gestora).get('/auth/me').expect(200);
    });
  });
});
