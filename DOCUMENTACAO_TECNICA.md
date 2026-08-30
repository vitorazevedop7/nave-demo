# Documentação Técnica — Sistema NAVE

Sistema de gestão interno da ONG NAVE: cadastro de beneficiárias, triagem,
encaminhamento por especialidade, agenda de atendimentos, prontuários clínicos e
controle financeiro (doações e bazares).

Este documento é o ponto de partida para quem nunca viu o projeto. Ele descreve o
que existe hoje no código — não o que está planejado.

---

## 1. Stack e versões

### Backend (`backend/`)

| Item | Versão | Observação |
|------|--------|------------|
| Node.js | >= 18 | |
| NestJS | 11.x | `@nestjs/core`, `@nestjs/platform-express` |
| TypeScript | 5.7 | |
| Prisma | 7.5 | ORM, com `@prisma/adapter-pg` (driver adapter sobre `pg`) |
| PostgreSQL | — | Em produção, hospedado no **Supabase** (Session Pooler) |
| Autenticação | `@nestjs/jwt` 11, `passport-jwt` 4 | Token JWT com validade de 8 horas |
| Hash de senha | `bcrypt` 6 | 10 rounds |
| Validação | `class-validator` 0.15 + `class-transformer` 0.5 | `ValidationPipe` global |
| Testes | Jest 30 + `ts-jest` | Suítes unitárias parciais (ver seção 10) |

### Frontend (`frontend/`)

| Item | Versão | Observação |
|------|--------|------------|
| Next.js | 16.1.6 | App Router, Turbopack |
| React | 19.2.3 | |
| Tailwind CSS | 4 | via `@tailwindcss/postcss` |
| TypeScript | 5.x | |
| `recharts` | 3.8 | Gráficos do dashboard |
| `lucide-react` | 1.6 | Ícones |
| `three` + `@react-three/fiber` + `@react-three/drei` | 0.183 / 9.5 / 10.7 | Logo 3D animado da tela de login |

> Boa parte da estilização das páginas é feita com `style` inline em vez de
> classes Tailwind. O Tailwind está instalado e configurado, mas o padrão
> predominante no código é o inline style.

---

## 2. Estrutura de pastas

```
nave-sistema/
├── backend/                        API REST (NestJS)
│   ├── prisma/
│   │   └── schema.prisma           Schema do banco (introspectado do Postgres)
│   ├── prisma.config.ts            Config do Prisma CLI (aponta para o schema e o .env)
│   ├── src/
│   │   ├── main.ts                 Bootstrap: CORS, ValidationPipe global, porta
│   │   ├── app.module.ts           Módulo raiz + registro do guard global (APP_GUARD)
│   │   ├── app.controller.ts       Health check público (GET /)
│   │   ├── seed.ts                 Popula o banco com dados de demonstração
│   │   ├── prisma/                 PrismaService (módulo global de acesso ao banco)
│   │   ├── auth/                   Login, JWT strategy, guards e decorators
│   │   ├── usuarios/               Equipe da ONG (profissionais, triadoras, gestoras)
│   │   ├── beneficiarias/          Cadastro de beneficiárias (soft delete)
│   │   ├── triagens/               Registro de triagem
│   │   ├── queixas/                Queixas vinculadas a uma triagem
│   │   ├── encaminhamentos/        Encaminhamento de triagem para especialidade
│   │   ├── agendamentos/           Agenda de atendimentos
│   │   ├── prontuarios/            Prontuários clínicos + fichas por especialidade
│   │   ├── doadores/               Cadastro de doadores
│   │   ├── doacoes/                Registro de doações
│   │   ├── campanhas-doacoes/      Campanhas com meta de arrecadação
│   │   ├── bazares/                Bazares beneficentes
│   │   └── dashboard/              Métricas agregadas por perfil
│   └── test/                       Testes end-to-end (Jest + Supertest)
│
└── frontend/                       Interface web (Next.js App Router)
    ├── app/
    │   ├── layout.tsx              Layout raiz — envolve tudo no LayoutShell
    │   ├── page.tsx                Dashboard (raiz "/")
    │   ├── login/                  Tela de login
    │   ├── beneficiarios/          Lista, cadastro, edição e histórico
    │   ├── triagens/               Lista, nova triagem (wizard) e detalhe
    │   ├── encaminhamentos/        Triagens pendentes + histórico
    │   ├── agenda/                 Agenda de atendimentos + modal de agendamento
    │   ├── calendario/             Redirect para /agenda (rota legada)
    │   ├── prontuarios/            Fichas clínicas e geração de PDF
    │   ├── profissionais/          Lista da equipe
    │   ├── usuarios/               Criação e edição de usuários
    │   ├── doacoes/                Doações, doadores e campanhas
    │   ├── bazares/                Bazares
    │   └── components/             Componentes de página (StatusBadge)
    ├── components/                 Componentes compartilhados
    │   ├── LayoutShell.tsx         Verificação de token e bloqueio por perfil no cliente
    │   ├── Sidebar.tsx             Menu lateral, filtrado por perfil
    │   ├── DialogProvider.tsx      confirm()/alert() em modal
    │   ├── Modal.tsx, Button.tsx, LoginLogo3D.tsx
    ├── lib/
    │   ├── api.ts                  API_BASE / API_URL a partir do env
    │   ├── auth.ts                 getUsuario, logout, fetchAuth (injeta o Bearer token)
    │   ├── date.ts                 Data pura vs. timestamp (ver nota abaixo)
    │   ├── dashboard.ts, agendamentos.ts, bazares.ts, bazarUtils.ts
    │   └── types/
    └── public/                     Imagens, logos e o modelo 3D (.glb)
```

