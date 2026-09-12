---
version: 1
slug: "src-app-admin-page-tsx"
primary_target: "src/app/admin/page.tsx"
related_targets: ["src/app/admin/layout.tsx","src/app/admin/iniciar-sesion/page.tsx"]
---

---
version: 1
slug: "src-app-admin-page-tsx"
primary_target: "src/app/admin/page.tsx"
related_targets: ["src/app/admin/layout.tsx", "src/app/admin/iniciar-sesion/page.tsx"]
---

# Admin dashboard `/admin`

Visitor mode: Operate

## Job and audience
MK1GROUP owners and local editors maintaining the Cúcuta directory. They sign in with Google, work bilingual ES/EN, and must create, publish, and correct listings plus handle enquiries without leaving the board.

## Outcome and proof
Primary action: open a business ficha, make it publishable, and handle today's follow-ups and enquiries. Proof is live CRUD against `/api/admin/*`.

## Scope
Full §8 dashboard: businesses (list + editor), taxonomy, follow-ups, enquiries, import/export, search-preview, system settings, user management, designed sign-in. Public site unchanged.

## States
Loading / empty / error on every list. Pending / success / failure on every mutation. Role-hidden owner controls. Publish blockers on the open ficha. Sign-in error from `?error=`.

## Interaction
Left drawers pull open by invert. Selecting a listing slides the ficha from the right. Rows restyle in place. ES/EN is stacked chrome, not a second colour.

## Constraints
Same letter-board world, denser. Must not look like `/buscar` (no giant letter-track search). Must not look like generic SaaS. Incomplete screens that cannot publish a business or close an enquiry are a failure.

## Direction contract
THESIS: The admin is a filing wall of enamel drawers: pull a drawer for the list, slide a ficha to edit; it refuses both the public search-hero and the rounded SaaS dashboard.
OWN-WORLD: Flooded board, 1px square rails, Atkinson for all UI labels and data, Big Shoulders only on drawer names and primary actions. Ink invert for the open drawer and selected row. Signal reserved for WhatsApp; warn for overdue and errors.
STORY: Staff pull Negocios, find a listing, slide the ficha, clear publish blockers, then handle Consultas and Seguimientos from the same wall.
FIRST VIEWPORT: Thin top rail (ES/EN stacked, theme, session, sign out). Left column of drawer labels, the open one inverted. Remaining board is a ruled business list with a compact search field at body size. An empty ficha rail on the right reads “Elija una ficha”. Signature interaction: selecting a row slides the ficha in from the right in 180ms; the row inverts with it.
FORM: Filing wall / oficina ficha drawers, grounded list #3, seed f7e57168. Raises: live rows that restyle in place (split-flap); publish blockers as opposing forces on the ficha (tensegrity); bilingual stacked chrome labels (mecha).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
