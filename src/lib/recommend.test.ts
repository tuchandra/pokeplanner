import { describe, expect, test } from 'bun:test';
import type { Pokemon } from '../types';
import { recommend, scoreCandidate } from './recommend';

const mk = (
  id: string,
  habitat: Pokemon['habitat'],
  favorites: readonly string[],
  specialty1: Pokemon['specialty1'] = '???',
): Pokemon => ({
  id,
  number: '000',
  name: id,
  specialty1,
  specialty2: null,
  habitat,
  favorites,
  taste: 'None',
  litterDrop: null,
  spriteUrl: '',
});

describe('scoreCandidate', () => {
  const a = mk('a', 'Bright', ['Lots of nature', 'Soft stuff']);
  const b = mk('b', 'Dark', ['Lots of fire']);
  const lookup = (id: string) => (id === 'a' ? a : id === 'b' ? b : undefined);

  test('returns -Infinity when the house is empty', () => {
    expect(scoreCandidate(a, { slots: [null, null] }, lookup)).toBe(Number.NEGATIVE_INFINITY);
  });

  test('habitat match scores +10', () => {
    const candidate = mk('c', 'Bright', []);
    expect(scoreCandidate(candidate, { slots: ['a'] }, lookup)).toBe(10);
  });

  test('habitat mismatch scores 0 (plus tag overlap)', () => {
    const candidate = mk('c', 'Cool', []);
    expect(scoreCandidate(candidate, { slots: ['a'] }, lookup)).toBe(0);
  });

  test('+1 per shared house-tag', () => {
    // Two-member house: tag intersection is the favorites both share.
    const c = mk('c', 'Bright', ['Lots of nature']);
    const d = mk('d', 'Bright', ['Lots of nature']);
    const lk = (id: string) => (id === 'c' ? c : id === 'd' ? d : undefined);
    const candidate = mk('cand', 'Bright', ['Lots of nature']);
    // Habitat match (+10) + 1 tag overlap = 11
    expect(scoreCandidate(candidate, { slots: ['c', 'd'] }, lk)).toBe(11);
  });
});

describe('recommend', () => {
  const pool: Pokemon[] = [
    mk('match', 'Bright', ['Lots of nature']),
    mk('partial', 'Bright', []),
    mk('miss', 'Cool', []),
  ];
  const anchor = mk('anchor', 'Bright', ['Lots of nature']);
  const lookup = (id: string) => (id === 'anchor' ? anchor : pool.find((p) => p.id === id));

  test('returns empty array when house is empty', () => {
    expect(recommend(pool, { slots: [null, null] }, lookup, new Set())).toEqual([]);
  });

  test('orders by score descending', () => {
    const result = recommend(pool, { slots: ['anchor'] }, lookup, new Set());
    expect(result.map((p) => p.id)).toEqual(['match', 'partial']);
  });

  test('excludes already-assigned Pokémon', () => {
    const result = recommend(pool, { slots: ['anchor'] }, lookup, new Set(['match']));
    expect(result.map((p) => p.id)).toEqual(['partial']);
  });

  test('respects the limit', () => {
    const result = recommend(pool, { slots: ['anchor'] }, lookup, new Set(), 1);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('match');
  });
});