**Nota sobre `lib/date.ts`:** a API devolve dois tipos de campo temporal. Colunas
`date` (ex.: `data_nascimento`, `bazares.data`) chegam como
`"2018-06-15T00:00:00.000Z"` — o horário é artificial. Passar isso por
`new Date(...).toLocaleDateString()` converte de UTC para o fuso local e mostra o
**dia anterior**. Use `formatarDataPura` / `paraInputDate` para esses campos e
`formatarTimestamp` para timestamps reais (`criado_em`, `data_triagem`,
`data_hora`).

---

## 3. Como rodar local

### Pré-requisitos

- Node.js >= 18 e npm >= 9
- Um PostgreSQL acessível (local ou a instância do Supabase do projeto)

### 3.1 Backend

```bash
cd backend

# 1. Copie o arquivo de exemplo de variáveis de ambiente
cp .env.example .env

# 2. Edite o .env com os dados reais (ver seção 4)
#    - DATABASE_URL apontando para o seu Postgres
#    - JWT_SECRET com um valor próprio, longo e aleatório

# 3. Instale as dependências (o postinstall já roda `prisma generate`)
npm install

# 4. Gere o Prisma Client (redundante se o postinstall rodou, mas inofensivo)
npx prisma generate

# 5. Suba a API
npm run start:dev
```

A API sobe em `http://localhost:3000` (ou na porta definida em `PORT`).
Confira acessando `http://localhost:3000/` — deve responder o health check.

#### Sobre o schema do banco

**Não existe pasta `prisma/migrations` neste repositório.** O `schema.prisma` foi
gerado por introspecção (`prisma db pull`) a partir do banco que já estava no
Supabase. Consequências práticas:

- Se você vai usar **o banco do Supabase já existente**, não precisa fazer nada:
  o schema já corresponde ao banco.
- Se você vai criar um **banco novo e vazio** (local ou outro), rode:

  ```bash
  npx prisma db push
  ```

  Isso cria as tabelas a partir do `schema.prisma`. Atenção: `db push` **não**
  recria as *check constraints* que existem no banco original (os comentários
  `This table contains check constraints...` no schema marcam essas tabelas). As
  validações equivalentes existem nos DTOs do backend, mas o banco novo ficará
  mais permissivo que o de produção.
- `npx prisma migrate deploy` (citado no README da raiz) **não funciona** aqui,
  porque não há migrations versionadas. Isso está listado como pendência na
  seção 10.

#### Dados de demonstração (seed)

```bash
npm run seed
```

⚠️ O seed **apaga todos os dados existentes** antes de inserir (prontuários,
agendamentos, queixas, encaminhamentos, triagens, doações, bazares, doadores,
perfis, beneficiárias e usuários). Nunca rode contra o banco de produção.

Ele cria 5 usuários fictícios, todos com a senha pública de demonstração
`NaveDemo@2026`:

| E-mail | Perfis | Especialidade |
|--------|--------|---------------|
| `gestora.demo@example.com` | GESTORA | — |
| `profissional.psi.demo@example.com` | PROFISSIONAL | Psicologia |
| `profissional.social.demo@example.com` | PROFISSIONAL | Assistência Social |
| `profissional.fisio.demo@example.com` | PROFISSIONAL | Fisioterapia |
| `triadora.demo@example.com` | TRIADORA | — |

### 3.2 Frontend

```bash
cd frontend

# 1. Copie o arquivo de exemplo
cp .env.example .env.local

# 2. Edite .env.local apontando para a URL do backend
#    NEXT_PUBLIC_API_URL=http://localhost:3000

# 3. Instale as dependências
npm install

# 4. Suba a interface na porta 3001
npm run dev -- -p 3001
```

Acesse `http://localhost:3001` e faça login.

> **Atenção à porta.** O `next dev` sobe na porta 3000 por padrão, que é a mesma
> porta padrão do backend. Além disso, o backend só libera CORS para a origem
> definida em `FRONTEND_URL` (padrão `http://localhost:3001`). Por isso o comando
> acima força `-p 3001`. Se você mudar a porta do frontend, ajuste `FRONTEND_URL`
> no `.env` do backend — senão o navegador bloqueia todas as chamadas.
>
> Os `README.md` de `backend/` e `frontend/` estão desatualizados quanto a portas
> e variáveis. O `README.md` da raiz e os `.env.example` são a referência correta.

### 3.3 Ordem recomendada

1. Banco de dados no ar e `backend/.env` configurado.
2. Schema aplicado (`prisma db push`) se o banco for novo.
3. `npm run seed` no backend, se quiser dados de demonstração.
4. Backend rodando (`npm run start:dev`).
5. `frontend/.env.local` apontando para o backend.
6. Frontend rodando (`npm run dev -- -p 3001`).

