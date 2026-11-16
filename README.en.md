# NAVE System

[![CI](https://github.com/vitorazevedop7/nave-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/vitorazevedop7/nave-demo/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-6A9E6E.svg)](LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)

[Português](README.md) · **English**

Management system for **Núcleo Assistencial Veleiro da Esperança (NAVE)**, a non-profit in Belo Horizonte, Brazil, that supports women, children and teenagers facing domestic violence. The organization used to run on paper forms and WhatsApp groups. Scheduling, intake, referrals, clinical records and donations now live in one system, with access control designed for sensitive clinical data.

> **Portfolio repository, published with the organization's permission.** The code is the same as the production system, but all data is fictional: no real client, staff member, donor or third party appears here.

<p align="center">
  <a href="docs/demo/nave-demo.mp4">
    <img src="docs/demo/nave-demo.gif" alt="NAVE System demo: manager login, intake, referral, scheduling and a clinical record with controlled visibility" width="900">
  </a>
  <br>
  <sub>▶ Click to watch the full video (MP4, 1080p, UI in Portuguese)</sub>
</p>

## Highlights

- **In real use.** It started as a university project and became the system the non-profit uses every day (see [History](#history)).
- **Clinical-record access by role × specialty.** Every record has one of four visibility levels, plus sharing with named people. When access is denied, the API returns only the record's metadata, never its content.
- **Security proven by tests.** End-to-end tests run against a real PostgreSQL database and cover the visibility matrix, role guards, access revocation for deactivated users and input validation.
- **Easy to evaluate.** `docker compose up --build` starts the database, API and UI with demo data already loaded. API docs are served at `/docs` (OpenAPI).
- **Full CI.** On every push, GitHub Actions runs lint, type checks, unit tests, migrations, e2e tests, builds and a smoke test of the Docker stack.

## Run it with one command

Requires Docker with Docker Compose.

~~~bash
git clone https://github.com/vitorazevedop7/nave-demo.git
cd nave-demo
docker compose up --build
~~~

| What | Where |
| --- | --- |
| UI | <http://localhost:3000> |
| API | <http://localhost:3001> |
| API docs (Swagger) | <http://localhost:3001/docs> |

Every demo user has the password **NaveDemo@2026**. It is public and exists only for the local demo.

| Role | E-mail |
| --- | --- |
| Manager (GESTORA) | `gestora.demo@example.com` |
| Practitioner, Psychology (PROFISSIONAL) | `profissional.psi.demo@example.com` |
| Intake worker (TRIADORA) | `triadora.demo@example.com` |

## Architecture

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Recharts |
| Backend | NestJS 11, Passport + JWT, class-validator, Swagger/OpenAPI, Helmet, Throttler |
| Data | PostgreSQL, Prisma 7 with the `pg` adapter, versioned migrations |
| Quality | Jest, Supertest, type-checked ESLint, Prettier, GitHub Actions, Docker |

Security is enforced on the backend. The UI hides menu items a role can't use, but that's a convenience, not protection. A global guard authenticates every route, and restricted routes also go through a `RolesGuard`. The token is checked against the database on every request, so a deactivated user loses access immediately instead of when the token expires.

The core flow follows a client through the organization: **registration → intake (complaint) → referral by specialty → appointment → session → clinical record**. Administrative modules cover users and roles, donors, donations, campaigns and charity bazaars.

## Clinical-record access control

There are three roles: **GESTORA** (manager), **TRIADORA** (intake worker) and **PROFISSIONAL** (practitioner). Each record has one of four visibility levels, chosen by the practitioner who wrote it:

| Visibility | Who can read the content |
| --- | --- |
| **PRIVADO** | Only the author, unless explicitly shared. |
| **ESPECIALIDADE** | Practitioners with the record's specialty. |
| **GESTORAS** | Users with the manager role. |
| **EQUIPE_CLINICA** | Managers and practitioners. |

Authorship and sharing with named people grant access at any level, and only the author can edit or delete a record. Role and specialty answer different questions: authorizing by role alone would open every clinical record to the whole team, and authorizing by specialty alone would leave out legitimate management duties. Combining them gives least privilege without getting in the way of the work.

## Quality and security

| | |
| --- | --- |
| Tests | 139 unit tests and 115 e2e tests (API + real PostgreSQL) |
| API | 63 REST routes documented with OpenAPI (`/docs`) |
| Authentication | JWT with the user re-validated against the database on every request, bcrypt, login rate limiting |
| Input | Whitelisted DTOs (unknown fields rejected), `ParseUUIDPipe`, Prisma errors mapped to 404/409 |
| Headers | Helmet; CORS restricted to the frontend origin |
| Sensitive data | Per-role data minimization, clinical drafts kept in `sessionStorage` and cleared on logout, clinical-record PDFs built with HTML escaping and a CSP |

## History

The system began in the first semester of 2026 as a project for the *Interdisciplinary Project: Applications for Sustainability* course in the Software Engineering program at PUC Minas, with the non-profit as a real client. The team was Vitor Augusto Viana Azevedo, Yan Araújo Resende, Lucas de Souza Pereira and Pedro Arthur Oliveira Silva. The project won the **Outstanding Project** award at the Mostra We Make Software showcase in September 2026.

After the course, the non-profit hired me to rebuild the system for real use. This repository is that version. It was published without its original commit history so that no real data from the organization would remain in Git history.

## Author

**Vitor Augusto Viana Azevedo**, Software Engineering student at PUC Minas and full-stack developer. Open to internships and freelance projects.
[LinkedIn](https://www.linkedin.com/in/vitorvianaazevedo) · [GitHub](https://github.com/vitorazevedop7)

Released under the [MIT License](LICENSE).
