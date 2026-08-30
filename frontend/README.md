# Frontend — Sistema Nave

Interface web do Sistema Nave, construída com [Next.js](https://nextjs.org) 16, React 19 e Tailwind CSS 4.

## Pré-requisitos

- Node.js >= 18
- npm >= 9
- Backend rodando em `http://localhost:3001`

## Configuração

Copie o arquivo de exemplo e preencha as variáveis:

```bash
cp .env.example .env.local
```

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_API_URL` | URL base da API do backend (ex: `http://localhost:3001`) |

## Como rodar

```bash
# Instalar dependências
npm install

# Modo desenvolvimento (hot reload) — porta 3000
npm run dev

# Build de produção
npm run build

# Rodar build de produção
npm start
```

Acesse `http://localhost:3000` no navegador.

## Scripts disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia em modo desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm start` | Roda o build de produção |
| `npm run lint` | Verifica erros de lint |
