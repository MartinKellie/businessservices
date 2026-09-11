---
version: 1
slug: "src-app-public-page-tsx"
primary_target: "src/app/(public)/page.tsx"
related_targets: ["src/app/(public)/buscar/page.tsx"]
---

# Homepage `/`

Visitor mode: Persuade

## Job and audience
A Cúcuta-area resident with a need in mind (or about to name one). They must understand this is a local directory and start a search without an account.

## Outcome and proof
Primary action: type a need and go to `/buscar`. Proof is the search itself plus popular categories and an area they recognise. No featured businesses, no testimonials.

## Selected direction
Neighbourhood letter-board / menú del día (seed 5a80b1e9, form #7). Search is the changeable letter track. Categories are today's dishes. One reserved signal colour for WhatsApp / open. Filters later inherit as governing swatches.

## Scope
Production homepage against live APIs. Chrome (header, footer, theme, announcement, cookie rail). About, Contact, Advertise, legal and cookies live on sibling public routes.

## States
Loading areas/categories; empty popular list; geolocation grant / deny / fail with obvious area fallback; typed address geocode (one hit / pick from several / no match / 429 / 503); announcement on/off; maintenance (layout).

## Interaction
Search dominates the first viewport. Area + Cerca de mí sit on the board's location strip. Category rows navigate with `categoryId`. Theme toggle in chrome.

## Constraints
Spanish UI. Brand name undecided — use "Directorio de Cúcuta" as working title, not a fabricated brand. Map style URL may be unset.

## Direction contract
THESIS: The homepage is a neighbourhood pizarra whose only job is to take a need and an area; it refuses the photo-hero + icon-card grid every local directory ships.
OWN-WORLD: One flooded board ground (slate chalk in dark, sun-bleached enamel in light). Condensed letter-track display face, high-contrast body. Colour only on state bands. WhatsApp/open share one reserved signal. Controls look like board fittings — rails, clips, invert — not app chrome.
STORY: Visitor reads the board, names what they need, picks a barrio or Cerca de mí, and leaves into results.
FIRST VIEWPORT: Full-bleed board. The letter-track search ("¿Qué estás buscando?") is the largest object, centred in the upper half, with a physical rail. Directly under it: area selector and Cerca de mí as one location strip. Below the fold of the first screen: a vertical gravity column of popular categories as menu rows, not equal icon cards. Footer MK1GROUP stays discreet.
FORM: Tablero de menú del día / pizarra de tienda, grounded list #7, seed 5a80b1e9. Raises: flooded ground (yé-yé); filter/category as governing marks (character sheet); gravity column (glaze); colour only on bands (cloud); one reserved signal (VU); hard invert selection (one-bit). Signature interaction: typing slots letters onto the rail; Cerca de mí lights the location strip.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
