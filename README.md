# Cúcuta Local Business Directory

A Spanish-language local business and services directory for Cúcuta and nearby areas
(Los Patios, Villa del Rosario, …). Consumers search — no account — for a product or
service and find nearby businesses on a map and as result cards, with direct WhatsApp/
phone contact. MK1GROUP and local editors maintain listings through a bilingual admin
dashboard.

Full product scope: [`cucuta-business-directory-mvp-scope.md`](./cucuta-business-directory-mvp-scope.md).
Frontend contract for Cursor: [`FRONTEND_HANDOFF.md`](./FRONTEND_HANDOFF.md).
Architecture notes: [`docs/architecture.md`](./docs/architecture.md).

## Stack

- **Next.js** (App Router, TypeScript) — public site, `/admin`, and API routes in one repo
- **Neon Postgres** with **PostGIS** (+ `pg_trgm`, `unaccent`, `fuzzystrmatch`)
- **Drizzle ORM** for schema, migrations and queries
- **Postgres-only search** (Spanish full-text + accent-insensitive + fuzzy + synonym tables)
- **MapLibre GL** for maps (vector-tile provider configurable)
- **Auth.js** + Google for admin sign-in (DB-backed allow-list)
- **Vercel Blob** for image storage; **Resend** for admin notifications
- Deployed on **Vercel**

## Prerequisites

- Node 22 (`nvm use`)
- Docker (for the local Postgres/PostGIS database)

## Local setup

```bash
nvm use
npm install
cp .env.example .env          # fill in values; generate AUTH_SECRET with `npx auth secret`
docker compose up -d          # starts Postgres + PostGIS on localhost:5432
npm run db:migrate            # apply migrations
npm run db:seed               # seed areas, starter categories, default settings
npm run admin:add -- you@example.com owner   # add yourself to the admin allow-list
npm run dev                   # http://localhost:3000
```

## Common tasks

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` / `npm run format:check` | Prettier write / check |
| `npm test` / `npm run test:watch` | Vitest |
| `npm run db:generate` | Generate a migration from schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Seed reference data |
| `npm run admin:add -- <email> [owner\|editor]` | Add / re-activate an admin allow-list entry |
| `npm run db:studio` | Drizzle Studio |

`SKIP_ENV_VALIDATION=1` skips environment validation for lint/typecheck/build steps that
do not need real credentials (used in CI).

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs typecheck, lint, format check,
migrations against a disposable PostGIS database, `drizzle-kit check`, tests, and a
production build on every push and pull request.
