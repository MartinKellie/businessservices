---
version: 1
slug: "src-app-public-contacto-page-tsx"
primary_target: "src/app/(public)/contacto/page.tsx"
related_targets: ["src/app/(public)/acerca/page.tsx","src/app/(public)/anunciate/page.tsx","src/app/(public)/privacidad/page.tsx","src/app/(public)/terminos/page.tsx","src/components/public/public-shell.tsx"]
---

# Remaining public board pages

Visitor mode: Operate (contact, cookies) and Read (About, Advertise, legal)

## Job and audience
A Cúcuta-area resident or business owner who left search to understand the directory, list a business, send an enquiry, or review cookie storage. No account.

## Outcome and proof
Contact submits to `POST /api/enquiries` with honeypot, consent, optional image, and 422/429/503/500 states. Advertise routes into that form (`add_business` / `advertising`). About states confirmed product truth in gravity-column sections. Legal pages carry factual covering copy for the scoped topics, with a pending-official-text notice. Cookie strip records `consent.cookies`; Privacy opens the prefs panel.

## Selected direction
Same neighbourhood pizarra as `/` and `/buscar`. Forms are letter-tracks and invert chips, not card chrome. Reading pages are a gravity column of menu sections (display heading, body, rail), not a marketing card stack. Cookie notice is a board rail, not a toast.

## Scope
FRONTEND_HANDOFF §1 cookies, §3–4 links, §7 contact; scope §33–36, §41–43. Not the admin dashboard. No invented WhatsApp number, prices, or lawyer-signed claims.

## Constraints
Spanish UI; EN chrome via the existing dev toggle. Do not invent brand name, legal text, WhatsApp numbers, or SLAs. Image limits from `src/lib/media-constraints.ts`.

## Direction contract
THESIS: These pages are more of the same pizarra — a written enquiry, a short read, a consent rail — not a marketing site bolted onto search.
OWN-WORLD: Flooded board, condensed display caps, Atkinson body, square rails, invert for commit and selection. Signal green stays WhatsApp/open only.
STORY: Visitor reads why the board exists, asks to be listed or writes a query, ticks privacy, and can review what the device stores.
FIRST VIEWPORT: Display title on the board. Reading pages: heading, one lead in the same measure, then menu-row sections with more space above each heading than below it. Advertise ends on invert «Añadir mi negocio». Contact: enquiry-type chips then letter-track fields; consent enables Enviar. Cookie rail sits on the bottom edge of the public shell.
FORM: Extension of the menú del día / pizarra (seed 5a80b1e9). Signature interaction: ticking consent enables the invert Enviar tile; Advertise invert tile goes to the form; accepting cookies folds the rail away.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
