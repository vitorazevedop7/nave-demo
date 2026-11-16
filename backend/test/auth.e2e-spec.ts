import request from 'supertest';
import { LOGIN_LIMITE_POR_MINUTO } from '../src/auth/auth.controller';
import { AppE2E, como, criarApp, login, prismaDe } from './support/app';
import { BaseE2E, EMAILS, SENHA_E2E, semearBase } from './support/fixtures';

describe('Autenticação (e2e)', () => {
  let app: AppE2E;
  let base: BaseE2E;

  beforeAll(async () => {
    app = await criarApp();
    base = await semearBase(prismaDe(app));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('autentica e devolve token e usuário sem hash de senha', async () => {
      const resposta = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: EMAILS.psi, senha: SENHA_E2E })
        .expect(200);

      expect(resposta.body).toEqual({
        access_token: expect.any(String) as unknown,
        usuario: {
          id: base.usuarios.psi.id,
          nome: 'Usuário psi',
          email: EMAILS.psi,
          especialidade: 'PSICOLOGIA',
          perfis: ['PROFISSIONAL'],
        },
      });
      expect(JSON.stringify(resposta.body)).not.toContain('senha');
    });

    it('recusa senha errada com 401 genérico', async () => {
      const resposta = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: EMAILS.psi, senha: 'senha-errada' })
        .expect(401);

      expect(resposta.body).toMatchObject({ message: 'Credenciais inválidas' });
    });

    it('recusa e-mail inexistente com a mesma resposta de senha errada', async () => {
      const resposta = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'ninguem@e2e.test', senha: SENHA_E2E })
        .expect(401);

      expect(resposta.body).toMatchObject({ message: 'Credenciais inválidas' });
    });

    it('recusa usuário desativado mesmo com a senha correta', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: EMAILS.inativo, senha: SENHA_E2E })
        .expect(401);
    });

    it('valida o corpo da requisição (400)', async () => {
      const resposta = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nao-e-email', senha: '1' })
        .expect(400);

      expect(resposta.body).toMatchObject({ statusCode: 400 });
    });

    it('rejeita campos não previstos no corpo (400)', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: EMAILS.psi, senha: SENHA_E2E, perfis: ['GESTORA'] })
        .expect(400);
    });
  });

  describe('token de acesso', () => {
    it('GET /auth/me devolve perfis e especialidade lidos do banco', async () => {
      const token = await login(app, EMAILS.fisio);

      const resposta = await como(app, token).get('/auth/me').expect(200);

      expect(resposta.body).toEqual({
        id: base.usuarios.fisio.id,
        nome: 'Usuário fisio',
        email: EMAILS.fisio,
        especialidade: 'FISIOTERAPIA',
        perfis: ['PROFISSIONAL'],
      });
    });

    it('recusa requisição sem token (401)', async () => {
      await como(app).get('/auth/me').expect(401);
    });

    it('recusa token adulterado (401)', async () => {
      const token = await login(app, EMAILS.psi);
      await como(app, `${token.slice(0, -2)}xx`)
        .get('/auth/me')
        .expect(401);
    });

    it('token antigo de usuário desativado deixa de valer imediatamente (401)', async () => {
      const tokenAntigo = await login(app, EMAILS.psi2);
      await como(app, tokenAntigo).get('/prontuarios').expect(200);

      const tokenGestora = await login(app, EMAILS.gestora);
      await como(app, tokenGestora)
        .patch(`/usuarios/${base.usuarios.psi2.id}`)
        .send({ ativo: false })
        .expect(200);

      await como(app, tokenAntigo).get('/prontuarios').expect(401);
      await como(app, tokenAntigo).get('/auth/me').expect(401);
    });

    it('token antigo de usuário removido deixa de valer imediatamente (401)', async () => {
      const tokenAntigo = await login(app, EMAILS.triadora);

      const tokenGestora = await login(app, EMAILS.gestora);
      await como(app, tokenGestora)
        .delete(`/usuarios/${base.usuarios.triadora.id}`)
        .expect(200);

      await como(app, tokenAntigo).get('/beneficiarias').expect(401);
    });

    it('perfil alterado vale na próxima requisição, sem novo login', async () => {
      const token = await login(app, EMAILS.fisio);
      await como(app, token).get('/beneficiarias').expect(403);

      const tokenGestora = await login(app, EMAILS.gestora);
      await como(app, tokenGestora)
        .patch(`/usuarios/${base.usuarios.fisio.id}`)
        .send({ perfis: ['PROFISSIONAL', 'TRIADORA'] })
        .expect(200);

      await como(app, token).get('/beneficiarias').expect(200);
    });
  });

  describe('limite de tentativas de login', () => {
    afterEach(() => {
      process.env.THROTTLE_DISABLED = 'true';
    });

    it(`responde 429 a partir da tentativa ${LOGIN_LIMITE_POR_MINUTO + 1} no mesmo minuto`, async () => {
      process.env.THROTTLE_DISABLED = 'false';
      const tentar = () =>
        request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'forca-bruta@e2e.test', senha: 'qualquer-coisa' });

      for (let i = 0; i < LOGIN_LIMITE_POR_MINUTO; i++) {
        await tentar().expect(401);
      }
      await tentar().expect(429);
    });
  });
});
