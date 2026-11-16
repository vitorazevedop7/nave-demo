import request from 'supertest';
import { AppE2E, criarApp } from './support/app';

describe('Aplicação (e2e)', () => {
  let app: AppE2E;

  beforeAll(async () => {
    app = await criarApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health é público e confirma o banco', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(resposta.body).toEqual({ status: 'ok', database: 'ok' });
  });

  it('aplica cabeçalhos de segurança do helmet', async () => {
    const resposta = await request(app.getHttpServer()).get('/health');

    expect(resposta.headers['x-content-type-options']).toBe('nosniff');
    expect(resposta.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(resposta.headers).not.toHaveProperty('x-powered-by');
  });

  it('libera CORS apenas para a origem do frontend', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'http://localhost:3000');

    expect(resposta.headers['access-control-allow-origin']).toBe(
      process.env.FRONTEND_URL || 'http://localhost:3000',
    );
  });

  it('a rota raiz do template não existe mais (404)', async () => {
    await request(app.getHttpServer()).get('/').expect(404);
  });

  it('publica a especificação OpenAPI com autenticação bearer', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    const documento = resposta.body as {
      info: { title: string };
      paths: Record<string, unknown>;
      components: { securitySchemes: Record<string, unknown> };
    };

    expect(documento.info.title).toBe('NAVE API');
    expect(documento.paths).toHaveProperty('/prontuarios/{id}');
    expect(documento.components.securitySchemes).toHaveProperty('bearer');
  });
});
