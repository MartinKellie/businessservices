# Architecture

This document records the shape of the system and the decisions behind it. It is kept
current as behaviour and setup change. See the plan and `FRONTEND_HANDOFF.md` for the
build order and the frontend contract.

## Overview

A single Next.js (App Router) application deployed to Vercel:

- `src/app/(public)/**` — Spanish-only public directory (Cursor-owned UI)
- `src/app/admin/**` — bilingual admin dashboard (Cursor-owned UI, backend-guarded)
- `src/app/api/**` — HTTP APIs (backend-owned)
- `src/lib/**` — domain services, validation, shared types
- `src/db/**` — Drizzle schema, client, migrations, seed
- `drizzle/**` — SQL migrations

## Data layer

- **Neon Postgres** in preview/production; local/CI use `postgis/postgis` via
  `docker-compose.yml`. The Drizzle client (`src/db/index.ts`) picks the serverless driver
  for Neon and node-postgres otherwise (`DB_DRIVER` forces it).
- **Extensions:** `postgis` (geography + radius queries), `pg_trgm` (fuzzy matching),
  `unaccent` (accent-insensitive search), `fuzzystrmatch` (search tuning).
- **`f_unaccent(text)`** — an `IMMUTABLE` wrapper around `unaccent()` so it can be used in
  generated columns and expression indexes. **`search_normalise(text)`** — lower-case +
  unaccent + whitespace-collapse; must mirror `normaliseSearchText()` in `src/lib/text.ts`.

## Search (planned — Phase 4)

Postgres-only. Each searchable text (business name, category name, product/service name,
synonym term) has a normalised column (trigram-indexed) and a `spanish` `tsvector`
(GIN-indexed). Query flow: normalise → resolve synonyms to concept/category ids
(application-level expansion, not a PG thesaurus dictionary) → select candidate businesses
→ score (name > concept > category; exact > fuzzy) → filter by area or PostGIS radius →
apply result filters (open-now computed server-side in `America/Bogota`) → rank
(relevance → distance, temporarily-closed demoted) → paginate. Pins are returned as a
separate lightweight array.

## Domain model (Phase 1 — done)

Business identity and premises/location are **separate** concepts so relocation and
premises takeover need no schema change. MVP shows one active premises per business,
enforced by the partial unique index `premises_one_active_per_business`; history is kept
via `is_active` + `valid_from`/`valid_to`.

17 tables (`src/db/schema/*`, migration `0001_core_schema.sql`): `areas`, `businesses`,
`premises`, `opening_hours`, `categories`, `products_services`, `synonyms`,
`business_categories`, `business_products_services`, `admin_users`, `internal_notes`,
`contact_history`, `follow_ups`, `business_media`, `enquiries`, `enquiry_uploads`,
`system_settings`.

Notable invariants: one primary category per business
(`business_categories_one_primary`), one open follow-up per business
(`follow_ups_one_open_per_business`), synonym scope/target consistency
(`synonyms_scope_target` check), singleton `system_settings` row (`id = 'global'`).
`name_normalised` / `term_normalised` are `STORED GENERATED` via `search_normalise()`;
`search_vector` columns are generated `to_tsvector('spanish', f_unaccent(...))`. Trigram
GIN indexes back fuzzy matching, GIN indexes back full-text, GiST indexes back the
`geography(Point,4326)` columns.

**Auth.js tables are not used** — admin auth uses JWT sessions with the allow-list held in
`admin_users`, so no adapter/session tables are needed (Phase 2).

The Drizzle `customType` for `geography` emits a quoted type name in generated DDL, so the
two geography column lines in `0001_core_schema.sql` are hand-corrected; the schema
snapshot is unaffected and `drizzle-kit generate`/`check` stay clean.

## Auth (planned — Phase 2)

Auth.js v5 with the Google provider. The sign-in callback checks the email against
`admin_users` and loads the role (`owner` | `editor`). `/admin` and admin APIs are guarded
by the proxy (`src/proxy.ts`) plus per-route server checks. Public users never
authenticate.

## Integrations

- **Vercel Blob** — business media and enquiry uploads; nothing is public until an admin
  approves it (enforced at query time).
- **Resend** — transactional email to a shared MK1GROUP inbox on new enquiries.
- **MapLibre GL** — provider-agnostic; the vector-tile style URL is
  `NEXT_PUBLIC_MAP_STYLE_URL`. Tile provider to be chosen before public launch.
- **Vercel Cron** — nightly enquiry retention job (soft-delete at expiry, purge after the
  grace period, prune orphan uploads).

## Environments

| | Database | Notes |
|---|---|---|
| Local | docker-compose PostGIS | `.env`, `DB_DRIVER=node` |
| CI | ephemeral PostGIS service | `SKIP_ENV_VALIDATION=1` |
| Preview | Neon branch | per-PR via Vercel |
| Production | Neon primary | migrations run on deploy |

## Known follow-ups

- Vector-tile provider selection (MapLibre keeps this swappable).
- `drizzle-kit` pulls deprecated `@esbuild-kit/*` transitively (dev-only esbuild advisory);
  revisit when drizzle-kit drops them.
- Spanish legal/marketing copy is unresolved (scope §47).
