import type { Specialty } from '../types';

/**
 * Work specialties drive in-game tasks. Source: reference bundle (union of
 * specialty1 + specialty2). '???' is the in-game placeholder for legendaries
 * or unassigned roles and is preserved as-is.
 */
export const SPECIALTIES: readonly Specialty[] = [
  'Appraise',
  'Build',
  'Bulldoze',
  'Burn',
  'Chop',
  'Collect',
  'Crush',
  'DJ',
  'Dream Island',
  'Eat',
  'Engineer',
  'Explode',
  'Fly',
  'Gather',
  'Gather Honey',
  'Generate',
  'Grow',
  'Hype',
  'Illuminate',
  'Litter',
  'Paint',
  'Party',
  'Rarify',
  'Recycle',
  'Search',
  'Storage',
  'Teleport',
  'Trade',
  'Transform',
  'Water',
  'Yawn',
  '???',
];
