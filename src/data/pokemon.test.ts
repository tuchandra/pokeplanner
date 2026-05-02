import { describe, expect, test } from 'bun:test';
import { LIGHTING } from './lighting';
import { POKEMON, POKEMON_BY_ID } from './pokemon';
import { SPECIALTIES } from './specialties';
import { TAGS } from './tags';
import { TASTES } from './tastes';

describe('pokemon roster', () => {
  test('has at least 250 entries', () => {
    // exact count depends on the TSV — assert a floor so the test doesn't
    // become flaky every time the user adds rows
    expect(POKEMON.length).toBeGreaterThanOrEqual(250);
  });

  test('every Pokémon has a unique id', () => {
    expect(new Set(POKEMON.map((p) => p.id)).size).toBe(POKEMON.length);
  });

  test('every Pokémon has a known habitat / specialty1 / taste', () => {
    for (const p of POKEMON) {
      expect(LIGHTING).toContain(p.habitat);
      expect(SPECIALTIES).toContain(p.specialty1);
      expect(TASTES).toContain(p.taste);
    }
  });

  test('every Pokémon favorite is in the canonical TAGS set', () => {
    for (const p of POKEMON) {
      for (const f of p.favorites) {
        expect(TAGS).toContain(f);
      }
    }
  });

  test('lookup by id works for a known Pokémon', () => {
    expect(POKEMON_BY_ID.get('bulbasaur')?.name).toBe('Bulbasaur');
  });

  test('sprite URLs go through our origin (no serebii hotlinking)', () => {
    for (const p of POKEMON) {
      expect(p.spriteUrl).not.toContain('serebii.net');
      // slug-based filenames: lowercase, digits, hyphens. ('?' allowed for
      // the rare row whose tracker number is undeterminable, though the
      // current ingest writes slugs from the name regardless of number.)
      expect(p.spriteUrl).toMatch(/\/sprites\/[a-z0-9?-]+\.png$/);
    }
  });
});
