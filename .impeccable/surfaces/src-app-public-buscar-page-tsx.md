---
version: 1
slug: "src-app-public-buscar-page-tsx"
primary_target: "src/app/(public)/buscar/page.tsx"
related_targets: ["src/app/(public)/page.tsx"]
---

# Search `/buscar`

Visitor mode: Operate

## Job and audience
Same resident, now scanning results to pick one business and contact it. Task frequency: short, urgent, often on a phone in the street.

## Outcome and proof
Success: find a relevant listing, see open/closed when known, open WhatsApp or call. Address appears only after expand or pin interaction. Live `GET /api/search` and `GET /api/businesses/:id`.

## Selected direction
Same letter-board world as `/`. The list is the menu; the map is the "dónde queda" plate taped beside the board. Selected row inverts; WhatsApp is the reserved signal.

## Scope
Shareable URL params, desktop split + collapse, mobile map/list + bottom sheet, filters, empty/error/503/geo fallback. No dedicated business page, no sort, no cookie panel.

## States
Loading, empty, error, 503, location-denied using selected area, hours unknown (hide open/closed), no media (category icon), relocated / temporarily closed labels, service-area note.

## Interaction
Desktop: map + list, draggable divider, collapse either pane, two-way pin ↔ card invert. Mobile: last-used view, pin opens expandable sheet, map stays visible where practical. Filters: open now, category, area/distance, WhatsApp.

## Constraints
Pins capped at 200; page size 20. MapLibre against `NEXT_PUBLIC_MAP_STYLE_URL` with a documented OSM raster fallback. Spanish copy. Full address never in the collapsed card.

## Direction contract
THESIS: Results are a pizarra menu taped to a street map — scan, invert, contact — not a card grid beside a generic embed.
OWN-WORLD: Same flooded board, letter-track chrome, reserved signal, hard invert selection. List rows are menu lines; the map plate is a fitting, not a second product.
STORY: Visitor narrows with swatches, reads the menu, inverts a line, sees where it is, and taps WhatsApp.
FIRST VIEWPORT: Desktop — location/search rail across the top; filter swatches under it; list (menu) and map share the remaining board, divider grabable. Mobile — same rail; map|list clips; list is full-bleed menu rows. Signature interaction: selecting a row or pin hard-inverts both; the sheet/expand reveals address and hours like lifting a flap.
FORM: Same world as homepage, seed 5a80b1e9, Operate expression of form #7.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
