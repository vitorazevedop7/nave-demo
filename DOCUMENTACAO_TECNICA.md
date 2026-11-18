# Documentação Técnica — Sistema NAVE

Sistema de gestão do Núcleo Assistencial Veleiro da Esperança: cadastro de beneficiárias, triagem, encaminhamento por especialidade, agenda de atendimentos, prontuários clínicos com visibilidade controlada e controle financeiro (doações, campanhas e bazares).

Este documento descreve o que existe hoje no código. Para uma visão geral do projeto, veja o [README](README.md); para o uso no dia a dia, o [Manual do usuário](MANUAL_USUARIO.md).

## Sumário

1. [Arquitetura](#1-arquitetura)
2. [Stack e versões](#2-stack-e-versões)
3. [Estrutura de pastas](#3-estrutura-de-pastas)
4. [Como rodar](#4-como-rodar)
5. [Banco de dados e migrations](#5-banco-de-dados-e-migrations)
6. [Endpoints](#6-endpoints)
7. [Autenticação e controle de acesso](#7-autenticação-e-controle-de-acesso)
8. [Tratamento de erros](#8-tratamento-de-erros)
9. [Testes e CI](#9-testes-e-ci)
10. [Operação](#10-operação)
11. [Limitações conhecidas](#11-limitações-conhecidas)

---

## 1. Arquitetura

~~~text
Navegador ──▶ Next.js (frontend, :3000) ──HTTP/JSON + Bearer JWT──▶ NestJS (API, :3001) ──Prisma──▶ PostgreSQL
~~~

- **Frontend:** Next.js com App Router. As páginas são client components que chamam a API com `fetch`. O token JWT fica no `localStorage` e é enviado no cabeçalho `Authorization`.
- **API:** NestJS modular, com um módulo por domínio. Toda regra de negócio e de autorização vive aqui.
- **Dados:** PostgreSQL, acessado pelo Prisma 7 com o driver adapter `@prisma/adapter-pg`. O schema é versionado com Prisma Migrate.

A configuração global da aplicação (Helmet, CORS, `ValidationPipe`, filtro de erros do Prisma, Swagger e shutdown hooks) fica em `backend/src/configure-app.ts`. A mesma função é usada pelo `main.ts` e pelos testes e2e, de modo que os testes exercitam exatamente o pipeline de produção.

## 2. Stack e versões

| Camada | Tecnologia |
| --- | --- |
| Runtime | Node.js 20.19+ (CI e imagens Docker usam Node 22) |
| API | NestJS 11, Passport + `@nestjs/jwt`, `class-validator`/`class-transformer`, `@nestjs/swagger`, `@nestjs/throttler`, Helmet, bcrypt |
| Dados | PostgreSQL 17 (Docker) / 16+, Prisma 7.10 com `@prisma/adapter-pg` |
| Interface | Next.js 16.1, React 19.2, TypeScript 5, Tailwind CSS 4, Recharts, React Three Fiber (logo 3D do login), lucide-react |
| Testes | Backend: Jest 30, ts-jest, Supertest, `jest-mock-extended`. Frontend: Vitest 3, Testing Library, jsdom |
| Qualidade | ESLint 9 com regras type-checked, Prettier, GitHub Actions |

## 3. Estrutura de pastas

~~~text
nave-demo/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # modelo de dados
│   │   └── migrations/            # migrations versionadas (Prisma Migrate)
│   ├── src/
│   │   ├── main.ts                # bootstrap (porta 3001)
│   │   ├── configure-app.ts       # pipeline global compartilhado com os testes e2e
│   │   ├── seed.ts                # dados fictícios de demonstração (apaga a base antes)
│   │   ├── auth/                  # login, JwtStrategy, guards, @Public, @Roles, @CurrentUser
│   │   ├── common/                # filtro de erros do Prisma, pipes de UUID
│   │   ├── health/                # GET /health com ping no banco
│   │   ├── prisma/                # PrismaService
│   │   ├── beneficiarias/ triagens/ queixas/ encaminhamentos/ agendamentos/ prontuarios/
│   │   ├── usuarios/ doadores/ doacoes/ campanhas-doacoes/ bazares/ dashboard/
│   │   └── test-utils/            # mock tipado do Prisma e helpers de DTO
│   ├── test/                      # testes e2e (Supertest + PostgreSQL real)
│   ├── Dockerfile
│   └── docker-entrypoint.sh       # aplica migrations e, se a base estiver vazia, roda o seed
├── frontend/
│   ├── app/                       # rotas (App Router): login, dashboard, beneficiarios, triagens,
│   │                              # encaminhamentos, agenda, prontuarios, profissionais, usuarios,
│   │                              # doacoes, bazares. Telas maiores guardam as próprias partes em
│   │                              # pastas privadas ao lado do page.tsx: _components/ (formulários,
│   │                              # listas, modais) e _lib/ (tipos, opções e funções puras)
│   ├── components/                # Sidebar, Modal, DialogProvider, VisibilidadeSelector...
│   ├── lib/                       # cliente HTTP, auth, formatadores, geração do PDF de prontuário
│   └── Dockerfile
├── docs/                          # DER, modelo lógico, casos de uso, requisitos, capturas e vídeo demo
├── docker-compose.yml             # postgres + api + web
└── .github/workflows/ci.yml
~~~

## 4. Como rodar

### 4.1 Stack completa com Docker

~~~bash
docker compose up --build
~~~

Sobe o PostgreSQL (porta 5433 no host), a API (3001) e a interface (3000). O entrypoint da API aplica as migrations e, se a tabela `usuarios` estiver vazia, carrega o seed de demonstração. Credenciais no [README](README.md#rodando-em-um-comando).

### 4.2 Desenvolvimento local

~~~bash
docker compose up -d postgres

cd backend
cp .env.example .env          # preencha JWT_SECRET (openssl rand -hex 32)
npm install                   # o postinstall roda prisma generate
npx prisma migrate deploy
npm run seed
npm run start:dev

cd ../frontend
cp .env.example .env.local
npm install
npm run dev
~~~

### 4.3 Variáveis de ambiente

**`backend/.env`**

| Variável | Exemplo | Uso |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://nave_demo:nave_demo_local@localhost:5433/nave_demo` | Conexão do Prisma |
| `JWT_SECRET` | saída de `openssl rand -hex 32` | Assinatura dos tokens. Obrigatória |
| `FRONTEND_URL` | `http://localhost:3000` | Origem liberada no CORS |
| `PORT` | `3001` | Porta da API |
| `THROTTLE_DISABLED` | `true` | Desliga o limite de tentativas de login. Usado só pelos testes e2e |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | vazio | Envio do e-mail de recuperação de senha por SMTP. Opcional |
| `SMTP_CONNECTION_TIMEOUT_MS`, `SMTP_GREETING_TIMEOUT_MS`, `SMTP_SOCKET_TIMEOUT_MS` | `10000`, `10000`, `15000` | Limites de tempo da conexão SMTP |
| `MAILTRAP_API_TOKEN`, `MAILTRAP_INBOX_ID`, `MAILTRAP_FROM_EMAIL`, `MAILTRAP_API_TIMEOUT_MS` | vazio | Envio pela API HTTPS do Mailtrap. Com `MAILTRAP_INBOX_ID` usa o Sandbox; sem ele, o envio transacional de produção. Tem prioridade sobre o SMTP |
| `PASSWORD_RESET_TOKEN_TTL_MINUTES` | `30` | Validade do link de redefinição |
| `PASSWORD_RESET_RATE_LIMIT_MAX`, `PASSWORD_RESET_RATE_LIMIT_WINDOW_MINUTES` | `5`, `15` | Pedidos de recuperação por e-mail na janela (o limite por IP é 5× maior) |

Sem SMTP nem Mailtrap configurados, `POST /auth/esqueci-minha-senha` responde normalmente, mas nenhum e-mail é enviado. É o padrão da demonstração.

**`frontend/.env.local`**

| Variável | Exemplo | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | URL da API. É embutida no bundle em tempo de build |

## 5. Banco de dados e migrations

São 19 tabelas e um enum (`VisibilidadeProntuario`). O DER e o modelo lógico estão em [`docs/`](docs/README.md).

| Grupo | Tabelas |
| --- | --- |
| Acesso | `usuarios`, `perfis_usuario` |
| Atendimento | `beneficiarias`, `triagens`, `queixas`, `encaminhamentos`, `agendamentos` |
| Prontuários | `prontuarios`, `prontuario_compartilhamentos`, `prontuarios_psicologia_adulto`, `prontuarios_psicologia_crianca`, `prontuarios_fisioterapia`, `prontuarios_acupuntura` |
| Financeiro | `doadores`, `doacoes`, `campanhas_doacoes`, `bazares`, `bazar_profissionais` |

Relações principais:

- `beneficiarias` 1:N `triagens` 1:N `queixas` e `encaminhamentos`; um encaminhamento pode originar `agendamentos`.
- `agendamentos` 1:0..1 `prontuarios`. Cada prontuário tem no máximo um registro de detalhe por tipo (psicologia adulto/criança, fisioterapia, acupuntura).
- `beneficiarias` tem autorrelação (`responsavel_id`) para ligar crianças e adolescentes à responsável.
- `perfis_usuario` permite que um usuário tenha mais de um perfil.

### Exclusão lógica

`beneficiarias`, `usuarios`, `doadores` e `prontuarios` têm a coluna `deletado_em`. O `DELETE` dessas rotas só preenche a coluna, e as consultas excluem os registros marcados. Triagens e prontuários referenciam a beneficiária com `onDelete: Restrict`: um delete físico falha em vez de apagar o histórico clínico junto. Ao excluir um prontuário, o `agendamento_id` é liberado, para que o mesmo atendimento possa receber um novo laudo.

### Migrations

~~~bash
npx prisma migrate deploy                   # aplica as migrations pendentes
npx prisma migrate dev --name descricao     # cria uma nova migration a partir do schema
~~~

A primeira migration (`20260830000000_init`) cria o schema completo. As seguintes são incrementais.

## 6. Endpoints

A documentação interativa (OpenAPI) fica em `http://localhost:3001/docs`. Ao todo são 65 rotas. Na coluna "Acesso", **autenticado** significa qualquer usuário logado; os demais valores são perfis exigidos pelo `RolesGuard`.

### Infraestrutura e autenticação

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/health` | pública | Status da API e ping no banco (503 se o banco cair) |
| POST | `/auth/login` | pública, 5 tentativas/min por IP | Retorna `access_token` |
| POST | `/auth/esqueci-minha-senha` | pública, limitada por e-mail e IP | Gera um link de redefinição e envia por e-mail. Responde 202 com a mesma mensagem exista ou não a conta |
| POST | `/auth/redefinir-senha` | pública, 5 tentativas/min por IP | Troca a senha a partir do token do link. Token de uso único |
| GET | `/auth/me` | autenticado | Usuário logado, com perfis e especialidade vindos do banco |

### Beneficiárias, triagens e queixas

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/beneficiarias` | GESTORA, TRIADORA | Lista; `?incluir_arquivadas=true` inclui as arquivadas; `?responsavel_id=` filtra dependentes |
| GET | `/beneficiarias/buscar` | GESTORA, TRIADORA, PROFISSIONAL | Busca por nome ou CPF. Para PROFISSIONAL, o CPF é omitido |
| GET | `/beneficiarias/:id` | GESTORA, TRIADORA | Detalhe |
| POST | `/beneficiarias` | GESTORA, TRIADORA | Cadastro. CPF duplicado → 409 |
| PATCH | `/beneficiarias/:id` | GESTORA, TRIADORA | Edição |
| DELETE | `/beneficiarias/:id` | GESTORA, TRIADORA | Arquivamento (exclusão lógica) |
| GET | `/triagens` | GESTORA, TRIADORA | Lista |
| GET | `/triagens/:id` | GESTORA, TRIADORA | Detalhe |
| POST | `/triagens` | GESTORA, TRIADORA | Cria; a triadora é sempre o usuário do token |
| GET | `/queixas` | GESTORA, TRIADORA | Lista |
| GET | `/queixas/triagem/:triagem_id` | GESTORA, TRIADORA | Queixas de uma triagem |
| GET | `/queixas/:id` | GESTORA, TRIADORA | Detalhe |
| POST | `/queixas` | GESTORA, TRIADORA | Registra queixa |

### Encaminhamentos e agenda

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/encaminhamentos/pendentes` | GESTORA, TRIADORA | Triagens ainda sem encaminhamento |
| GET | `/encaminhamentos/historico` | GESTORA, TRIADORA | Histórico com status |
| POST | `/encaminhamentos` | GESTORA, TRIADORA | Encaminha uma triagem para uma especialidade (a interface envia um pedido por especialidade marcada) |
| GET | `/agendamentos` | GESTORA, TRIADORA | Agenda completa |
| GET | `/agendamentos/meus` | PROFISSIONAL | Agenda da profissional logada |
| GET | `/agendamentos/:id` | GESTORA, TRIADORA | Detalhe |
| POST | `/agendamentos` | GESTORA, TRIADORA, PROFISSIONAL | Cria agendamento |
| PATCH | `/agendamentos/:id` | GESTORA, TRIADORA, PROFISSIONAL | Altera status ou dados (a profissional só altera os próprios) |
| DELETE | `/agendamentos/:id` | GESTORA, TRIADORA | Remove |

### Prontuários

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| POST | `/prontuarios` | GESTORA, PROFISSIONAL | Cria laudo para um agendamento da própria profissional |
| GET | `/prontuarios` | GESTORA, PROFISSIONAL | Lista filtrada pelas regras de visibilidade |
| GET | `/prontuarios/meus` | GESTORA, PROFISSIONAL | Laudos de autoria do usuário |
| GET | `/prontuarios/outros` | GESTORA, PROFISSIONAL | Laudos de outras autoras que o usuário pode ler, com `origem_acesso` (`COMPARTILHADO_COM_VOCE`, `ESPECIALIDADE`, `GESTORAS` ou `EQUIPE_CLINICA`) |
| GET | `/prontuarios/profissional/:profissional_id` | GESTORA, PROFISSIONAL | Laudos de uma profissional, filtrados pela visibilidade |
| GET | `/prontuarios/beneficiaria/:beneficiaria_id` | GESTORA, PROFISSIONAL | Histórico de uma beneficiária, com conteúdo redigido quando não autorizado |
| GET | `/prontuarios/agendamento/:agendamento_id` | GESTORA, PROFISSIONAL | Laudo de um atendimento |
| GET | `/prontuarios/:id` | GESTORA, PROFISSIONAL | Detalhe (redigido quando não autorizado) |
| PATCH | `/prontuarios/:id` | autora do laudo | Edita conteúdo, visibilidade e compartilhamentos. Não troca beneficiária, agendamento nem autoria |
| DELETE | `/prontuarios/:id` | autora do laudo | Exclusão lógica (204) |

### Usuários

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/usuarios` | GESTORA | Lista |
| GET | `/usuarios/profissionais` | GESTORA, TRIADORA | Profissionais ativas, para agendamento |
| GET | `/usuarios/compartilhaveis` | GESTORA, PROFISSIONAL | Usuários que podem receber um laudo compartilhado |
| GET | `/usuarios/:id` | GESTORA | Detalhe |
| POST | `/usuarios` | GESTORA | Cria; perfis restritos a GESTORA, TRIADORA e PROFISSIONAL |
| PATCH | `/usuarios/:id` | GESTORA | Edita; a gestora não pode se desativar nem remover o próprio perfil GESTORA |
| DELETE | `/usuarios/:id` | GESTORA | Exclusão lógica; a gestora não pode excluir a si mesma |

### Financeiro e dashboard

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET, POST | `/doadores` | GESTORA | Lista e cria doadores |
| GET, PATCH, DELETE | `/doadores/:id` | GESTORA | Detalhe, edição e exclusão lógica |
| GET, POST | `/doacoes` | GESTORA | Lista e registra doações |
| GET, PATCH, DELETE | `/doacoes/:id` | GESTORA | Detalhe, edição e exclusão |
| GET | `/campanhas-doacoes`, `/campanhas-doacoes/:id` | GESTORA, TRIADORA | Campanhas e metas |
| POST, PATCH, DELETE | `/campanhas-doacoes[/:id]` | GESTORA | Gestão de campanhas |
| GET | `/bazares`, `/bazares/:id` | GESTORA, TRIADORA | Bazares |
| POST, PATCH, DELETE | `/bazares[/:id]` | GESTORA | Gestão de bazares |
| GET | `/dashboard/stats?period=hoje\|semana\|mes` | autenticado | Indicadores do painel, calculados conforme o perfil |

## 7. Autenticação e controle de acesso

### 7.1 Autenticação

- `POST /auth/login` compara a senha com bcrypt. Quando o e-mail não existe, a comparação é feita contra um hash fictício, para que o tempo de resposta não revele quais e-mails estão cadastrados.
- O token JWT expira em 8 horas e carrega a `versao_token` do usuário no momento do login.
- O `JwtAuthGuard` é global (`APP_GUARD`): toda rota exige token, exceto as marcadas com `@Public()` (`/auth/login`, `/auth/esqueci-minha-senha`, `/auth/redefinir-senha` e `/health`).
- A cada requisição, a `JwtStrategy` recarrega o usuário do banco. Se ele estiver inativo ou excluído, a resposta é 401 na hora, sem esperar o token expirar. Perfis e especialidade também vêm do banco, então uma troca de perfil vale imediatamente.
- O login aceita 5 tentativas por minuto por IP (`@nestjs/throttler`); a 6ª recebe 429.
- **Recuperação de senha:** o link enviado por e-mail leva um token aleatório de 32 bytes no fragmento da URL (`/redefinir-senha#token=...`), que não chega a logs de servidor. O banco guarda só o SHA-256 dele (`redefinicoes_senha`), com validade e marca de uso. Pedir um link novo invalida os anteriores. Ao redefinir, a `versao_token` do usuário é incrementada, o que derruba na hora todas as sessões abertas; trocar a senha pela tela de usuários faz o mesmo.

### 7.2 Perfis

O `RolesGuard` lê o `@Roles(...)` do método ou, na falta dele, o da classe (`getAllAndOverride`). Um usuário pode ter vários perfis e passa se tiver qualquer um dos exigidos. No controller, o usuário autenticado chega tipado pelo decorator `@CurrentUser()`.

O frontend esconde do menu o que o perfil não usa (`LayoutShell`/`Sidebar`). Isso é só conveniência: a proteção real está na API.

### 7.3 Visibilidade de prontuários

Cada prontuário tem uma `visibilidade`, definida pela autora:

| Visibilidade | Gestora | Profissional da mesma especialidade | Profissional de outra especialidade | Triadora |
| --- | --- | --- | --- | --- |
| `PRIVADO` | — | — | — | — |
| `ESPECIALIDADE` | — | lê | — | — |
| `GESTORAS` | lê | — | — | — |
| `EQUIPE_CLINICA` | lê | lê | lê | — |

Regras que valem em qualquer nível:

- A **autora** sempre lê, edita e exclui. Ninguém mais edita ou exclui.
- O **compartilhamento nominal** (`prontuario_compartilhamentos`) dá acesso de leitura a usuários específicos. Os destinatários são validados com a mesma regra de `/usuarios/compartilhaveis` (ativos, não excluídos, com perfil elegível); qualquer outro é rejeitado com 400.
- A triadora não acessa prontuários (403 nas rotas).
- Quando a regra não autoriza o conteúdo, as rotas de detalhe e de histórico devolvem só os metadados (data, especialidade, autora) e marcam o registro como `conteudo_restrito`. Os campos clínicos não saem da API.

**Por que cruzar perfil e especialidade?** O perfil diz o que a pessoa pode fazer na organização; a especialidade diz em que contexto técnico ela atua. Autorizar só pelo perfil abriria todos os registros clínicos para a equipe inteira, e autorizar só pela especialidade deixaria de fora responsabilidades legítimas da gestão. A combinação aplica o menor privilégio, e os casos excepcionais se resolvem com compartilhamento nominal.

### 7.4 Outras proteções

- **Entrada:** `ValidationPipe` com `whitelist` e `forbidNonWhitelisted`. Campos não declarados no DTO geram 400, e os IDs passam por `ParseUUIDPipe`.
- **Minimização de dados:** a busca de beneficiárias omite o CPF para PROFISSIONAL; doadores e doações (com telefone e e-mail) são exclusivos da GESTORA.
- **Cabeçalhos:** Helmet; CORS restrito a `FRONTEND_URL`.
- **Frontend:** o PDF do prontuário é gerado em `frontend/lib/prontuario-pdf.ts`, com escape de HTML em todos os valores. Ele abre por uma Blob URL com `noopener` e uma CSP própria, então dados digitados não viram script. Os rascunhos de anamnese ficam em `sessionStorage` e são apagados no logout.

## 8. Tratamento de erros

| Situação | Status | Exemplo de mensagem |
| --- | --- | --- |
| Sem token, token inválido ou usuário desativado | 401 | — |
| Perfil sem permissão / não é a autora | 403 | — |
| ID que não é UUID | 400 | `Identificador inválido: UUID esperado.` |
| Campo inválido ou não permitido | 400 | lista de mensagens do `class-validator` |
| Registro inexistente (`P2025`) | 404 | `Registro não encontrado.` |
| Valor único duplicado (`P2002`) | 409 | `Já existe uma beneficiária com este CPF.` / `E-mail já cadastrado` |
| Violação de chave estrangeira (`P2003`) | 409 | — |
| Excesso de tentativas de login | 429 | — |
| Banco indisponível em `/health` | 503 | — |

Erros inesperados do Prisma viram 500 genérico, sem detalhes internos na resposta; o detalhe fica só no log do servidor. O frontend centraliza a leitura dessas respostas em `lib/api.ts` (`extrairMensagemErro`).

## 9. Testes e CI

| Suíte | Quantidade | Como rodar |
| --- | --- | --- |
| Unitários (serviços, guards, DTOs, filtro de erros, dashboard) | 154 testes em 21 suítes | `npm test` |
| E2E (API real + PostgreSQL) | 116 testes em 5 suítes | `npm run test:e2e` |
| Frontend (lógica das telas e componentes) | 91 testes em 14 arquivos | `npm test` em `frontend/` |

Os testes e2e (`backend/test/`) sobem o `AppModule` real com o mesmo `configureApp` da produção. A cada suíte, eles apagam e repopulam o banco. Por segurança, só rodam se o nome do banco em `DATABASE_URL` contiver `test`:

~~~bash
DATABASE_URL=postgresql://nave_demo:nave_demo_local@localhost:5433/nave_demo_test npx prisma migrate deploy
DATABASE_URL=postgresql://nave_demo:nave_demo_local@localhost:5433/nave_demo_test npm run test:e2e
~~~

Cobertura dos e2e:

- login válido, inválido e de usuário inativo;
- guards de perfil (401/403) nas rotas restritas;
- matriz de visibilidade de prontuários, com autoria e compartilhamento, conferindo que o corpo redigido não traz campos clínicos;
- 403 para edição e exclusão por quem não é a autora;
- arquivamento de beneficiária;
- revogação imediata do token de usuário desativado;
- validação de UUID, 404, 409 de CPF duplicado e `/health`.

O dashboard tem testes com fuso fixo em `America/Sao_Paulo`, para garantir que atendimentos noturnos caiam no dia certo.

No frontend, os testes ficam ao lado do código (`*.test.ts(x)`) e rodam com o mesmo fuso fixo. Cobrem:

- datas puras sem deslocamento de fuso, máscara de moeda e tradução de erros da API;
- montagem dos formulários de prontuário a partir do cadastro e do registro salvo, e o payload enviado à API;
- documento de impressão do prontuário: escape de HTML, CSP que libera só o script de impressão (o hash é recalculado no teste) e seleção de seções sem injeção;
- cálculos da agenda (intervalos, navegação, grade do mês) e soma do total arrecadado dos bazares;
- componentes: seletor de visibilidade, seletor de PDF e busca de beneficiária com debounce;
- a tela de doações renderizada com a API simulada, incluindo a regressão de edição de doador.

**CI (`.github/workflows/ci.yml`)**, a cada push e pull request:

1. **Backend:** `npm ci`, `lint:check`, `tsc --noEmit`, testes unitários, `prisma migrate deploy` num PostgreSQL 17 de serviço, testes e2e e build.
2. **Frontend:** `npm ci`, lint, `tsc --noEmit`, testes (Vitest) e build.
3. **Docker:** `docker compose up --build --wait` e smoke test (health, login com usuário do seed e página de login).

## 10. Operação

### Deploy

- Defina `JWT_SECRET` forte e exclusivo por ambiente. Trocar o segredo invalida todos os tokens emitidos.
- `FRONTEND_URL` precisa ser a origem exata da interface, por causa do CORS.
- Rode `npx prisma migrate deploy` a cada versão. **Nunca rode `npm run seed` em produção**: o seed apaga a base antes de popular.
- Atrás de um proxy reverso, configure o Express com `trust proxy`. Sem isso, o limite de tentativas de login enxerga o IP do proxy, e não o do cliente.

### Backup

~~~bash
# Backup completo em formato custom (compacto e restaurável seletivamente)
pg_dump "$DATABASE_URL" --no-owner --no-privileges -Fc -f backup_nave_$(date +%F).dump

# Restauração
pg_restore --no-owner --no-privileges -d "$DATABASE_URL" backup_nave_AAAA-MM-DD.dump
~~~

Guarde os backups fora do servidor do banco e teste a restauração periodicamente. Os dados são clínicos e sensíveis: os arquivos de backup exigem o mesmo cuidado que o banco.

## 11. Limitações conhecidas

- **Token no `localStorage`.** O token JWT fica no `localStorage`, sem refresh token. A mitigação atual é a expiração de 8 horas mais a revalidação do usuário no banco a cada requisição. O próximo passo seria um cookie `httpOnly`.
- **Vínculo bazar ↔ agendamento por texto.** Esse vínculo é feito por texto em `observacoes`; o ideal é uma chave estrangeira.
- **Estilos inline no frontend.** As telas maiores já foram divididas em componentes, mas a maioria ainda usa estilos inline em vez de classes Tailwind.
- **Testes de ponta a ponta no navegador.** Os testes do frontend cobrem lógica e componentes isolados; os fluxos completos no navegador ainda dependem do smoke test do CI e de verificação manual.