---

## 4. Variáveis de ambiente

### `backend/.env`

| Variável | Obrigatória | O que faz |
|----------|-------------|-----------|
| `DATABASE_URL` | **Sim** | String de conexão do PostgreSQL, no formato do Prisma: `postgresql://usuario:senha@host:porta/banco`. É lida em dois lugares: pelo `PrismaService` (que abre o pool de conexões da API, com `max: 3` conexões e `idleTimeoutMillis: 10000`) e pelo Prisma CLI via `prisma.config.ts` (para `generate`, `db push`, `db pull`). Com Supabase, use a string do **Session Pooler**, não a conexão direta. |
| `JWT_SECRET` | **Sim** | Segredo usado para assinar e verificar os tokens JWT. A aplicação **não sobe** sem ele: a `JwtStrategy` usa `configService.getOrThrow('JWT_SECRET')` e lança erro na inicialização se estiver ausente. Trocar esse valor invalida todos os tokens já emitidos — todo mundo é deslogado. Use um valor longo e aleatório, diferente em cada ambiente, e nunca comite no Git. |
| `FRONTEND_URL` | Não (tem padrão) | Origem liberada no CORS (`app.enableCors({ origin: ... })` em `main.ts`). Se não for definida, o padrão é `http://localhost:3001`. Se o valor não bater exatamente com a URL de onde o frontend é servido (incluindo protocolo e porta), o navegador bloqueia as requisições e a tela fica em branco ou dá erro de conexão. |
| `PORT` | Não (tem padrão) | Porta em que a API escuta. Padrão: `3000`. |

### `frontend/.env.local`

| Variável | Obrigatória | O que faz |
|----------|-------------|-----------|
| `NEXT_PUBLIC_API_URL` | Não (tem padrão) | URL base da API do backend, usada por todas as chamadas do frontend (`lib/api.ts`). Padrão: `http://localhost:3000`. O prefixo `NEXT_PUBLIC_` faz o valor ser embutido no bundle enviado ao navegador — ou seja, ele é **público**; nunca coloque segredo nenhum em variável com esse prefixo. Como o valor é fixado no momento do build, mudar a URL em produção exige um novo build. |

---

## 5. Modelo de dados

Todas as tabelas usam `id` UUID gerado pelo banco (`gen_random_uuid()`) e a
maioria tem `criado_em` com `now()`. Nomes de tabelas e colunas são em
português, em snake_case.

### Tabelas principais

**`usuarios`** — a equipe da ONG (não as beneficiárias).
`nome`, `email` (único), `senha_hash` (bcrypt), `especialidade`, `ativo`,
`deletado_em` (soft delete).

**`perfis_usuario`** — perfis de acesso de um usuário. Um usuário pode ter
vários (ex.: PROFISSIONAL + TRIADORA). Valores usados: `GESTORA`, `TRIADORA`,
`PROFISSIONAL`. Cascade ao apagar o usuário.

**`beneficiarias`** — quem é atendida pela ONG.
`nome`, `cpf` (único, opcional), `data_nascimento`, `telefone`, `endereco`,
`tipo` (`ADULTA` | `ADOLESCENTE` | `CRIANCA`), `status` (`ATIVA` | `EM_ESPERA` |
`ENCERRADA` | `DESISTENTE`), dados socioeconômicos (`estado_civil`,
`escolaridade`, `raca`, `ocupacao`, `empregada`), `responsavel_id`
(auto-relação: uma criança/adolescente aponta para a beneficiária adulta
responsável) e `deletado_em` (arquivamento).

**`triagens`** — o acolhimento inicial. Liga `beneficiaria_id` a `triador_id`
(usuário que atendeu) e guarda `data_triagem`.

**`queixas`** — o conteúdo da triagem: `queixa_principal`, `queixa_secundaria`,
`sintomas`, `tipo_violencia`, `observacoes`. Uma triagem pode ter várias.

**`encaminhamentos`** — encaminha uma triagem para uma `especialidade`
(`PSICOLOGIA`, `ASSISTENCIA_SOCIAL`, `ACUPUNTURA`, `FISIOTERAPIA`, `FEPAD`).
`status` começa em `PENDENTE` e vira `AGENDADO` quando um agendamento é criado
vinculado a ele. Regra de negócio: não pode haver dois encaminhamentos para a
mesma especialidade na mesma triagem.

**`agendamentos`** — atendimento marcado. Liga `beneficiaria_id` (opcional),
`profissional_id` (obrigatório) e `encaminhamento_id` (opcional).
`data_hora`, `status` (`AGENDADO` | `CONFIRMADO` | `REALIZADO` | `CANCELADO`),
`observacoes`. Regra de negócio: o mesmo profissional não pode ter dois
agendamentos não-cancelados dentro de uma janela de ±30 minutos.

**`prontuarios`** — o registro clínico. Liga beneficiária, profissional e
(opcionalmente) o agendamento. Tem `especialidade` e `descricao`, e no máximo uma
ficha detalhada de cada tipo:

