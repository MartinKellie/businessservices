# Frontend Handoff — Cúcuta Business Directory

This document is the contract between the backend (Claude Code) and the frontend
(Cursor). Cursor owns all design and frontend implementation; the backend owns the data
model, APIs, auth, integrations and business rules described here.

**Status:** Backend through Phase 9 complete (see §13) — full schema, auth, business/taxonomy
CRUD, search, enquiries, import/export, System Settings, geocoding. Public board pages
(`/`, `/buscar`, `/acerca`, `/anunciate`, `/contacto`, `/privacidad`, `/terminos`) are built.
**The admin dashboard (`/admin`) is implemented** (bilingual ES/EN filing-wall): businesses
list + ficha editor, enquiries, follow-ups, taxonomy, import/export, search-preview, system
settings, user management, and a designed Google sign-in. This document is updated at the
end of each phase whose APIs change.

British English in code comments and docs; **all public UI copy is Spanish**.

---

## 1. Ground rules

- **Public site:** Spanish only. Not built for SEO / search-engine discovery.
- **Dev-only UI language toggle:** add a small EN/ES switch, visible only in development
  (e.g. gated on `NODE_ENV !== 'production'`), that swaps *UI copy only* — labels, buttons,
  static strings. It's a review aid for English-speaking team members, not a product
  feature; don't surface it in production or promote it anywhere. Search terms, matching,
  and all directory content (business names, categories, products) stay Spanish
  regardless of the toggle — it never changes what's queried or what data comes back, only
  how the surrounding chrome reads. Persist the choice per browser in `localStorage`
  (`pref.devUiLocale`, default `es`), same pattern as `pref.theme` below. Implementation is
  Cursor's call — reusing the admin's `next-intl` catalogues is fine if convenient, but a
  lightweight hardcoded EN string set behind the toggle is equally acceptable given this
  never ships.
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
  | `pref.devUiLocale` | dev-only UI copy language (`es` \| `en`, default `es`) — see above, not shipped |
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
| `/acerca` | About | what it is, who it is for, how to use it, Powered by MK1GROUP |
| `/anunciate` | Advertise with us | how to be listed, enhanced options (manual), contact form CTAs |
| `/contacto` | Public contact form | see §7 |
| `/privacidad` | Privacy Policy | covering copy for scoped topics; official legal wording still pending |
| `/terminos` | Terms / Disclaimer | covering copy for scoped topics; official legal wording still pending |
| `/admin` | Admin dashboard | bilingual; behind Google auth (see §8) |

Cookie banner + preferences panel: global on the public site (not a route).
Maintenance page: shown by the proxy for the whole public site when Maintenance Mode is
on (see §9); `/admin` stays reachable.

---

## 4. Homepage requirements

- Dominant “¿Qué estás buscando?” search field → navigates to `/buscar` with the query.
- Area/community selector (data: `GET /api/areas` → `{ areas: [{ id, name, slug, lat, lng }] }`).
  Selection persists locally and is the default area for searches.
- “Cerca de mí” action: request device geolocation. On grant, searches use the device
  coordinates + the global radius. On denial/failure, fall back to the selected area. Make
  the permission state and fallback obvious to the user.
