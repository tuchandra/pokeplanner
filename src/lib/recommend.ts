import { type House, type Pokemon, derivedHabitats } from '../types';

/**
 * Score a candidate against a house's current derived chips.
 *  - +10 if its habitat is already in the house's lighting set (keeps the
 *    house's lighting tight)
 *  - +1 per house tag the candidate also has in its favorites (preserves the
 *    intersection of shared favorites)
 * Returns -Infinity if the house is empty (no signal to score against).
 */
export function scoreCandidate(
  p: Pokemon,
  house: Pick<House, 'slots'>,
  lookup: (id: string) => Pokemon | undefined,
): number {
  const { lighting, tags } = derivedHabitats(house, lookup);
  if (lighting.length === 0) return Number.NEGATIVE_INFINITY;
  let score = lighting.includes(p.habitat) ? 10 : 0;
  for (const t of tags) {
    if (p.favorites.includes(t)) score++;
  }
  return score;
}

/**
 * Top-N candidates for a partially-filled house, sorted by score descending.
 * Excludes Pokémon already assigned to any slot in any house. Excludes the
 * house's own current members. Ties broken by tracker order (stable filter).
 */
export function recommend(
  pool: readonly Pokemon[],
  house: Pick<House, 'slots'>,
  lookup: (id: string) => Pokemon | undefined,
  assignedIds: ReadonlySet<string>,
  limit = 6,
): Pokemon[] {
  type Scored = { p: Pokemon; score: number };
  const scored: Scored[] = [];
  for (const p of pool) {
    if (assignedIds.has(p.id)) continue;
    const score = scoreCandidate(p, house, lookup);
    if (!Number.isFinite(score)) return [];
    if (score <= 0) continue;
    scored.push({ p, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.p);
}
