import { describe, expect, test } from 'bun:test';
import {
  type House,
  type LocationId,
  type Pokemon,
  capacityPoints,
  derivedHabitats,
} from './types';

describe('types', () => {
  test('LocationId admits the five expected values', () => {
    const ids: LocationId[] = ['WW', 'BB', 'RR', 'SS', 'PT'];
    expect(ids).toHaveLength(5);
  });

  test('House structure is constructible', () => {
    const h: House = {
      id: 'h1',
      name: 'Test',
      type: 'custom',
      location: 'PT',
      slotCount: 4,
      slots: [null, null, null, null],
    };
    expect(h.slotCount).toBe(4);
  });

  test('Pokemon structure is constructible', () => {
    const p: Pokemon = {
      id: 'bulbasaur',
      number: '001',
      name: 'Bulbasaur',
      specialty1: 'Grow',
      specialty2: null,
      habitat: 'Bright',
      favorites: ['Lots of nature'],
      taste: 'Sweet flavors',
      spriteUrl: '/sprites/001.png',
    };
    expect(p.id).toBe('bulbasaur');
  });
});

describe('capacityPoints', () => {
  test('custom houses contribute 0', () => {
    expect(capacityPoints({ type: 'custom', slotCount: 1 })).toBe(0);
    expect(capacityPoints({ type: 'custom', slotCount: 4 })).toBe(0);
  });
  test('prefab-1 = 1pt, prefab-2 and prefab-4 = 2pt', () => {
    expect(capacityPoints({ type: 'prefab', slotCount: 1 })).toBe(1);
    expect(capacityPoints({ type: 'prefab', slotCount: 2 })).toBe(2);
    expect(capacityPoints({ type: 'prefab', slotCount: 4 })).toBe(2);
  });
});

describe('derivedHabitats', () => {
  const mk = (id: string, habitat: Pokemon['habitat'], favorites: readonly string[]): Pokemon => ({
    id,
    number: '000',
    name: id,
    specialty1: '???',
    specialty2: null,
    habitat,
    favorites,
    taste: 'None',
    spriteUrl: '',
  });

  test('returns empty arrays when no slots are filled', () => {
    const result = derivedHabitats({ slots: [null, null] }, () => undefined);
    expect(result.lighting).toEqual([]);
    expect(result.tags).toEqual([]);
  });

  test('lighting is the union of assigned habitats', () => {
    const a = mk('a', 'Bright', []);
    const b = mk('b', 'Dark', []);
    const lookup = (id: string) => (id === 'a' ? a : id === 'b' ? b : undefined);
    const result = derivedHabitats({ slots: ['a', 'b', null] }, lookup);
    expect([...result.lighting].sort()).toEqual(['Bright', 'Dark']);
  });

  test('tags is the intersection of favorites across all assigned', () => {
    const a = mk('a', 'Bright', ['Plants', 'Sunshine', 'Water']);
    const b = mk('b', 'Bright', ['Plants', 'Water']);
    const c = mk('c', 'Bright', ['Plants', 'Music']);
    const lookup = (id: string) => ({ a, b, c })[id as 'a' | 'b' | 'c'];
    const result = derivedHabitats({ slots: ['a', 'b', 'c'] }, lookup);
    expect([...result.tags].sort()).toEqual(['Plants']);
  });

  test('ignores ids that lookup cannot resolve', () => {
    const a = mk('a', 'Cool', ['x']);
    const lookup = (id: string) => (id === 'a' ? a : undefined);
    const result = derivedHabitats({ slots: ['a', 'missing'] }, lookup);
    expect(result.lighting).toEqual(['Cool']);
    expect(result.tags).toEqual(['x']);
  });
});