- `prontuarios_psicologia_adulto` — anamnese completa (identificação, queixa,
  histórico, exame psíquico, síntese). É a maior tabela do sistema.
- `prontuarios_psicologia_crianca` — anamnese infantil, com um campo
  `dados_json` para as seções extras.
- `prontuarios_fisioterapia` — caso clínico, sinais vitais, avaliação física,
  escala de dor, objetivo e recursos terapêuticos.
- `prontuarios_acupuntura` — ficha reduzida.

Todas as quatro têm `prontuario_id` único e cascade ao apagar o prontuário.

### Financeiro

**`doadores`** — `nome`, `tipo` (`PESSOA_FISICA` | `PESSOA_JURIDICA`),
`telefone`, `email`, `deletado_em`.

**`doacoes`** — `tipo` (`DINHEIRO` | `ALIMENTO` | `ROUPA` | `OUTRO`), `valor`,
`quantidade`, `data`, opcionalmente ligada a um doador e a uma campanha.

**`campanhas_doacoes`** — `nome`, `descricao`, `meta_valor`, `encerrada_em`.

**`bazares`** — `nome`, `data`, `horario_inicio`/`horario_fim`, `local`,
`descricao`, `total_arrecadado`.

**`bazar_profissionais`** — tabela de junção entre bazar e usuários que
trabalharam nele (par único, cascade dos dois lados).

### Relações principais

```
usuarios ──1:N── perfis_usuario
usuarios ──1:N── triagens (como triador)
usuarios ──1:N── agendamentos (como profissional)
usuarios ──1:N── prontuarios (como profissional)
usuarios ──N:N── bazares (via bazar_profissionais)

beneficiarias ──1:N── triagens
beneficiarias ──1:N── agendamentos
beneficiarias ──1:N── prontuarios
beneficiarias ──1:N── beneficiarias (responsavel_id: adulta → criança/adolescente)

triagens ──1:N── queixas
triagens ──1:N── encaminhamentos
encaminhamentos ──1:N── agendamentos
agendamentos ──1:0..1── prontuarios

prontuarios ──1:1── prontuarios_psicologia_adulto
            ──1:1── prontuarios_psicologia_crianca
            ──1:1── prontuarios_fisioterapia
            ──1:1── prontuarios_acupuntura

doadores ──1:N── doacoes ──N:1── campanhas_doacoes
```

### Regra de exclusão de beneficiária

Excluir uma beneficiária é **sempre soft delete**: o `DELETE /beneficiarias/:id`
apenas preenche `deletado_em`. As foreign keys de `triagens` e `prontuarios`
para `beneficiarias` são `RESTRICT` de propósito — um delete físico falha em vez
de arrastar o histórico clínico junto. A beneficiária arquivada some das
listagens, mas continua consultável em
`GET /beneficiarias/:id?incluir_arquivadas=true`, que é o que alimenta a tela de
histórico.

---

## 6. Endpoints por módulo

Base: `http://localhost:3000` (ou o valor de `PORT`).

Legenda da coluna **Acesso**:
- **Público** — não exige token (`@Public()`).
- **Autenticado** — exige token válido, sem restrição de perfil.
- **GESTORA / TRIADORA / PROFISSIONAL** — exige token **e** um desses perfis
  (`RolesGuard`).

### Health

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/` | Público | Health check. |

### Auth (`/auth`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/auth/login` | Público | Recebe `{ email, senha }`. Valida contra usuários com `ativo: true` e `deletado_em: null`. Devolve `{ access_token, usuario }`. |
| GET | `/auth/me` | Autenticado | Devolve os dados do usuário extraídos do token. |

### Beneficiárias (`/beneficiarias`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/beneficiarias` | Autenticado | Cria beneficiária. `tipo` e `status` têm padrão `ADULTA` / `ATIVA`. |
| GET | `/beneficiarias` | Autenticado | Lista as não arquivadas. Com `?tipo=`, `?busca=` (nome, case-insensitive) ou `?responsavel_id=` devolve uma versão reduzida (id, nome, cpf, tipo, status). |
| GET | `/beneficiarias/buscar?busca=` | GESTORA, TRIADORA, PROFISSIONAL | Busca por nome entre todas as beneficiárias ativas e devolve somente id, nome e cpf. |
| GET | `/beneficiarias/:id` | Autenticado | Detalhe. `?incluir_arquivadas=true` traz também as arquivadas. |
| PATCH | `/beneficiarias/:id` | Autenticado | Atualização parcial. |
| DELETE | `/beneficiarias/:id` | Autenticado | **Arquiva** (soft delete). Idempotente. |

### Triagens (`/triagens`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/triagens` | Autenticado | Lista com beneficiária, queixas, triadora e encaminhamentos. Filtro `?beneficiaria_id=`. |
| GET | `/triagens/:id` | Autenticado | Detalhe completo. |
| POST | `/triagens` | Autenticado | Valida que a beneficiária e a triadora existem e não estão arquivadas. `data_triagem` é opcional (padrão: agora). |

