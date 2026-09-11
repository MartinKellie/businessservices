# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: a resident of Cúcuta or a nearby community (Los Patios, Villa del Rosario, and others) who needs a product or service nearby and may not know which local businesses exist or how to reach them. They arrive with a need (“I live here and I need a water cooler / plumber / bakery”), not an account.

Secondary audience (not this slice): MK1GROUP staff and local editors who maintain listings in a bilingual admin dashboard. No consumer accounts exist.

## Product Purpose

A Spanish-language local business and services directory for Cúcuta and nearby areas. It answers: “I live in this area and I’m looking for this product or service — where can I find it?”

Success is a consumer finding a relevant nearby business, seeing whether it is open when hours are known, and contacting it directly — especially WhatsApp or phone — without creating an account or leaving the search screen for a dedicated business page.

The directory is particularly for businesses with little or no online presence. The public site is for direct/local use, not search-engine discovery.

## Positioning

Search is not name-only. Queries match businesses, categories, shared product/service concepts, Spanish synonyms and colloquial terms, accents, and reasonable misspellings. Results appear as cards plus a map, with WhatsApp as a first-class contact action. Mobile/service businesses show a service area, never a residential address. There is no public login and no dedicated public business page.

## Operating Context

- Public site: Spanish only. Consumers search from a homepage or `/buscar`, optionally after granting device location (“Cerca de mí”).
- Search results stay on `/buscar`: desktop map + list with a draggable divider; mobile map/list toggle and an expandable bottom sheet.
- Device preferences (area, theme, pane split, mobile view) persist in `localStorage`. No account.
- Opening-hours “open now” is computed in `America/Bogota`.
- Admin (out of this slice): Google sign-in, allow-listed `owner` / `editor` roles, bilingual ES/EN via the `ADMIN_LOCALE` cookie.
- MK1GROUP maintains the catalogue; public attribution is a discreet “Powered by MK1GROUP”.

## Capabilities and Constraints

Confirmed:

- Public routes: `/` (search-first homepage), `/buscar` (map + list), static About / Advertise / Contact / legal (placeholders this slice).
- Public APIs: `GET /api/search`, `/api/areas`, `/api/categories`, `/api/businesses/:id`, `/api/settings/public`; `POST /api/enquiries`.
- Homepage: dominant search, area selector, “Cerca de mí”, popular categories, optional text-only announcement banner. No featured businesses.
- Result cards: name, categories, area, logo/photo or category icon, open/closed when hours known, contact actions, status labels. Full address only after expand or pin interaction.
- Filters: open now, category, area/distance, WhatsApp. No sort controls.
- Theme: light + dark; system default; local override wins before first paint.
- Maintenance Mode replaces the public shell; `/admin` stays reachable.
- Stack: Next.js App Router, TypeScript, Neon Postgres/PostGIS, MapLibre (style URL configurable), Vercel.

Explicitly undecided (do not invent):

- Public brand name and domain.
- Final Spanish copy for legal pages, About, Advertise, and any brand wordmark.
- Exact paid-placement / featured ranking (none in MVP).
- Map tile provider (build against `NEXT_PUBLIC_MAP_STYLE_URL`).

## Brand Commitments

- Public UI copy is Spanish; comments and docs are British English.
- Discreet “Powered by MK1GROUP” attribution; the public platform should feel like its own local directory, Cúcuta-focused.
- Neutral homepage — no featured or sponsored businesses at launch.
- WhatsApp is a prominent contact action, not a secondary afterthought.
- Service/mobile businesses never expose a residential address.

## Evidence on Hand

- Product contract: `FRONTEND_HANDOFF.md`, `cucuta-business-directory-mvp-scope.md`, `docs/architecture.md`.
- Seed data: areas, categories (lucide icon keys), example product/service concepts and synonyms.
- Live public APIs and typed search/detail shapes in `src/lib/services/search.ts` and `src/lib/services/public.ts`.
- No logo, wordmark, photography, testimonials, customer names, or legal copy. Do not fabricate brand claims, reviews, or prices.

## Product Principles

1. Search is the product — the homepage and results exist to get someone to a contact action.
2. Stay on the results screen — expand, do not navigate away to a business page.
3. Protect trust and privacy — no consumer accounts; hide addresses until the user asks; never show a service worker’s home.
4. Local and honest — Spanish, Cúcuta-first, open/closed only when hours are known, no invented featured listings.
5. Device memory, not identity — remember area, theme, and layout locally.

## Accessibility & Inclusion

- Public language is Spanish only; admin is bilingual because MK1GROUP and local collaborators both use it.
- Theme must follow the system preference by default and remain usable in light and dark.
- Location permission denial must fall back to the selected area and make that fallback obvious.
- Interactive map + list must remain usable when geolocation, map tiles, or images fail.
