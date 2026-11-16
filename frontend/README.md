# Frontend — Sistema NAVE

Interface web do Sistema NAVE: Next.js 16 (App Router), React 19, TypeScript e Tailwind CSS 4. A visão geral do projeto está no [README principal](../README.md).

## Rodando

Requisitos: Node.js 20.19+ e a API rodando (veja [`backend/`](../backend/README.md)).

~~~bash
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3000
~~~

| Variável | Padrão | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | URL da API. É embutida no bundle no build, então mudar o valor exige um novo build |

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Serve o build na porta 3000 |
| `npm run lint` | ESLint (o CI exige zero avisos) |

## Estrutura

~~~text
app/            Rotas: login, dashboard (/), beneficiarios, triagens, encaminhamentos,
                agenda, prontuarios, profissionais, usuarios, doacoes, bazares
components/     Layout e menu por perfil, modais, diálogos e o seletor de visibilidade do prontuário
lib/            Cliente HTTP e mensagens de erro (api.ts), sessão (auth.ts), formatadores,
                tipos e a geração segura do PDF de prontuário (prontuario-pdf.ts)
public/         Logos e modelo 3D da tela de login
~~~

## Decisões

- **A segurança fica na API.** O menu esconde o que o perfil não usa, mas toda autorização é feita no backend.
- **Erros legíveis.** `lib/api.ts` traduz as respostas da API (400 com lista de validações, 403, 404, 409, 429 e 5xx) em mensagens para quem usa o sistema.
- **PDF de prontuário sem injeção de HTML.** Todo valor passa por `escapeHtml`, e o documento abre por uma Blob URL com `noopener` e uma CSP própria.
- **Rascunhos clínicos efêmeros.** O rascunho da anamnese fica em `sessionStorage` e é apagado no logout.
