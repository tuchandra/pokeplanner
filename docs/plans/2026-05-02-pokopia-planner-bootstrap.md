# Pokopia Habitat Planner — Status

Last updated: 2026-05-02. Live at https://tusharc.dev/pokeplanner/.

## What shipped

The original bootstrap plan (Phases 1–4) and the documented Phase 5 polish are all in `main`. Beyond the original plan, the UI has been reshaped considerably based on direct feedback:

### Stack & infra
- bun + Vite + TypeScript (strict, tsgo) · React 18 · Tailwind v4 + hand-rolled shadcn/ui primitives (Button, Popover, Select, ToggleGroup, Checkbox) over Radix · Zustand+persist (`pokeplanner.v1` localStorage) · @dnd-kit/core · Biome · bun:test.
- GitHub Pages deploy via Actions, custom domain `tusharc.dev` inherited from user pages.
- 308 Pokémon ingested from `docs/reference/poketracker.tsv` into `src/data/pokemon.generated.ts`. Slug-based sprite filenames so colliding tracker numbers (e.g. Pikachu/Peakychu both #079) keep separate sprites.

### Data
- **Pokémon roster** mirrored from Serebii into `public/sprites/<id>.png`.
- **Litter-drop items** parsed from a Serebii dump and resolved by name to 11 unique items, mirrored into `public/litter/`. 31 of 33 Litter-specialty Pokémon have an item assigned (3 unmatched names log warnings during ingest).
- **Area icons** mirrored from pokopiadex.com into `public/locations/<id>.png`.
- **Specialty icons** mirrored from pokopia.guide into `public/specialties/<slug>.png` (31 of 32 specialties; `???` is the placeholder and has no icon).

### UI
- **Topbar** — single unified row: brand (mono uppercase) · location tabs with capacity bars + click-to-deselect (active tab toggles to "All") + per-area icons + per-area accent dot · view toggle (Grid/Table icons) · `+ House` popover · theme toggle.
- **House cards** — editable title, two inline dropdowns in the subtitle: location (with swatch + icon + name) and shape (Prefab · 1/2/4 or Custom). Lock/unlock button next to a close X. Slot grid auto-adapts columns to slot count. Each slot shows the sprite + small specialty label + an inline litter-item icon overlay when applicable. Auto-derived lighting + tag chips below.
- **Pokémon picker (sidebar)** — sticky filter strip on top: a multi-select specialty filter that uses the same group set as the picker (real specialties + `Story` + `Misc.`) and shows selected items as icon+label chips, plus a Group: flat/specialty toggle. Below: optional Pokémon detail panel (inline at top), then a Compatible section when a house is selected (every habitat-matching Pokémon, sorted by recommend-score), then the main grid (or specialty groups when grouping is on).
- **Detail panel** — opens above the grid, scrolls itself into view, restores the picker's previous scroll position on Back. Big sprite with a litter overlay, name + #number, "Move to a new house" button (creates a new house and moves the Pokémon out of any existing slot), compact stats strip (Habitat / Specialty / Taste / Litter with item icon, "flavors" suffix dropped), full favorites tags, similar-Pokémon grid (same specialty1 OR ≥3 shared favorites).
- **Click vs. drag** — drag still works. Clicking a Pokémon in the picker:
  - …with a non-locked house selected that has empty slots → drops into the next empty slot
  - …otherwise → opens the detail panel
- **Lock houses** — locked houses block delete, slot click-to-clear, drop targets, click-to-place quick mode, type/size changes, location changes, and rename. Locked houses still keep their members through `addHouseWith`'s "move" semantics (the source Pokémon isn't pulled out of a locked house).
- **Stale-selection guard** — switching to a specific area deselects any selected house that lives elsewhere, so click-to-place can't silently send Pokémon to an off-screen house.
- **Theme** — light/dark toggle via `[data-theme]` on `<html>`. OKLCH tokens in `src/styles.css`. Per-location accent colors (`--loc-ww/bb/rr/ss/pt`).
- **Empty state** — when there are no houses, the main column shows a "Load example data" button that populates six curated houses across all five locations.

### Group partition (shared by picker grid and filter dropdown)
- `Story` group: Peakychu, Mosslax, Ditto, Professor Tangrowth, Smeargle (Smearguru), Stereo Rotom (DJ Rotom), Greedent (Chef Dente), Tinkaton (Tinkmaster).
- `Misc.` group: `???` specialty (Magikarp, Kyogre, Lugia, Ho-Oh) plus any specialty with ≤2 non-story members after story extraction.
- Real-specialty groups: alphabetical, then Story, then Misc. Pokémon with two specialties appear in both real-specialty groups when the filter is active so secondary specialties (e.g. Combusken/Blaziken's Burn alongside Build) are visible.

## Outstanding

### B2 — Per-location candidates pool
Status: still queued. Largest piece of work and the only meaningful unimplemented feature.

**Goal**: a "plan first, place later" workflow. Drag a Pokémon onto a location *without* committing it to a specific house, then later move it from the candidates buffer into a slot or off it entirely.

**Data model**: extend the store with `candidatesByLocation: Record<LocationId, string[]>`, persisted alongside `houses`.

**UI**: a Candidates strip directly under the active location's header (or a collapsible Candidates section above the house grid):
- accepts drops from the picker → adds to the active location's candidates list
- each candidate is a small draggable sprite chip
- candidates → slot moves out of the buffer
- candidates → small × removes
- adding a Pokémon to a slot from anywhere (picker, candidates, drag, click) clears it from the candidates buffer

**Drag-routing hook**: dnd-kit's `DragEndEvent` already routes by `data.kind` (`'pokemon'` for picker items, `'slot'` for house slots) in `src/App.tsx`. Add a `'candidate'` kind for buffer chips and a `'candidates'` kind for the strip drop zone, then extend the existing `onDragEnd` switch.

**Open questions**:
- Should a candidate count against the location's 40-point capacity? (Probably no — candidates are intent, not commitment.)
- Should the Compatible section take candidates into account? (Probably yes — surface candidates first if any are habitat-matched.)

### Mobile layout
Status: untouched. The topbar's three-column grid (brand / tabs / actions) wraps awkwardly under ~640px; the sidebar drops below the main column at 880px and takes 60vh, which is workable. A small pass to switch the topbar to a stacked layout on narrow viewports (brand+actions row, then tabs row) would smooth this out. Not an active blocker.

### Other small follow-ups noted along the way
- The 3 unmatched litter-drop names (Larvesta, Snivy, Jumpluff) are referenced in the Serebii data but not in the user's tracker TSV. If the user adds those rows later, re-running `bun run ingest` will pick them up automatically.
- `???` specialty has no icon; the SpecialtyFilter dropdown renders a blank space slot for it and the picker's Misc. group serves as its container. If one shows up, swap in a generic glyph.

## Reference

- `docs/reference/poketracker.tsv` — user's canonical roster (source of truth for ingest). Local only.
- `docs/reference/litter-drops-raw.txt` — Serebii's litter-drop list, parsed during ingest. Local only.
- `docs/reference/pokehouseplan.html` / `pokehouseplan.js` — the original reference site we modeled the bootstrap on. The current UI has diverged from that completely and is no longer a clone.
