import type { Tag } from '../types';

/**
 * Feature tag vocabulary. Used by both:
 *  - house-side tags (what a house has)
 *  - Pokémon-side `favorites` (what a Pokémon likes)
 * Source: reference bundle, normalised. Cleanups applied:
 *   - 'Slender Objects' (capital O variant) → 'Slender objects'
 *   - 'Noise stuff' (typo seen once) → 'Noisy stuff'
 */
export const TAGS: readonly Tag[] = [
  'Blocky stuff',
  'Cleanliness',
  'Colorful stuff',
  'Complicated stuff',
  'Construction',
  'Containers',
  'Cute stuff',
  'Electronics',
  'Exercise',
  'Fabric',
  'Garbage',
  'Gatherings',
  'Glass stuff',
  'Group Activities',
  'Hard stuff',
  'Healing',
  'Letters and words',
  'Looks like food',
  'Lots of dirt',
  'Lots of fire',
  'Lots of nature',
  'Lots of water',
  'Luxury',
  'Metal stuff',
  'Nice breezes',
  'Noisy stuff',
  'Ocean vibes',
  'Play spaces',
  'Pretty flowers',
  'Rides',
  'Round stuff',
  'Sharp stuff',
  'Shiny stuff',
  'Slender objects',
  'Soft stuff',
  'Spinning stuff',
  'Spooky stuff',
  'Stone stuff',
  'Strange stuff',
  'Symbols',
  'Watching stuff',
  'Wobbly stuff',
  'Wooden stuff',
];

const TAG_SET = new Set<string>(TAGS);
export function isTag(s: string): s is Tag {
  return TAG_SET.has(s);
}
