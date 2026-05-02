import { describe, expect, test } from 'bun:test';
import { LIGHTING } from './lighting';
import { SPECIALTIES } from './specialties';
import { TAGS, isTag } from './tags';
import { TASTES } from './tastes';

describe('domain enums', () => {
  test('lighting has the six expected values', () => {
    expect([...LIGHTING].sort()).toEqual(['Bright', 'Cool', 'Dark', 'Dry', 'Humid', 'Warm']);
  });

  test('specialties include the canonical task verbs and ???', () => {
    for (const s of ['Grow', 'Build', 'Burn', 'Chop', '???'] as const) {
      expect(SPECIALTIES).toContain(s);
    }
  });

  test('tags vocabulary has no duplicates and uses canonical casing', () => {
    expect(new Set(TAGS).size).toBe(TAGS.length);
    expect(TAGS).toContain('Slender objects');
    expect(TAGS).not.toContain('Slender Objects');
    expect(TAGS).toContain('Noisy stuff');
    expect(TAGS).not.toContain('Noise stuff');
  });

  test('isTag narrows correctly', () => {
    expect(isTag('Lots of nature')).toBe(true);
    expect(isTag('Definitely not a real tag')).toBe(false);
  });

  test('tastes are exactly the six expected', () => {
    expect([...TASTES].sort()).toEqual([
      'Bitter flavors',
      'Dry flavors',
      'None',
      'Sour flavors',
      'Spicy flavors',
      'Sweet flavors',
    ]);
  });
});
