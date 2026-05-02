import type { Pokemon } from '../types';
import { POKEMON_RAW } from './pokemon.generated';

// At runtime, prepend Vite's BASE_URL so /sprites/001.png becomes /pokeplanner/sprites/001.png in prod.
// Fallback to '/' under non-Vite runtimes (bun:test) where import.meta.env is undefined.
const BASE = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '');

export const POKEMON: readonly Pokemon[] = POKEMON_RAW.map((p) => ({
  ...p,
  spriteUrl: `${BASE}${p.spriteUrl}`,
}));

export const POKEMON_BY_ID: ReadonlyMap<string, Pokemon> = new Map(POKEMON.map((p) => [p.id, p]));