### Queixas (`/queixas`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/queixas` | Autenticado | Cria queixa vinculada a uma triagem. |
| GET | `/queixas` | Autenticado | Lista todas. |
| GET | `/queixas/:id` | Autenticado | Detalhe. |
| GET | `/queixas/triagem/:triagem_id` | Autenticado | Queixas de uma triagem. |

### Encaminhamentos (`/encaminhamentos`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/encaminhamentos/pendentes` | GESTORA, TRIADORA | Triagens que ainda não geraram nenhum encaminhamento. |
| GET | `/encaminhamentos/historico` | GESTORA, TRIADORA | Todos os encaminhamentos já feitos. |
| POST | `/encaminhamentos` | GESTORA, TRIADORA | Cria com `status: PENDENTE`. Retorna 409 se já existir encaminhamento para a mesma especialidade naquela triagem. |

### Agendamentos (`/agendamentos`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/agendamentos` | GESTORA, TRIADORA | Filtros: `data_inicio`, `data_fim`, `profissional_id`, `beneficiaria_id`, `status`. |
| GET | `/agendamentos/meus` | **PROFISSIONAL** | Agenda do usuário logado. |
| GET | `/agendamentos/:id` | GESTORA, TRIADORA | Detalhe. |
| POST | `/agendamentos` | GESTORA, TRIADORA, PROFISSIONAL | Cria e, se houver `encaminhamento_id`, marca o encaminhamento como `AGENDADO` (na mesma transação). Para um usuário somente PROFISSIONAL, o profissional vem do token. Retorna 409 em conflito de ±30 min do profissional. |
| PATCH | `/agendamentos/:id` | GESTORA, TRIADORA, PROFISSIONAL | Um usuário só-PROFISSIONAL só edita os próprios agendamentos (403 caso contrário). |
| DELETE | `/agendamentos/:id` | GESTORA, TRIADORA | Exclusão física. Responde 204. |

> Note que `/agendamentos/meus` declara `@Roles('PROFISSIONAL')`, o que
> **substitui** (não soma) a regra da classe. Uma GESTORA sem o perfil
> PROFISSIONAL recebe 403 nessa rota específica.

### Prontuários (`/prontuarios`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/prontuarios` | Autenticado | Cria o prontuário e, conforme o corpo, a ficha da especialidade (`psicologia_adulto`, `psicologia_crianca`, `fisioterapia`, `acupuntura`, `psicologia`). |
| GET | `/prontuarios` | Autenticado | Lista todos. |
| GET | `/prontuarios/meus` | Autenticado | Prontuários do profissional logado. |
| GET | `/prontuarios/profissional/:profissional_id` | Autenticado | Por profissional. |
| GET | `/prontuarios/beneficiaria/:beneficiaria_id` | Autenticado | Por beneficiária (usado na tela de histórico). |
| GET | `/prontuarios/:id` | Autenticado | Detalhe com as fichas. |
| PATCH | `/prontuarios/:id` | Autenticado | Atualização parcial. |
| DELETE | `/prontuarios/:id` | Autenticado | Exclusão física (a ficha vinculada cai por cascade). |

### Usuários (`/usuarios`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/usuarios` | GESTORA | Lista a equipe com perfis. |
| GET | `/usuarios/profissionais` | GESTORA, TRIADORA | Só quem tem perfil PROFISSIONAL — alimenta os seletores de agenda e bazar. |
| GET | `/usuarios/:id` | GESTORA | Detalhe. |
| POST | `/usuarios` | GESTORA | Cria usuário. Senha com mínimo de 6 caracteres, hash bcrypt. `perfis` é obrigatório e não pode ser vazio. |
| PATCH | `/usuarios/:id` | GESTORA | Atualiza dados, senha, `ativo` e perfis. |
| DELETE | `/usuarios/:id` | GESTORA | Remove/desativa usuário. |

### Doadores (`/doadores`)

| Método | Rota | Acesso |
|--------|------|--------|
| GET | `/doadores` | GESTORA, TRIADORA, PROFISSIONAL |
| GET | `/doadores/:id` | GESTORA, TRIADORA, PROFISSIONAL |
| POST | `/doadores` | GESTORA, TRIADORA |
| PATCH | `/doadores/:id` | GESTORA, TRIADORA |
| DELETE | `/doadores/:id` | GESTORA |

### Doações (`/doacoes`)

| Método | Rota | Acesso |
|--------|------|--------|
| GET | `/doacoes` | GESTORA, TRIADORA, PROFISSIONAL |
| GET | `/doacoes/:id` | GESTORA, TRIADORA, PROFISSIONAL |
| POST | `/doacoes` | GESTORA, TRIADORA |
| PATCH | `/doacoes/:id` | GESTORA, TRIADORA |
| DELETE | `/doacoes/:id` | GESTORA |

### Campanhas de doação (`/campanhas-doacoes`)

| Método | Rota | Acesso |
|--------|------|--------|
| GET | `/campanhas-doacoes` | GESTORA, TRIADORA, PROFISSIONAL |
| GET | `/campanhas-doacoes/:id` | GESTORA, TRIADORA, PROFISSIONAL |
| POST | `/campanhas-doacoes` | GESTORA |
| PATCH | `/campanhas-doacoes/:id` | GESTORA |
| DELETE | `/campanhas-doacoes/:id` | GESTORA |

