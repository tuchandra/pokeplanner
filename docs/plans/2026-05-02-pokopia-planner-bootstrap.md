# Pokopia Habitat Planner — Plan

Last updated: 2026-05-02. Live at https://tusharc.dev/pokeplanner/.

## What shipped

Bootstrap (Phases 1–4) and Phase 5 polish are all in `main`. Quick summary:

- **Stack**: bun + Vite + React + TypeScript (strict, tsgo). Tailwind v4 with hand-rolled shadcn/ui primitives over Radix. Biome for lint/format. State in Zustand with `persist` to `localStorage` (key `pokeplanner.v1`).
- **Data**: 308 Pokémon ingested from `docs/reference/poketracker.tsv` into `src/data/pokemon.generated.ts`. Sprites mirrored locally to `public/sprites/<id>.png` (slug-based to dodge duplicate tracker numbers like Pikachu/Peakychu both at #079). Litter-drop items merged from `docs/reference/litter-drops-raw.txt` (31 of 33 matched).
- **UI**: single unified topbar (brand · location tabs with capacity bars · view toggle · Add House popover · theme button); house grid + table views per location; click-to-deselect a tab to view all locations; per-house relocate dropdown; Pokémon picker sidebar with multi-select specialty filter, habitat-compat toggle, and group-by-specialty toggle (story characters in a Story group, `???` and small specialties folded into Misc., dual-specialty Pokémon appear in both groups).
- **Detail panel**: click a Pokémon in the picker to expand inline at the top of the sidebar — sprite, habitat, specialty, taste, litter drop, full favorites, similar Pokémon, and an "Add to a new house" shortcut. Picker scroll position is preserved when you go back.
- **Recommendations**: when a house is selected, the picker shows a top-6 recommendations strip above the main grid (scored by habitat match + favorite-tag overlap), without reordering the main list.
- **Demo data**: empty-state "Load example data" button populates six curated houses across all five locations.
- **Theme**: light/dark via `[data-theme]` on `<html>`; OKLCH tokens in `src/styles.css`.
- **Deploy**: GitHub Actions → GitHub Pages → custom domain `tusharc.dev` (inherited from the user-pages repo).

## Still on the docket

### Phase 5 B2 — Per-location candidates pool

**Goal**: a "plan first, place later" workflow. Drag a Pokémon onto a location *without* committing it to a specific house, then later move it from the candidates buffer into a slot or off it entirely.

**Data model**: extend the store with `candidatesByLocation: Record<LocationId, string[]>` (Pokémon ids), persisted alongside `houses`.

**UI**: a Candidates strip directly under the active location's header (or a collapsible Candidates section above the house grid) that:
- accepts drops from the picker → adds to the active location's candidates list
- renders each candidate as a small draggable sprite chip
- accepts drops from candidates → a slot (moves from buffer to slot)
- supports drag-from-candidate → trash icon to remove

**Interactions**:
- Picker → candidates: drag a sprite onto the candidates strip
- Candidates → slot: drag a candidate sprite onto any house slot (works across views)
- Candidates → remove: small × on each candidate chip
- Adding a Pokémon to a slot from anywhere should also remove it from the candidates buffer

**Phase-4 hook (already in place)**: dnd-kit's `DragEndEvent` already routes by `data.kind` (`'pokemon'` for picker items, `'slot'` for house slots). Add a `'candidate'` kind for buffer chips and a `'candidates'` kind for the strip drop zone, then extend the existing `onDragEnd` switch in `src/App.tsx`.

**Open questions**:
- Should a candidate count against the location's 40-point capacity? (Probably no — candidates are ideas, not committed houses.)
- Should the recommendations strip take candidates into account when a house is selected? (Probably yes — surface candidates first.)

This is the largest remaining piece of work; everything else in the original plan is shipped.

## Reference materials

- `docs/reference/poketracker.tsv` — user's canonical roster (300+ rows). Source of truth for ingest.
- `docs/reference/litter-drops-raw.txt` — Serebii's litter-drop list, parsed during ingest.
- `docs/reference/pokehouseplan.html` / `pokehouseplan.js` — the (saved) reference site we modeled the bootstrap UI on. The current UI has diverged considerably and is no longer a faithful clone.
