---
name: Directorio de Cúcuta
description: Neighbourhood letter-board directory for Cúcuta — search first, WhatsApp ready.
colors:
  board-light: "#f3ead4"
  ink-light: "#1a1812"
  muted-light: "#3f382c"
  rail-light: "#2a2418"
  signal-light: "#0d6b38"
  signal-ink-light: "#f4fff4"
  warn-light: "#8a3d0b"
  warn-ink-light: "#fff6ea"
  board-dark: "#161910"
  ink-dark: "#f3ead4"
  muted-dark: "#c9bda0"
  rail-dark: "#d8cba8"
  signal-dark: "#3dcc6a"
  signal-ink-dark: "#06210f"
  warn-dark: "#e8b15a"
  warn-ink-dark: "#1a1206"
typography:
  display:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "clamp(2.25rem, 8vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.04em"
  title:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "0.04em"
  body:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  none: "0px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.ink-light}"
    textColor: "{colors.board-light}"
    rounded: "{rounded.none}"
    padding: "10px 24px"
    typography: "{typography.title}"
  button-primary-hover:
    backgroundColor: "{colors.signal-light}"
    textColor: "{colors.signal-ink-light}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
  input-track:
    backgroundColor: "transparent"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.none}"
    padding: "8px 0"
  chip-active:
    backgroundColor: "{colors.ink-light}"
    textColor: "{colors.board-light}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
---

# Design System: Directorio de Cúcuta

## Overview

**Creative North Star: "The neighbourhood pizarra"**

The public directory is a shop-front letter-board, not a discovery app. Light mode is a sun-bleached enamel menu; dark mode is a slate chalkboard. One flooded ground, high-contrast ink, and a single reserved signal colour for WhatsApp and “open now”.

Search is the largest object on the homepage. Categories are menu rows with dotted leaders, not icon cards. Selected results invert like a flipped letter tile.

**Key Characteristics:**

- Flooded board ground; no floating card chrome
- Condensed uppercase display face on a physical letter-track
- Square corners; colour only on state bands
- Hard invert for selection, not a glow

## Colors

Light enamel board and dark chalkboard share one grammar. Body and muted text are ink mixed from the board hue — never grey.

### Primary
- **Board enamel / slate** (`#f3ead4` / `#161910`): the page itself.
- **Board ink** (`#1a1812` / `#f3ead4`): type, rails, inverted tiles.

### Signal
- **Reserved mark** (`#0d6b38` / `#3dcc6a`): WhatsApp and open-now only.

### Warn
- **Board warning** (`#8a3d0b` / `#e8b15a`): location denied and non-active status labels.

**The One Signal Rule.** If it is not WhatsApp, open-now, or a true warning, it stays ink on board.

## Typography

Display is Big Shoulders — condensed letter-board caps. Body is Atkinson Hyperlegible for Spanish readability. No eyebrow labels; the heading carries the weight.

## Layout

Homepage: letter-track search in the upper half, location strip beneath, gravity column of category rows below. Search: rail and filters on top; desktop list + map share the remaining board with a draggable divider; mobile swaps map and list.

## Elevation & Depth

Flat. The only lift is the mobile detail sheet (`0 -8px 24px`). No halo shadows.

## Shapes

Square fittings. Borders are 1px rails. Inputs sit on a hashed letter-track, not a rounded field.

## Components

- **Primary button:** inverted board (ink fill, board type), uppercase display.
- **Letter-track input:** bottom rail + repeating hash; no box.
- **Filter chips:** invert when active.
- **Result row:** menu line; selected row is a full invert.
- **WhatsApp action:** signal fill, never a secondary ghost.

## Do's and Don'ts

**Do**

- Keep search the largest thing on the first viewport
- Invert the selected row and matching pin together
- Hide the street address until the row expands

**Don't**

- Ship a photo-hero or equal icon-card grid
- Use a second accent colour
- Navigate away to a dedicated business page
