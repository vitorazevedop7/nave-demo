import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp, setupSwagger } from '../../src/configure-app';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SENHA_E2E } from './fixtures';

export type AppE2E = INestApplication<App>;

/** Sobe a aplicação real: AppModule + a mesma configuração do main.ts. */
export async function criarApp(): Promise<AppE2E> {
  const modulo = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = modulo.createNestApplication<AppE2E>();
  configureApp(app);
  setupSwagger(app);
  await app.init();
  return app;
}

export function prismaDe(app: AppE2E): PrismaService {
  return app.get(PrismaService);
}

export async function login(app: AppE2E, email: string): Promise<string> {
  const resposta = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, senha: SENHA_E2E })
    .expect(200);
  return (resposta.body as { access_token: string }).access_token;
}

/** Cliente HTTP já autenticado com o token informado. */
export function como(app: AppE2E, token?: string) {
  const servidor = app.getHttpServer();
  const auth = (req: request.Test) =>
    token ? req.set('Authorization', `Bearer ${token}`) : req;
  return {
    get: (url: string) => auth(request(servidor).get(url)),
    post: (url: string) => auth(request(servidor).post(url)),
    patch: (url: string) => auth(request(servidor).patch(url)),
    delete: (url: string) => auth(request(servidor).delete(url)),
  };
}