- Address/area text input, alongside “Cerca de mí”, for users who deny or don't have
  device geolocation: `GET /api/geocode?q=<text>` (live) → `{ results: [{ label, lat, lng }]
  }`, up to 5 candidates, resolve-on-submit (no autocomplete-as-you-type in MVP — post-MVP
  candidate). If exactly one result, or the user picks one from several, use that
  `lat`/`lng` exactly like a device-location result (same radius, same downstream
  `/api/search` params). Empty/no-match results should read as "no encontramos esa
  dirección", not an error. Same `503` during Maintenance Mode and `429` rate-limit shape
  as other public endpoints (see §12's error shape).
- Popular/browsable categories: `GET /api/categories?popular=1` (omit `popular` for all)
  → `{ categories: [{ id, name, slug, icon, isPopular, businessCount }] }`. `icon` is a
  lucide key. Each links to `/buscar?categoryId=…`.
- Announcement banner: text-only, fixed placement, shown only when
  `announcement.enabled` (`GET /api/settings/public`). No link/button in MVP.
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

**Data:** `GET /api/search` is live (Phase 5). Query params match `q`, `areaId`, `lat`,
`lng`, `categoryId`, `openNow`, `whatsapp`, `page` above. Returns `503` during Maintenance
Mode. Response shape:

```jsonc
{
  "results": [ /* SearchCard, current page only, page size 20 */ {
    "id", "name", "slug",
    "status",                       // draft|active|temporarily_closed|permanently_closed|relocated|archived
    "primaryCategory": { "name", "slug", "icon" } | null,   // icon = lucide key for the fallback
    "otherCategories": [{ "name", "slug" }],
    "areaName": string | null,
    "serviceAreaNote": string | null,   // set only for service-area businesses
    "logoUrl": string | null,           // approved media only
    "photoUrl": string | null,          // approved media only; use category icon if both null
    "openStatus": "open" | "closed" | null,   // null = hours unknown → show nothing
    "distanceMeters": number | null,    // only when lat/lng supplied
    "contact": { "phone", "whatsapp", "email", "website", "instagram", "facebook" }
  }],
  "pins": [ { "businessId", "name", "status", "lat", "lng" } ],  // ALL matches with a location (capped 200), for the map
  "total": number, "page": number, "pageSize": 20,
  "appliedAreaId": string | null,
  "appliedRadiusMeters": number | null,   // set when "Cerca de mí" was used
  "resolved": { "conceptIds": [], "categoryIds": [], "globalTerms": [] }  // what the query matched, for debugging/telemetry
}
```

The full street address is **not** in search results — only in the detail endpoint (§6).
Matching handles Spanish accents, loose wording, reasonable misspellings, and synonyms
(a synonym scoped to a concept/category pulls in businesses tagged with that concept;
"open now" is computed server-side in `America/Bogota`). Search cap: 200 ranked matches.

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

Expanded card / detail: `GET /api/businesses/:id` (live — accepts the uuid or the slug):

```jsonc
{ "business": {
  "id", "name", "slug", "status",
  "primaryCategory": { "name", "slug", "icon" } | null,
  "otherCategories": [{ "name", "slug" }],
  "area": { "name", "slug" } | null,
  "address": string | null,                 // physical premises only
  "location": { "lat", "lng" } | null,      // physical premises only
  "serviceAreaNote": string | null,         // service-area businesses only
  "logoUrl": string | null, "photoUrls": string[],   // approved media only
  "contact": { "phone", "whatsapp", "email", "website", "instagram", "facebook" },
  "openingHours": [{ "dayOfWeek", "opensAt", "closesAt" }],   // sorted; may be []
  "relocatedTo": { "id", "slug", "name" } | null,   // set when status = relocated
  "lastUpdatedAt": string | null            // ISO; null unless the setting is on
}}
```

Draft/archived → `404`; permanently-closed and relocated stay reachable by direct id/slug.

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
- `POST /api/enquiries` (live). Send **`multipart/form-data`** when there's a file, else
  `application/json`. Fields:
  - `type`: `add_business` | `update_listing` | `advertising` | `general`
  - `name` (≥2), `email`, `phone?`, `message` (10–4000), `businessReference?`
  - `consent`: must be `true` (checkbox `on`/`true`/`1` in form-data) — block submit until ticked
  - `company`: the **honeypot** — a hidden field, must stay empty (bots that fill it get a
    normal-looking `201 { ok: true, id: null }` and nothing is stored)
  - `file?`: one image, JPG/PNG/WebP, ≤ 5 MB
  - Success: `201 { ok: true, id }`. Handle `422` `validation_error` (per-field `fields`),
    `429` `rate_limited` (max 5 / 10 min, 20 / day per client), `503` maintenance, `500`.
  - Show a clear confirmation state; the image is never shown publicly (admin review).

---

## 8. Admin dashboard (`/admin`)

Bilingual (ES/EN) with a locale switcher that sets the `ADMIN_LOCALE` cookie.

**Auth (implemented, Phase 2):** Google sign-in only, restricted to the `admin_users`
allow-list.

- Sign-in screen: `/admin/iniciar-sesion` — a single "Continuar con Google" action
  (currently an unstyled placeholder; Cursor owns the design). `?error=` on the URL means
  the last attempt failed or the account is not on the allow-list — show a clear message.
- Unauthenticated requests to any other `/admin/*` path are redirected here by the proxy,
  with `?callbackUrl=` preserved.
- The session (`next-auth`, JWT) exposes `session.user.email`, `session.user.name`,
  `session.user.image`, `session.user.role` (`owner` | `editor`) and
  `session.user.adminId`. Use `session.user.role` to hide controls the role cannot use;
  the backend independently enforces every rule (a hidden control is not a security
  boundary).
- Sign out: `signOut()` from `next-auth/react`, or a POST to `/api/auth/signout`.

Two roles:

- **Owner/Admin:** everything, incl. user/role management, System Settings, taxonomy
  approvals, imports/exports, destructive/archive actions.
- **Local Editor:** business CRUD, drafts, publish, photos, hours, contact-detail changes
  (subject to verification rules), notes, contact history, follow-ups; may **request** new
  taxonomy but cannot approve.

**API error shape** (all `/api/**` endpoints): `{ "error": { "code": string, "message":
string (Spanish, safe to show), "fields"?: { "<dotted.path>": string } } }`. Status codes:
`401` not signed in, `403` wrong role, `404`, `409` conflict (e.g. `already_exists`,
`last_owner`), `422` `validation_error` (with `fields`), `429` rate-limited, `500`.

**Admin-user management API** (Owner only): `GET /api/admin/users` → `{ users: [...] }`;
`POST /api/admin/users` `{ email, name?, role }` → `201 { user }`;
`PATCH /api/admin/users/:id` `{ name?, role?, isActive? }` → `{ user }`. The API refuses to
remove the last active owner or let an owner lock themselves out.

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

`GET /api/settings/public` (live) — fetch once per page load, served even during
maintenance:

```jsonc
{
  "maintenanceMode": boolean,
  "announcement": { "enabled": boolean, "text": string },   // text-only banner, fixed placement, no link
  "nearMeRadiusMeters": number,                             // "Cerca de mí" radius
  "showLastUpdated": boolean                                // whether detail exposes lastUpdatedAt
}
```

Public endpoints (`/api/search`, `/api/areas`, `/api/categories`, `/api/businesses/:id`)
return **`503`** `{ error: { code: "maintenance", message } }` when `maintenanceMode` is on.

Admin System Settings (Phase 8) also covers: per-type taxonomy approval toggles, enquiry
retention period (months), enquiry deletion grace period (days).

**Maintenance Mode:** when on, the public site shell (`app/(public)/layout.tsx`) renders a
fixed Spanish maintenance screen instead of the page; `/admin` and `/api/auth/*` are
outside that shell and stay reachable. (Enforced in the Node layout, not the edge proxy,
because the check needs the database.) The message is **not** editable in the MVP — Cursor
designs the screen; the copy is `MAINTENANCE_MESSAGE` from `src/lib/maintenance.ts`.

---

## 10. Open questions blocking final frontend copy/limits

Tracked in the scope (§47); none block layout/interaction work:

- Final Spanish copy for legal pages (covering text is live; formal wording still pending), About, Advertise, maintenance message.
- Exact image type/size limits (will be provided as a constants module).
- Exact “Cerca de mí” radius (comes from settings at runtime).
- Brand name / domain.

---

## 11. Enums (stable vocabulary)

These are fixed database enums; the UI renders Spanish (or ES/EN for admin) labels for
them. TypeScript unions will be exported from `src/db/schema` / `src/lib` as the API
client lands.

- **Business status:** `draft`, `active`, `temporarily_closed`, `permanently_closed`,
  `relocated`, `archived`
- **Enquiry type:** `add_business`, `update_listing`, `advertising`, `general`
- **Enquiry status:** `new`, `in_progress`, `closed`
- **Media review status:** `pending`, `approved`, `rejected` (public sees `approved` only)
- **Taxonomy status:** `pending`, `approved`, `rejected`
- **Premises kind:** `physical` (address + pin) / `service_area` (described area, no address)
- **Admin role:** `owner`, `editor`
- Opening hours use ISO day numbers: **1 = Monday … 7 = Sunday**.

Internal-only enums the public UI never shows: verification level/method, contact method.

## 12. Admin API reference — Phase 3 (business + taxonomy backend)

All under `/api/admin`, all require a signed-in admin; **owner-only** noted per route.
Bodies are JSON unless stated. Responses wrap the entity(ies) in a named key; errors use
the shape in §8. List endpoints accept `?limit=&offset=` and return newest/first-sorted.

**Businesses**
| Method | Path | Notes |
|---|---|---|
| GET | `/businesses?q=&status=` | admin search/list (name, phone, whatsapp) |
| POST | `/businesses` | `{ name, phone?, whatsapp?, email?, website?, instagram?, facebook? }` → draft |
| GET | `/businesses/:id` | full aggregate: business + `categories[]` (with `isPrimary`), `productsServices[]`, `premises` (with `lat`/`lng`), `openingHours[]` |
| PATCH | `/businesses/:id` | name + contact channels; **changing phone/whatsapp/email/website requires** `verification: { level, method, source? }` with `level` ∈ `phone_verified\|visited\|business_claimed`, else `422 verification_required` |
| POST | `/businesses/:id/status` | `{ status, relocatedToBusinessId? }`; enforces the transition map; `→ active` runs publish checks; `permanently_closed`/`archived` are **owner-only** |
| GET | `/businesses/:id/status` | `{ publishable, problems: [{ field, message }] }` — drive the "why can't I publish" UI |
| PUT | `/businesses/:id/premises` | `{ kind: 'physical'\|'service_area', addressLine?, areaId?, lat?, lng?, locationPrecision?, serviceAreaNote? }` (lat+lng together) |
| PUT | `/businesses/:id/categories` | `{ primaryCategoryId, secondaryCategoryIds[] }` — replaces all; approved categories only |
| PUT | `/businesses/:id/products-services` | `{ productServiceIds[] }` — replaces all; approved only |
| PUT | `/businesses/:id/hours` | `{ entries: [{ dayOfWeek 1-7, opensAt 'HH:MM', closesAt 'HH:MM' }] }` — full weekly replace; repeat a day for split shifts; `closesAt <= opensAt` = overnight |
| GET/POST | `/businesses/:id/notes` | internal notes (never public) |
| GET/POST | `/businesses/:id/contact-history` | `{ method, outcome?, contactedOn? }` |
| GET/PUT/DELETE | `/businesses/:id/follow-up` | one open follow-up per business; `PUT { dueOn 'YYYY-MM-DD', note? }` |
| GET/POST | `/businesses/:id/media` | POST is **multipart/form-data** `file` + `type=logo\|photo` + `altText?`; JPG/PNG/WebP, ≤ 5 MB; admin uploads are auto-approved |
| PUT | `/businesses/:id/media/order` | `{ orderedIds[] }` |

**Follow-ups dashboard**
| GET | `/follow-ups?filter=open\|due\|overdue` | `[{ id, businessId, businessName, dueOn, note, overdue }]` |
| POST | `/follow-ups/:id/complete` | marks done |

**Media review** — `DELETE /media/:id`, `POST /media/:id/review` `{ decision: 'approve'\|'reject' }`

**Taxonomy** (`categories`, `products-services`, `synonyms` — same shape)
| GET | `/categories?status=&q=` | list |
| POST | `/categories` | editor create becomes a **request** (`status: pending`) when the per-type approval toggle is on; owners/off → `approved` |
| PATCH | `/categories/:id` | edit fields |
| DELETE | `/categories/:id` | **owner-only**; `409 in_use` if referenced by a business |
| POST | `/categories/:id/review` | **owner-only** `{ decision: 'approve' }` or `{ decision: 'reject', reason }` |

Synonyms additionally take `{ scope: 'global'\|'product_service'\|'category', productServiceId?, categoryId? }` (target must match scope) and have no `PATCH`.

**Import / export** (scope §31 — Owner only)
| Method | Path | Notes |
|---|---|---|
| POST | `/imports` | multipart `file` (CSV or `.xlsx`) + optional `format`; parses and **validates every row**, creates nothing yet. Returns `{ batch: { id, totalRows, validRows, errorRows, status: 'pending_review', … } }` |
| GET | `/imports` | recent batches |
| GET | `/imports/:id` | one batch |
| GET | `/imports/:id/rows?onlyErrors=` | rows with `{ rowNumber, raw, ok, errors, resolved }` — build the review table from this before committing |
| POST | `/imports/:id/commit` | creates a **draft** business for every valid row (with premises/categories/products/an import note); error rows are skipped; returns the updated batch (`committedRows`) |
| POST | `/imports/:id/discard` | marks the batch discarded (only while `pending_review`) |
| GET | `/businesses/export?format=csv\|xlsx&status=` | downloads a file (`Content-Disposition: attachment`) |

Import never publishes — every row becomes a draft, so the normal publish-minimum check
still gates going live. Columns (header row, case-sensitive): `name, phone, whatsapp,
email, website, instagram, facebook, primaryCategory, secondaryCategories,
productsServices, area, premisesKind, addressLine, serviceAreaNote, lat, lng, sourceNote`.
`primaryCategory`/`area`/`productsServices` match existing approved entries by name or
slug (accent/case-insensitive) — free text never creates new taxonomy (scope §7).
Unresolved secondary categories/products are dropped with a note, not blocking; a missing
name, category, area/service-zone, or contact-or-source-note blocks the row. Export adds
read-only `id, slug, status, lastVerifiedAt` columns.

**Search-preview** (scope §32) — `GET /api/admin/search-preview?q=&businessId=&areaId=`
- with `businessId`: `{ appears, rank, total, matchedByName, score, resolved }`
- without: `{ total, resolved, results: [{ rank, id, name, status, primaryCategory }] }`

**Enquiries** (scope §33–35)
| Method | Path | Notes |
|---|---|---|
| GET | `/enquiries?status=&type=&includeDeleted=` | one shared queue; each row has `uploadCount` |
| GET | `/enquiries/:id` | full enquiry + `uploads[]` (with `reviewStatus`, `promotedMediaId`) |
| PATCH | `/enquiries/:id` | `{ status?, adminNotes?, businessId? }` — link to a business, set `new`/`in_progress`/`closed`; stamps `handledBy` |
| POST | `/enquiry-uploads/:id/review` | `{ decision: 'reject' }` or `{ decision: 'approve', promoteToBusinessId?, promoteAs?: 'logo'\|'photo' }` — approve can attach the image to a business as media |

## 13. Change log

- **Phase 0:** document created; routes, layouts, i18n, theme/preference contract, health
  endpoint.
- **Phase 1:** full database schema (17 tables) + seed data (6 areas, 20 categories, a few
  example product/service concepts + synonyms). Enum vocabulary above is now fixed.
- **Phase 2:** admin auth (Google + `admin_users` allow-list, JWT session with role),
  proxy gating of `/admin`, `/admin/iniciar-sesion` placeholder, admin-user management API,
  standard API error shape.
- **Phase 3:** business + taxonomy backend and admin APIs (see §12) — business CRUD,
  premises, status flow with publish checks, category/product links, opening hours,
  notes/contact-history/follow-ups, media upload + review. No public endpoints yet.
- **Phase 4:** Postgres search engine (synonym expansion, fuzzy/accent matching, weighted
  scoring, area + radius, open-now, filters, ranking, pins) + admin search-preview.
- **Phase 5:** public read APIs live — `GET /api/search`, `/api/areas`, `/api/categories`,
  `/api/businesses/:id`, `/api/settings/public`; Maintenance Mode enforced in the public
  shell + a `503` on public APIs.
- **Phase 6:** public `POST /api/enquiries` (honeypot + per-client rate limit + required
  consent + optional image upload); admin enquiry queue + upload review + promote-to-media;
  Resend notification (no-op until configured).
- **Phase 7:** business CSV/Excel import and export, Owner only. Import is staged
  (`/api/admin/imports[/:id[/rows|/commit|/discard]]`) — rows validate against the
  draft-minimum and resolve categories/products/areas accent- and case-insensitively, but
  nothing touches the business tables until an explicit commit, which creates a draft
  business per valid row (still gated by the existing publish-minimum check to go live).
  Export (`/api/admin/businesses/export`) returns the same column shape as CSV or `.xlsx`.
- **Phase 8:** System Settings panel API (scope §38) — `GET`/`PATCH /api/admin/settings`,
  Owner only, covering taxonomy approval toggles, Maintenance Mode, the announcement
  banner, near-me radius, and enquiry retention/grace periods. Paired with a Vercel Cron
  job (`GET /api/cron/retention`, bearer-secret gated, see `vercel.json`) that soft-deletes
  enquiries past the retention period and hard-deletes plus purges unpromoted upload blobs
  past the grace period.
- **Public board pages:** `/acerca`, `/anunciate`, `/contacto`, `/privacidad` and `/terminos`
  are designed in the letter-board world. Contact posts to `POST /api/enquiries`. Privacy and
  terms carry factual covering copy; official legal wording remains pending.
- **Admin dashboard:** bilingual filing-wall UI at `/admin` — businesses, ficha editor,
  enquiries, follow-ups, taxonomy, import/export, search-preview, settings, users, Google
  sign-in. Locale via `ADMIN_LOCALE` cookie and `next-intl` catalogues.
- **Phase 9:** `GET /api/geocode` (scope §10) — resolves a typed address/area to
  coordinates via Nominatim, so "Near me" works without device geolocation. See §4.