### Bazares (`/bazares`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/bazares` | GESTORA, TRIADORA, PROFISSIONAL | Filtros: `data_inicio`, `data_fim`, `local`, `nome`. |
| GET | `/bazares/:id` | GESTORA, TRIADORA, PROFISSIONAL | |
| POST | `/bazares` | GESTORA | `profissional_ids` é obrigatório (pode ser lista vazia). |
| PATCH | `/bazares/:id` | GESTORA | |
| DELETE | `/bazares/:id` | GESTORA | Responde 204. |

### Dashboard (`/dashboard`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/dashboard/stats?period=hoje\|semana\|mes` | Autenticado | O formato da resposta **muda conforme o perfil** do usuário do token: GESTORA (visão geral + financeiro), TRIADORA (triagens e fila de espera) ou PROFISSIONAL (agenda própria). Padrão de `period`: `semana`. |

---

## 7. Autenticação e controle de acesso

O sistema guarda dado clínico sensível — laudo psicológico, histórico de
violência, prontuário. O modelo de acesso foi montado para ser **fechado por
padrão**: uma rota nova nasce protegida, e só fica aberta se alguém escrever
explicitamente que ela deve ficar.

### 7.1 Guard global (`APP_GUARD`)

Em `src/app.module.ts`:

```typescript
providers: [
  // Autenticação obrigatória por padrão em toda a aplicação. Rotas que devem
  // ser acessíveis sem token precisam do decorator `@Public()`.
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  AppService,
],
```

Registrar o `JwtAuthGuard` como `APP_GUARD` faz o Nest aplicá-lo a **todas** as
rotas da aplicação, em todos os módulos, inclusive os que forem criados no
futuro. Sem um header `Authorization: Bearer <token>` válido, a resposta é 401
antes de qualquer código de controller rodar.

> ⚠️ **Isto é a trava principal do sistema.** Remover essa linha — ou trocar o
> registro global por `@UseGuards(JwtAuthGuard)` espalhado controller a controller
> — reabre imediatamente, para a internet inteira e sem nenhum login,
> `/beneficiarias`, `/triagens`, `/queixas` e `/prontuarios`, que são justamente
> os endpoints com CPF, endereço, relato de violência e laudo clínico. Foi
> exatamente esse buraco que o commit "Segurança: guard de autenticação global"
> fechou. Se você precisar mexer aqui, a pergunta certa não é "como faço para
> essa rota funcionar sem token", é "qual perfil deveria poder chamar essa rota".

### 7.2 `@Public()` — as exceções

`src/auth/public.decorator.ts` marca as rotas que devem passar sem token. O
`JwtAuthGuard` consulta essa marcação via `Reflector` e, se encontrar, libera:

```typescript
canActivate(context: ExecutionContext) {
  const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
    context.getHandler(),
    context.getClass(),
  ]);
  if (isPublic) return true;
  return super.canActivate(context);
}
```

Hoje, exatamente **duas** rotas usam `@Public()`:

- `POST /auth/login` — precisa ser pública, é onde o token é obtido.
- `GET /` — health check.

Toda vez que um `@Public()` novo aparecer no código, é uma decisão de segurança
que merece revisão explícita: aquela rota vai responder para qualquer pessoa na
internet.

### 7.3 `RolesGuard` — restrição por perfil

O guard global responde "quem é você?". O `RolesGuard` responde "você pode fazer
isso?". Ele **não** é global: precisa ser ligado no controller com
`@UseGuards(RolesGuard)` e combinado com `@Roles(...)`:

```typescript
@Controller('usuarios')
@UseGuards(RolesGuard)
@Roles('GESTORA')          // vale para todo o controller
export class UsuariosController {

  @Get('profissionais')
  @Roles('GESTORA', 'TRIADORA')   // sobrescreve a regra da classe nesta rota
  findProfissionais() { ... }
}
```

Regras de funcionamento:

- Sem `@Roles`, o `RolesGuard` libera (só o token já basta).
- `@Roles` no método **substitui** o `@Roles` da classe — não soma. Foi o que
  aconteceu em `GET /agendamentos/meus`.
- A checagem é "tem pelo menos um dos perfis exigidos", lendo `req.user.perfis`,
  que vem do payload do JWT.

### 7.4 Fluxo do token

1. O frontend chama `POST /auth/login`.
2. O backend confere a senha com bcrypt e assina um JWT com
   `{ sub, email, nome, perfis }`, válido por **8 horas**.
3. O frontend guarda `access_token` e `usuario` no `localStorage`.
4. Toda chamada seguinte passa por `fetchAuth` (`lib/auth.ts`), que injeta
   `Authorization: Bearer <token>`. Se a resposta for 401, o frontend limpa o
   `localStorage` e manda o usuário para `/login`.
5. A `JwtStrategy` valida assinatura e expiração e popula `req.user`.

### 7.5 Camada do frontend — conveniência, não segurança

`components/LayoutShell.tsx` mantém um mapa `ROUTE_PERFIS` e redireciona quem
não tem perfil para a raiz; `components/Sidebar.tsx` esconde os itens de menu que
o usuário não pode acessar. Isso serve para a experiência de uso.

