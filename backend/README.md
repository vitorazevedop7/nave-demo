# Backend — Sistema Nave

API REST do Sistema Nave, construída com [NestJS](https://nestjs.com) 11 e TypeScript.

## Pré-requisitos

- Node.js >= 18
- npm >= 9
- PostgreSQL ou MySQL em execução

## Configuração

Copie o arquivo de exemplo e preencha as variáveis:

```bash
cp .env.example .env
```

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta em que o servidor vai rodar (padrão: `3001`) |
| `DB_HOST` | Host do banco de dados |
| `DB_PORT` | Porta do banco de dados |
| `DB_USER` | Usuário do banco de dados |
| `DB_PASS` | Senha do banco de dados |
| `DB_NAME` | Nome do banco de dados |

## Como rodar

```bash
# Instalar dependências
npm install

# Modo desenvolvimento (hot reload) — porta 3001
npm run start:dev

# Modo normal
npm run start

# Modo produção (requer build prévia)
npm run build
npm run start:prod
```

## Scripts disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run start` | Inicia o servidor |
| `npm run start:dev` | Inicia com hot reload |
| `npm run start:prod` | Inicia a build de produção |
| `npm run build` | Compila o TypeScript |
| `npm run lint` | Verifica e corrige erros de lint |
| `npm run test` | Roda os testes unitários |
| `npm run test:e2e` | Roda os testes end-to-end |
| `npm run test:cov` | Roda testes com cobertura |
