export type LocationId = 'WW' | 'BB' | 'RR' | 'SS' | 'PT';

export type Location = {
  readonly id: LocationId;
  readonly name: string;
  readonly capacity: number;
  readonly iconUrl: string;
};

export type HouseType = 'prefab' | 'custom';

/** Slot counts: only 1, 2, or 4 are valid (no 3). Matches the three prefab sizes. */
export type SlotCount = 1 | 2 | 4;

/** Habitat lighting categories — confirmed exhaustive from reference bundle. */
export type Lighting = 'Bright' | 'Dark' | 'Dry' | 'Warm' | 'Humid' | 'Cool';

/**
 * Work specialty (drives in-game tasks: Grow makes plants grow faster, Build leads
 * building projects, Burn ignites flammables, etc.). '???' is the in-game placeholder
 * for legendaries/unknowns and is preserved verbatim. Source: reference bundle.
 */
export type Specialty =
  | 'Appraise'
  | 'Build'
  | 'Bulldoze'
  | 'Burn'
  | 'Chop'
  | 'Collect'
  | 'Crush'
  | 'DJ'
  | 'Dream Island'
  | 'Eat'
  | 'Engineer'
  | 'Explode'
  | 'Fly'
  | 'Gather'
  | 'Gather Honey'
  | 'Generate'
  | 'Grow'
  | 'Hype'
  | 'Illuminate'
  | 'Litter'
  | 'Paint'
  | 'Party'
  | 'Rarify'
  | 'Recycle'
  | 'Search'
  | 'Storage'
  | 'Teleport'
  | 'Trade'
  | 'Transform'
  | 'Water'
  | 'Yawn'
  | '???';

/** Six taste flavors. 'None' covers Pokémon with no taste preference (e.g. Ditto). */
export type Taste =
  | 'Sweet flavors'
  | 'Sour flavors'
  | 'Spicy flavors'
  | 'Bitter flavors'
  | 'Dry flavors'
  | 'None';

/**
 * Feature tags. The same vocabulary is used for two purposes:
 *  - a Pokémon's `favorites` (things it likes)
 *  - a house's `tags` (things present in the house)
 * Compatibility = overlap between the two sets.
 *
 * Stored as a string union — the canonical list lives in src/data/tags.ts.
 */
export type Tag = string;

export type Pokemon = {
  /** Stable, unique slug derived from name (e.g. 'bulbasaur', 'tatsugiri-curly-form'). */
  readonly id: string;
  /** Pokédex-like number from the tracker (zero-padded 3 chars). NOT unique — forms share. */
  readonly number: string;
  readonly name: string;
  readonly specialty1: Specialty;
  readonly specialty2: Specialty | null;
  readonly habitat: Lighting;
  readonly favorites: readonly Tag[];
  readonly taste: Taste;
  /** Item this Pokémon drops when its specialty is Litter. Null when unknown or N/A. */
  readonly litterDrop: string | null;
  /** Path under the Vite base — e.g. '/pokeplanner/sprites/001.png' in prod. */
  readonly spriteUrl: string;
};

export type SlotIndex = 0 | 1 | 2 | 3;

export type House = {
  readonly id: string;
  name: string;
  type: HouseType;
  location: LocationId;
  slotCount: SlotCount;
  /** Pokémon ids by slot index, or null for empty. Length always equals slotCount. */
  slots: ReadonlyArray<string | null>;
  // Note: habitat lighting + feature tags are NOT stored. They're derived
  // from the assigned Pokémon (see derivedHabitats below).
};

/**
 * Capacity points contributed by a house against its area's 40-point budget.
 * Prefab-1 = 1, Prefab-2 = 2, Prefab-4 = 2, Custom = 0.
 */
export function capacityPoints(h: Pick<House, 'type' | 'slotCount'>): number {
  if (h.type === 'custom') return 0;
  return h.slotCount === 1 ? 1 : 2;
}

/**
 * Derived habitat chips for a house, computed from its assigned Pokémon.
 * Matches reference behavior:
 *   - lighting = unique set of `habitat` values across non-empty slots
 *   - tags    = intersection of `favorites` across all non-empty slots
 *   (so a tag is shown only when EVERY assigned Pokémon lists it)
 * Returns empty arrays when there are no assigned Pokémon.
 */
export function derivedHabitats(
  h: Pick<House, 'slots'>,
  lookup: (id: string) => Pokemon | undefined,
): { lighting: readonly Lighting[]; tags: readonly Tag[] } {
  const assigned = h.slots
    .map((id) => (id == null ? null : (lookup(id) ?? null)))
    .filter((p): p is Pokemon => p != null);
  if (assigned.length === 0) return { lighting: [], tags: [] };

  const lighting = Array.from(new Set(assigned.map((p) => p.habitat))) as Lighting[];

  let tagInter: Set<Tag> | null = null;
  for (const p of assigned) {
    const favs = new Set<Tag>(p.favorites);
    if (tagInter == null) tagInter = favs;
    else for (const t of tagInter) if (!favs.has(t)) tagInter.delete(t);
  }
  return { lighting, tags: Array.from(tagInter ?? new Set<Tag>()) };
}
