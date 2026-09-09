# Frontend Handoff — Cúcuta Business Directory

This document is the contract between the backend (Claude Code) and the frontend
(Cursor). Cursor owns all design and frontend implementation; the backend owns the data
model, APIs, auth, integrations and business rules described here.

**Status:** Phase 0 (foundations). Route structure, layouts, i18n plumbing and a health
endpoint exist as scaffolding; every screen is a placeholder. API payloads marked _TBD_
are defined in later phases and this document is updated at the end of each phase whose
APIs change.

British English in code comments and docs; **all public UI copy is Spanish**.

---

## 1. Ground rules

- **Public site:** Spanish only. Not built for SEO / search-engine discovery.
- **Admin dashboard:** bilingual Spanish/English. Locale is stored in the `ADMIN_LOCALE`
  cookie (`es` | `en`), defaulting to `es`. Strings come from `next-intl`
  (`src/i18n/messages/{es,en}.json`) — Cursor adds keys as screens are built; backend
  keeps the catalogues structurally in sync.
- **No consumer accounts.** No public login anywhere.
- **No dedicated public business page.** Businesses are shown only as result cards with an
  expandable detail state, inside the search/map screen.
- **Theme:** light + dark on both public and admin. Default follows the device/system
  preference; a manual override is stored locally and must win. Applies before first paint
  (no flash).
- **Local device preferences** (no account) — persist in `localStorage`, all optional and
  resilient to being absent:
  | Key | Purpose |
  |---|---|
  | `pref.area` | selected community/area slug |
  | `pref.desktopSplit` | map/list divider position (%) |
  | `pref.desktopPane` | which pane is collapsed, if any (`none` \| `map` \| `list`) |
  | `pref.mobileView` | last-used mobile view (`map` \| `list`) |
  | `pref.theme` | `system` \| `light` \| `dark` |
  | `consent.cookies` | cookie-preference selections + timestamp |
  (Exact key names are a suggestion; agree final names with backend only if they need to be
  read server-side — currently none are.)

---

## 2. Tech context

- Next.js (App Router, TypeScript) — one repo. Cursor works in `src/app/(public)/**`,
  `src/app/admin/**`, and `src/components/**`.
- Backend surfaces live under `src/app/api/**`; shared types/enums will be exported from
  `src/lib/**` and a typed API client from `src/lib/api-contract` (added with the first
  real endpoint).
- Maps: **MapLibre GL JS**. The vector-tile style URL comes from
  `NEXT_PUBLIC_MAP_STYLE_URL` (provider not yet chosen — build against a configurable
  style URL, never hard-code a provider). Pin clustering is the frontend's responsibility;
  the search API returns a lightweight, separate `pins` array for this.
- Do not add a component/UI library without agreeing it first, but the choice of styling
  approach and design system is Cursor's.

---

## 3. Routes (scaffolded)

| Path | Screen | Notes |
|---|---|---|
| `/` | Homepage | search-first; area selector; “Cerca de mí”; popular categories; announcement banner; About/Advertise/contact links; “Powered by MK1GROUP” |
| `/buscar` | Search results | map + list; the core screen (see §5) |
| `/acerca` | About | static content |
| `/anunciate` | Advertise with us | static content + contact/WhatsApp route |
| `/contacto` | Public contact form | see §7 |
| `/privacidad` | Privacy Policy | content TBD (legal copy unresolved) |
| `/terminos` | Terms / Disclaimer | content TBD |
| `/admin` | Admin dashboard | bilingual; behind Google auth (see §8) |

Cookie banner + preferences panel: global on the public site (not a route).
Maintenance page: shown by the proxy for the whole public site when Maintenance Mode is
on (see §9); `/admin` stays reachable.

---

## 4. Homepage requirements

- Dominant “¿Qué estás buscando?” search field → navigates to `/buscar` with the query.
- Area/community selector (data: `GET /api/areas`). Selection persists locally and is the
  default area for searches.
- “Cerca de mí” action: request device geolocation. On grant, searches use the device
  coordinates + the global radius. On denial/failure, fall back to the selected area. Make
  the permission state and fallback obvious to the user.
- Popular/browsable categories (data: `GET /api/categories`) → each links to `/buscar`
  pre-filtered by that category.
- Announcement banner: text-only, fixed placement, shown only when enabled
  (`GET /api/settings/public`). No link/button in MVP.
- Links to About, Advertise, public contact. Discreet “Powered by MK1GROUP”.
- Neutral homepage — **no featured businesses** at launch.

---

## 5. Search / results screen (`/buscar`)

The result detail experience stays on this screen — never navigate away to a business page.

**Query inputs** (from URL search params; keep them shareable):
- `q` — free-text query
- `areaId` — selected area, OR `lat` + `lng` for “Cerca de mí”
- filters: `openNow` (bool), `categoryId`, `whatsapp` (bool)
- `page`

**Data:** `GET /api/search` returns (shape _TBD_, Phase 4) roughly:
- `results[]` — full cards (see §6)
- `pins[]` — `{ businessId, lat, lng, statusLabel }` lightweight markers for the map
- `total`, `page`, `pageSize`
- `appliedArea` / `appliedRadiusMeters` for display context

**Desktop:**
- Map and list both visible by default.
- Draggable divider between them; position persisted locally.
- Either pane can be collapsed/expanded; state persisted locally.
- Selecting a result card highlights the matching map pin; selecting a pin focuses/scrolls
  to the matching card. Two-way selection sync.

**Mobile:**
- Map view and list view with quick switching; last-used view persisted locally.
- Opening a business from the map uses a bottom sheet / detail panel that can expand; the
  map stays visible where practical.