**Isso não protege nada.** Roda no navegador, em cima de um `localStorage` que o
próprio usuário pode editar. A proteção real é, e tem que continuar sendo, os
guards do backend. Sempre que uma regra de perfil for adicionada no
`ROUTE_PERFIS`, a regra correspondente precisa existir também no controller
(ver pendências na seção 10).

---

## 8. Implementado vs. Pendente

### Implementado

**Autenticação e acesso**
- Login com e-mail e senha, hash bcrypt, JWT de 8 horas.
- Guard de autenticação global (`APP_GUARD`) — padrão fechado.
- `@Public()` restrito a login e health check.
- `RolesGuard` + `@Roles` em usuários, encaminhamentos, agendamentos, bazares,
  doações, doadores e campanhas.
- Só usuários com `ativo: true` e `deletado_em: null` conseguem logar.
- Múltiplos perfis por usuário.

**Beneficiárias**
- CRUD completo com dados socioeconômicos.
- Busca por nome e filtros por tipo e responsável.
- Vínculo responsável → criança/adolescente.
- Arquivamento por soft delete, com histórico clínico preservado e consultável
  (`?incluir_arquivadas=true`) — tela de histórico no frontend.

**Triagem e encaminhamento**
- Wizard de nova triagem no frontend, com opção de cadastrar a beneficiária no
  mesmo fluxo.
- Queixas com queixa principal/secundária, sintomas e tipo de violência.
- Fila de triagens pendentes de encaminhamento.
- Encaminhamento para 5 especialidades, com bloqueio de duplicata por
  especialidade e histórico de encaminhamentos.

**Agenda**
- CRUD de agendamentos com filtros por data, profissional, beneficiária e status.
- Detecção de conflito de horário do profissional (janela de ±30 min).
- Encaminhamento vira `AGENDADO` automaticamente ao ser agendado (transação).
- Profissional só edita a própria agenda.
- Visão "minha agenda" para o perfil PROFISSIONAL.

**Prontuários**
- Prontuário genérico + quatro fichas especializadas (psicologia adulto,
  psicologia criança, fisioterapia, acupuntura).
- Consulta por profissional e por beneficiária.
- Geração de PDF com seleção de seções.

**Financeiro**
- Doadores, doações, campanhas com meta e bazares (com equipe vinculada).

**Dashboard**
- Visões distintas para GESTORA, TRIADORA e PROFISSIONAL, com filtro de período
  (hoje / semana / mês) e gráficos.

**Qualidade**
- `ValidationPipe` global com `whitelist` e `forbidNonWhitelisted` — campo não
  declarado no DTO é rejeitado com 400.
- Tratamento de fuso horário para data pura vs. timestamp (`lib/date.ts`).
- Testes unitários em dashboard (16 casos), bazares (6) e usuários (2).

### Pendente

**Segurança — prioridade alta**
- `beneficiarias`, `triagens`, `queixas`, `prontuarios` e `dashboard` **não
  usam `RolesGuard`**. Qualquer usuário autenticado, de qualquer perfil, acessa
  esses endpoints direto pela API. A restrição por perfil dessas telas existe
  apenas no `ROUTE_PERFIS` do frontend, que não protege nada. Na prática, uma
  usuária com perfil só TRIADORA pode ler prontuários clínicos chamando
  `GET /prontuarios` fora da interface.
- Não há regra de "cada profissional vê só os próprios prontuários" no backend —
  `GET /prontuarios` devolve todos.
- Não há refresh token nem revogação: o JWT de 8h vale até expirar, mesmo que o
  usuário seja desativado depois de logar.
- O token fica em `localStorage`, exposto a XSS. Cookie `httpOnly` seria mais
  seguro.
- Não há rate limiting em `/auth/login` (força bruta).
- RLS do Supabase citada como segunda camada na documentação interna, mas não há
  nada no repositório que configure ou verifique isso.

**Banco de dados**
- **Não existem migrations versionadas.** O `schema.prisma` veio de introspecção
  e o `prisma.config.ts` aponta para uma pasta `prisma/migrations` que não existe.
  Não há como recriar o banco de forma reprodutível nem versionar mudanças de
  schema. `prisma migrate deploy`, citado no README da raiz, não funciona.
- As *check constraints* existem no banco de produção mas não no schema —
  um banco recriado por `db push` fica mais permissivo.
- Vários campos que são conjuntos fechados (`status`, `tipo`, `especialidade`,
  `perfil`) são `VarChar` livres em vez de enum.

**Funcionalidades**
- Não há recuperação de senha nem troca de senha pela própria usuária (só a
  GESTORA altera, via edição de usuário).
- `DELETE /agendamentos/:id` e `DELETE /prontuarios/:id` são exclusão física, sem
  soft delete nem trilha de auditoria.
- Não há log de auditoria (quem viu / alterou qual prontuário).
- Não há paginação em nenhuma listagem — `GET /prontuarios` e `GET /triagens`
  carregam a tabela inteira com todos os relacionamentos.
- `GET /triagens` retorna `usuarios: true` completo, incluindo `senha_hash` no
  objeto da triadora. Precisa de `select` explícito.
