# Backend — Sistema NAVE

API REST do Sistema NAVE, construída com NestJS 11, Prisma 7 (adapter `pg`) e PostgreSQL. A visão geral do projeto está no [README da raiz](../README.md); este arquivo cobre só o que é preciso para rodar, testar e navegar pelo backend.

## Requisitos

- Node.js 20.19 ou superior
- PostgreSQL 14+ (o `docker compose up -d postgres` da raiz sobe um na porta 5433)

## Configuração

```bash
cp .env.example .env
```

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | sim | URL de conexão do PostgreSQL, ex.: `postgresql://nave_demo:nave_demo_local@localhost:5433/nave_demo` |
| `JWT_SECRET` | sim | Segredo de assinatura dos tokens. Gere com `openssl rand -hex 32`. A API não sobe sem ele. |
| `FRONTEND_URL` | não | Origem liberada no CORS. Padrão: `http://localhost:3000` |
| `PORT` | não | Porta HTTP da API. Padrão: `3001` |
| `THROTTLE_DISABLED` | não | `true` desliga o limite de tentativas de login (usado pelos testes e2e). Nunca em produção. |

## Banco de dados

O schema fica em `prisma/schema.prisma` e as mudanças são versionadas em `prisma/migrations/`.

```bash
npx prisma migrate deploy   # aplica as migrations pendentes
npm run seed                # APAGA os dados e recria a base fictícia de demonstração
```

O seed cria usuários de demonstração com a senha pública `NaveDemo@2026` (gestora, triadora e profissionais). Ele só deve ser usado em bancos locais.

## Rodando

```bash
npm install
npm run start:dev           # http://localhost:3001, com hot reload
```

A documentação OpenAPI fica em **<http://localhost:3001/docs>** (JSON em `/docs-json`). Para testar rotas protegidas, faça `POST /auth/login` e cole o `access_token` em **Authorize**. `GET /health` informa se a API e o banco estão de pé.

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run start:dev` | API com hot reload |
| `npm run build` | Gera o Prisma Client e compila para `dist/` |
| `npm run start:prod` | Roda a build (`node dist/src/main`) |
| `npm run seed` | Recria os dados fictícios de demonstração |
| `npm test` | Testes unitários (Jest, fuso fixado em `America/Sao_Paulo`) |
| `npm run test:cov` | Unitários com relatório de cobertura |
| `npm run test:e2e` | Testes e2e com Supertest contra PostgreSQL real |
| `npm run lint` / `npm run lint:check` | ESLint com regras type-checked (com e sem `--fix`) |
| `npm run format` | Prettier |

## Testes

Os **unitários** (`src/**/*.spec.ts`) usam um mock tipado do Prisma (`src/test-utils/prisma-mock.ts`, com `jest-mock-extended`) e não precisam de banco.

Os **e2e** (`test/*.e2e-spec.ts`) sobem o `AppModule` real com a mesma configuração do `main.ts` (`configureApp`) e falam com um PostgreSQL de verdade. Cada suíte apaga e recria seus próprios dados no `beforeAll`, então elas rodam em série e podem ser repetidas no mesmo banco. Por segurança, só rodam se o nome do banco em `DATABASE_URL` contiver `test`:

```bash
createdb nave_demo_test
DATABASE_URL=postgresql://nave_demo:nave_demo_local@localhost:5433/nave_demo_test npx prisma migrate deploy
DATABASE_URL=postgresql://nave_demo:nave_demo_local@localhost:5433/nave_demo_test npm run test:e2e
```

Cobrem login e revogação de tokens, a matriz de perfis do `RolesGuard`, a matriz de visibilidade dos prontuários (quatro níveis × autora, gestora e profissionais da mesma ou de outra especialidade, mais compartilhamento nominal), exclusão lógica, validação de UUID e tradução de erros do banco.

## Estrutura

```text
src/
├── main.ts / configure-app.ts   bootstrap, Helmet, CORS, ValidationPipe, filtro de erros, Swagger
├── auth/                        login, JWT revalidado no banco, @Public, @Roles, RolesGuard, @CurrentUser
├── common/                      filtro de erros do Prisma (404/409) e pipes de UUID
├── prisma/                      PrismaService e limpeza de base (seed e e2e)
├── health/                      GET /health
├── usuarios/                    usuários, perfis e elegíveis a compartilhamento
├── beneficiarias/               cadastro com exclusão lógica e busca mínima por perfil
├── triagens/ queixas/           triagem e queixas
├── encaminhamentos/             encaminhamento por especialidade
├── agendamentos/                agenda, conflito de horário e agenda própria do profissional
├── prontuarios/                 prontuários por especialidade, visibilidade e compartilhamento
├── doadores/ doacoes/           doadores e doações (somente GESTORA)
├── campanhas-doacoes/ bazares/  campanhas e bazares
├── dashboard/                   indicadores por perfil
└── seed.ts                      dados fictícios de demonstração
test/                            testes e2e e utilitários de apoio
```

## Regras de acesso

Toda rota exige JWT, exceto as marcadas com `@Public()` (`POST /auth/login` e `GET /health`). A cada requisição o usuário do token é recarregado do banco: conta desativada ou removida recebe 401 na hora, e mudanças de perfil valem sem novo login. Sobre isso, o `RolesGuard` aplica o `@Roles(...)` de cada controller ou rota. As regras de visibilidade de prontuário estão em `src/prontuarios/prontuarios.service.ts` (`whereVisibilidade` filtra no banco; `redigirProntuario` devolve só metadados quando o conteúdo não pode ser lido).
