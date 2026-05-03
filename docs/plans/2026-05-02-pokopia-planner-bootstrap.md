# Pokopia Habitat Planner — Status

Last updated: 2026-05-03. Live at https://tusharc.dev/pokeplanner/.

## What shipped

The original bootstrap plan and a long sequence of UX iterations are all in `main`. This file is the snapshot of where things stand.

### Stack & infra
- bun + Vite 5 + TypeScript (strict, tsgo) · React 18 · Tailwind v4 (Vite plugin) + hand-rolled shadcn/ui primitives (Button, Popover, Select, ToggleGroup, Checkbox) over Radix · Zustand+persist (`pokeplanner.v1` localStorage) · @dnd-kit/core · Biome · bun:test.
- GitHub Pages deploy via Actions, custom domain `tusharc.dev` inherited from user pages.
- 312 Pokémon ingested from `docs/reference/poketracker.tsv` into `src/data/pokemon.generated.ts`. Slug-based sprite filenames so colliding tracker numbers (Pikachu/Peakychu both #079, Tangrowth/Professor Tangrowth both #041, etc.) keep separate sprites.
- TSV is the sole source of truth — litter-drop items now live in column 7 of the TSV directly. The previous Serebii-dump cross-reference is gone.

### Data
- **Pokémon roster** (312): 300 numbered (#001–#300) plus form variants (Shellos #059, Gastrodon #060, Toxtricity #197, Tatsugiri #145), three story-vs-ordinary pairs (Mosslax/Snorlax, Pikachu/Peakychu, Tangrowth/Professor Tangrowth), and 4 event-exclusive entries (#E001 Hoppip, #E002 Skiploom, #E003 Jumpluff, #E004 Sableye). Mirrored to `public/sprites/<id>.png`.
- **Litter items** (11) mirrored to `public/litter/<slug>.png`. Lookup is case-insensitive so the TSV's "Small Log" resolves to Serebii's "Small log" filename.
- **Area icons** (5) mirrored to `public/locations/<id>.png`.
- **Specialty icons** (31) mirrored to `public/specialties/<slug>.png`. `???` has no icon.
- **Unplaceable Pokémon** (5): Tangrowth (Cloud Island exclusive), Ho-Oh, Lugia, Volcanion, Kyogre. Live in the Story group, drag/click-to-place disabled, detail panel hides the "Move" button.
- "Still need a home" target = 312 − 5 = **307**.

### UI
- **Topbar**: brand (mono uppercase) · location tabs with capacity bars + click-to-deselect · view toggle (Grid/Table icons) · `+ House` popover · Share · theme · About. On mobile, the picker also gets a `PanelRightOpen` icon button here that opens it as a drawer.
  - Layout switches at the **lg breakpoint (1024px)**: anything narrower stacks `brand+actions` on row 1 and `tabs` on row 2; lg+ uses the classic single-row `brand · tabs · actions` grid. Tabs are flex-nowrap with a hidden horizontal scrollbar so they never wrap into two short rows.
  - Capacity counts hide the `/40` cap on mobile (`WW 8` instead of `WW 8 / 40`); full form returns at sm+.
  - `+ House` is icon-only on mobile (just `+`); the "House" label returns at sm+.
- **House cards**: name as a static span with a small **pencil button** alongside it for editing (taps elsewhere on the card never focus the input — important on mobile to avoid accidental keyboard popups). Two inline dropdowns in the meta row (location with swatch+icon+name; shape Prefab·1/2/4 or Custom with Package/Wrench icons). Lock/unlock button. Close X. Slot grid auto-adapts columns to slot count. Each slot shows sprite + small specialty label + an inline litter-item icon overlay when applicable. Auto-derived lighting + tag chips below.
- **House table view** (alternative to the card grid): two-column layout. **House** column shows the name on top with a tight metadata row below (area icon + 2-letter code + Package/Wrench type icon + `×N` slot count). **Pokémon** column has sprite tiles in a no-wrap horizontal-scroll row. Delete is a destructive `×` icon button with a `confirm()` dialog before removal.
- **Picker (sidebar)**: sticky filter strip (multi-select specialty filter with selected items as icon+label chips; same group set as the grid; All option at top; inline FolderTree button toggles flat/specialty grouping). Stats row showing `X placed · N still need a home` with the latter being a clickable explainer popover. Optional Pokémon detail panel inline at top. Compatible section above the main grid when a house is selected. Main grid (or specialty groups when grouping is on).
  - **Mobile (<md)**: the picker is hidden by default and slides in from the right as a drawer when toggled from the topbar. Tap the backdrop or the in-drawer `×` to close. Desktop (md+) keeps the side-by-side panel.
- **Group partition** (shared by grid and filter): Story characters (Peakychu, Mosslax, Ditto, Professor Tangrowth, Smeargle, Stereo Rotom, Greedent, Tinkaton, Ho-Oh, Lugia, Kyogre, Volcanion, Tangrowth) collapse into one group. `???` specialty plus any one/two-mon specialty after story extraction collapses into Misc. Pokémon with two specialties appear in both real-specialty groups when filtered.
- **Detail panel**: opens above the grid, scrolls itself into view, restores the picker's previous scroll position on Back. Big sprite with litter overlay, name + #number, "Move to a new house" button (for placeable mons; for Story Pokémon shows "can't be housed" notice). Compact stats strip (Habitat / Specialty / Taste / Litter with item icon, "flavors" suffix dropped). Full favorites tags. Similar-Pokémon grid (same specialty1 OR ≥3 shared favorites).
- **Click-to-place**: with a non-locked house selected that has empty slots, clicking a non-assigned/non-unplaceable Pokémon drops it into the next empty slot. Otherwise click opens the detail panel.
- **Drag** still works via @dnd-kit. Locked houses reject drops.
- **Stale-selection guard**: switching to a different area deselects any house that lives elsewhere, so click-to-place can't silently send Pokémon off-screen.
- **Lock houses**: blocks delete, slot click-to-clear, drop targets, click-to-place quick mode, type/size/location changes, and rename. `addHouseWith` won't pull a Pokémon out of a locked source.
- **Theme**: light/dark via `[data-theme]` on `<html>`. OKLCH tokens in `src/styles.css`. Per-location accent colors (`--loc-ww/bb/rr/ss/pt`).
- **Empty state**: "Load example data" button populates six curated houses across all five locations.

### Cross-device handoff
- **Share button** in the topbar: gzips the planner state (`CompressionStream`), base64url-encodes it, writes to `#s=…` in the URL, copies to clipboard. Confirms with a "Copied shareable URL to clipboard" toast next to the button.
- On load, if the URL has a `#s=…` hash, the app decodes and hydrates the store, prompting before overwriting an existing local planner. The hash is then cleared from the URL bar.
- Fallback: if the clipboard API is blocked, the URL is shown via `prompt()`.

### About / counts popovers
- **About** (Info icon): credits, GitHub repo link, Serebii thank-you, and an AI-tooling footnote.
- **Roster counts** (clickable "N still need a home" with dotted underline): full breakdown — 312 total, 307 housable, the form-number references (#059/#060/#197/#145), the three story-vs-ordinary pairs, the 4 event Pokémon, and the 5 unplaceable mons.

## Outstanding

### Presets — see `2026-05-02-presets.md`
The biggest outstanding item. One-click curated arrangements (evolutionary lines, by specialty, minimum housing, etc.) that load via the share-URL system. Drafted as a separate planning doc; not started.

### Small follow-ups
- `???` specialty has no icon; the SpecialtyFilter dropdown renders a blank space slot for it. If a glyph shows up, swap it in.
- 5 pre-existing biome `noNonNullAssertion` warnings in `src/state/store.test.ts` (test-only, configured as warn). Could be cleaned up.

## Reference

- `docs/reference/poketracker.tsv` — user's canonical roster (source of truth for ingest). Local only, not committed.
- `docs/reference/litter-drops-raw.txt` — historical Serebii dump. No longer used by the ingest; kept locally for reference. Local only.
- `docs/reference/pokehouseplan.html` / `pokehouseplan.js` — the original reference site we modeled the bootstrap on. The current UI has diverged completely. Local only.