- Não há exportação de relatórios além do PDF de prontuário.

**Infra e documentação**
- `backend/README.md` e `frontend/README.md` estão desatualizados (portas erradas
  e variáveis `DB_HOST`/`DB_PORT`/`DB_USER` que o código não usa).
- Conflito de porta padrão entre backend e frontend (ambos 3000) — exige
  `-p 3001` manual no frontend.
- Cobertura de testes baixa: nenhum teste em auth, agendamentos, triagens,
  encaminhamentos ou prontuários; o e2e é o esqueleto padrão do Nest.
- Não há CI, Dockerfile nem script de deploy no repositório.
- Não há backup automatizado (ver seção 10).

---

## 9. Melhorias sugeridas

<!-- Seção reservada — a preencher. -->

---

## 10. Backup

### O Supabase no plano gratuito não faz backup automático

Este é o ponto mais importante desta seção. O plano **Free** do Supabase **não
inclui backups automáticos** — não há snapshot diário nem point-in-time
recovery. Se o banco for apagado, corrompido, ou se alguém rodar
`npm run seed` apontando para produção (o seed começa apagando tudo), **os dados
não voltam**. Não existe botão de restaurar.

Traduzindo para o contexto: o histórico de triagem, os laudos e os prontuários de
todas as beneficiárias dependem de alguém rodar o backup manual. Enquanto o
projeto estiver no plano gratuito, **backup manual periódico não é opcional**.

Recomendação mínima: um `pg_dump` por semana, guardado fora do Supabase (e, de
preferência, em mais de um lugar).

### Backup manual com `pg_dump`

Requer o cliente PostgreSQL instalado (`brew install postgresql@16` no macOS, ou
`apt install postgresql-client`). Use a mesma connection string do
`DATABASE_URL`, mas prefira a **conexão direta** do Supabase (Database →
Settings → Connection string → URI), não o pooler.

```bash
# Backup completo (schema + dados), formato SQL puro
pg_dump "postgresql://USUARIO:SENHA@HOST:5432/postgres" \
  --no-owner --no-privileges \
  --file=backup_nave_$(date +%Y-%m-%d).sql
```

Variações úteis:

```bash
# Formato comprimido (menor e restaurável seletivamente)
pg_dump "$DATABASE_URL" --no-owner --no-privileges \
  --format=custom --file=backup_nave_$(date +%Y-%m-%d).dump

# Somente os dados (sem recriar as tabelas)
pg_dump "$DATABASE_URL" --data-only --no-owner \
  --file=dados_nave_$(date +%Y-%m-%d).sql

# Somente o schema (útil para versionar a estrutura)
pg_dump "$DATABASE_URL" --schema-only --no-owner \
  --file=schema_nave_$(date +%Y-%m-%d).sql
```

### Restauração

```bash
# A partir de um arquivo .sql
psql "postgresql://USUARIO:SENHA@HOST:5432/postgres" -f backup_nave_2026-08-19.sql

# A partir de um .dump (formato custom)
pg_restore --no-owner --no-privileges \
  --dbname="postgresql://USUARIO:SENHA@HOST:5432/postgres" \
  backup_nave_2026-08-19.dump
```

Teste a restauração pelo menos uma vez, num banco vazio. Backup que nunca foi
restaurado é uma suposição, não um backup.

### Cuidados

- O arquivo de dump contém **todos os dados clínicos em texto plano**. Trate-o
  com o mesmo cuidado que o banco: não deixe em pasta compartilhada aberta, não
  anexe em e-mail, não comite no Git (o `.gitignore` não cobre `.sql`/`.dump`).
- Não coloque senha na linha de comando em ambiente compartilhado — ela fica no
  histórico do shell. Prefira exportar `DATABASE_URL` ou usar `~/.pgpass`.
- Se a versão do `pg_dump` local for mais antiga que a do servidor, o dump falha.
  Use um cliente de versão igual ou superior à do Postgres do Supabase.

---

## 11. Nota: o Supabase gratuito pausa por inatividade

Projetos no plano **Free** do Supabase são **pausados automaticamente após cerca
de 7 dias sem atividade** no banco. Quando isso acontece:

- A API do backend passa a falhar ao conectar. O sintoma no frontend é erro de
  conexão em todas as telas, ou a tela de login recusando o acesso mesmo com a
  senha certa.
- Não há perda de dados — o projeto fica suspenso, não apagado.

**Como reativar:**

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) e faça login.
2. Selecione o projeto — ele aparece marcado como *Paused*.
3. Clique em **Restore project** (ou **Resume**) e confirme.
4. A restauração leva de alguns minutos a algumas dezenas de minutos, dependendo
   do tamanho do banco.
5. Quando o status voltar para *Active*, reinicie o backend para reabrir o pool
   de conexões.

**Como evitar a pausa:**

- Qualquer atividade real no banco conta — se o sistema estiver em uso regular
  pela ONG, ele não pausa.
- Em períodos de recesso, um acesso simples por semana já basta.
- A solução definitiva é migrar para um plano pago (o Pro remove a pausa por
  inatividade e adiciona backups diários automáticos, o que também resolve o
  problema descrito na seção 10).