**Filters:** Open now, Category, Area/distance context, WhatsApp available. No sort
controls. Empty-state (no results) and “location denied → using selected area” states
required.

---

## 6. Business result card

Card fields (all optional unless noted; full field list & types finalised Phase 3–5):

- Business **name** (required)
- Primary category (required) + additional categories where useful
- Area/community
- Logo **or** photo; if neither, a **category fallback image/icon**
- Opening status (`Abierto` / `Cerrado` / not shown) — only when hours are known
- Contact actions: phone, **WhatsApp** (prominent), email, website, Instagram, Facebook
- Business status label when not simply active:
  - `Temporalmente cerrado` — shown in results, clearly labelled, ranked lower
  - `Trasladado` (relocated) — old entry labelled “Movido”, points to the new location
  - permanently closed entries do **not** appear in category/product/service discovery
    (only findable by name)
- **Full address is hidden until the card is expanded / the map pin is interacted with.**
  Service/mobile businesses show a **service area**, never a residential address.

No description, prices, offers, or ratings in the MVP.

Expanded card / detail: `GET /api/businesses/:id` (Phase 5) — includes the address (for
physical businesses), full opening hours, all contact channels, and “Última actualización”
**only if** the global setting enables it.

---

## 7. Public contact form (`/contacto`)

- Enquiry type (required): `Añadir mi negocio` / `Actualizar mi ficha` / `Consulta de
  publicidad` / `Consulta general`.
- Fields: name, email, phone (optional), message, optional business name/reference.
- Optional **single image upload** (logo/photo): client-side check for accepted types and
  max size (exact limits from backend config, surfaced via the endpoint / a constants
  module — do not hard-code). Uploaded images are never shown publicly and require admin
  review.
- **Required Privacy Policy consent checkbox.** Submit is blocked until ticked; the
  consent state + text version is stored with the enquiry.
- Spam protection is mostly server-side; the form must include a **hidden honeypot field**
  (label it clearly in code) that real users never fill. No CAPTCHA in MVP.
- `POST /api/enquiries` (shape _TBD_, Phase 6). Handle: success, validation errors
  (per-field), rate-limited (`429`), and generic failure. Show a clear confirmation state.

---

## 8. Admin dashboard (`/admin`)

Bilingual (ES/EN) with a locale switcher that sets the `ADMIN_LOCALE` cookie.

**Auth:** Google sign-in only, restricted to an allow-list (Phase 2). Unauthenticated
users hitting `/admin` are redirected to sign-in; non-allow-listed Google accounts get a
clear “no access” screen. Two roles drive UI visibility:

- **Owner/Admin:** everything, incl. user/role management, System Settings, taxonomy
  approvals, imports/exports, destructive/archive actions.
- **Local Editor:** business CRUD, drafts, publish, photos, hours, contact-detail changes
  (subject to verification rules), notes, contact history, follow-ups; may **request** new
  taxonomy but cannot approve.

The backend enforces all of this server-side; the frontend hides controls the current
role cannot use. Session/role data exposed via the Auth.js session (Phase 2).

**Screens / capabilities** (APIs defined Phase 2–8):
- Global search across businesses.
- Business editor: identity, contact channels, primary + secondary categories,
  products/services, location (map pin picker + address, or service area for mobile
  businesses), logo/photos with review state, opening hours, verification panel (level,
  method, last-verified date, source — internal only), internal notes, contact history,
  follow-up date. Save draft / publish with validation (draft-minimum vs publish-minimum —
  Phase 3).
- Status management: Draft, Published/Active, Temporarily closed, Permanently closed,
  Relocated, Deleted/Archived (soft delete).
- Taxonomy management: categories, products/services, synonyms/aliases — each with a
  request → approve/reject queue (approval requirement is a per-type System Setting).
- Verification views: sortable/filterable by last-verified date; due & overdue follow-ups.
- Enquiries: one shared queue; filter by type and status (New / In progress / Closed);
  view uploads pending review.
- Import (CSV/Excel) with a review-before-publish step; Export (CSV/Excel).
- Admin search-preview: check whether a business surfaces for given keywords.
- System Settings (Owner only) — see §9.
- Admin user/role management (Owner only).

**States:** every list needs loading / empty / error; every mutation needs pending +
success + failure; optimistic updates only where safe.

---

## 9. System Settings & Maintenance Mode

`GET /api/settings/public` (Phase 5) exposes only what the public site needs:
`maintenanceMode`, `announcementBannerEnabled`, `announcementBannerText`,
`nearMeRadiusMeters`, `showLastUpdated`.

Admin System Settings (Phase 8) also covers: per-type taxonomy approval toggles, enquiry
retention period (months), enquiry deletion grace period (days).

**Maintenance Mode:** when on, the proxy (`src/proxy.ts`, formerly "middleware") serves a
fixed Spanish maintenance message for all public routes; `/admin` and `/api/auth/*`
remain accessible. The message is **not**
editable in the MVP — Cursor designs the maintenance screen; copy is a fixed string
provided by the backend/product.

---

## 10. Open questions blocking final frontend copy/limits

Tracked in the scope (§47); none block layout/interaction work:

- Final Spanish copy for legal pages, About, Advertise, maintenance message.
- Exact image type/size limits (will be provided as a constants module).
- Exact “Cerca de mí” radius (comes from settings at runtime).
- Brand name / domain.

---

## 11. Change log

- **Phase 0:** document created; routes, layouts, i18n, theme/preference contract, health
  endpoint.
