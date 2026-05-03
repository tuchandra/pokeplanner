import type { Pokemon } from '../types';

export const STORY_GROUP = 'Story';
export const MISC_GROUP = 'Misc.';
const UNKNOWN_SPECIALTY = '???';
const MISC_THRESHOLD = 2;

const STORY_NAMES: ReadonlySet<string> = new Set([
  'Peakychu',
  'Mosslax',
  'Ditto',
  'Professor Tangrowth',
  'Smeargle',
  'Stereo Rotom',
  'Greedent',
  'Tinkaton',
  // Legendaries that exist in the game but can't actually be housed.
  'Ho-Oh',
  'Lugia',
  'Kyogre',
  'Volcanion',
]);

/**
 * Story characters that exist in the roster but can't be assigned to a house.
 * The picker shows them greyed out (matching the assigned-elsewhere visual);
 * drag and click-to-place are disabled. Click still opens the detail panel.
 */
export const UNPLACEABLE_NAMES: ReadonlySet<string> = new Set([
  'Ho-Oh',
  'Lugia',
  'Kyogre',
  'Volcanion',
]);

export type GroupPartition = {
  /** Display order for groups: real specialties (alpha), then Story, then Misc. */
  readonly orderedKeys: readonly string[];
  /** Pokemon ids in the Story group. */
  readonly storyIds: ReadonlySet<string>;
  /** Pokemon ids in the Misc. group. */
  readonly miscIds: ReadonlySet<string>;
};

/**
 * Partitions the full Pokémon roster into the same set of groups the picker
 * uses (real specialties with >2 members, plus Story and Misc.). Story
 * characters are assigned by name; Misc absorbs `???` specialty and any small
 * one/two-mon specialty after story names are removed. Pokemon with two
 * specialties live in both real-specialty groups.
 *
 * The result is computed once over the full roster (not the user's current
 * filter), so options are stable as the picker filter changes.
 */
export function partitionGroups(roster: readonly Pokemon[]): GroupPartition {
  const memberLists = new Map<string, Pokemon[]>();
  const storyIds = new Set<string>();

  for (const p of roster) {
    if (STORY_NAMES.has(p.name)) {
      storyIds.add(p.id);
      continue;
    }
    const push = (key: string) => {
      const list = memberLists.get(key);
      if (list) list.push(p);
      else memberLists.set(key, [p]);
    };
    push(p.specialty1);
    if (p.specialty2 && p.specialty2 !== p.specialty1) push(p.specialty2);
  }

  const main: string[] = [];
  const miscIds = new Set<string>();
  for (const [key, list] of memberLists) {
    if (key === UNKNOWN_SPECIALTY || list.length <= MISC_THRESHOLD) {
      for (const p of list) miscIds.add(p.id);
    } else {
      main.push(key);
    }
  }
  main.sort((a, b) => a.localeCompare(b));
  const orderedKeys: string[] = [...main];
  if (storyIds.size > 0) orderedKeys.push(STORY_GROUP);
  if (miscIds.size > 0) orderedKeys.push(MISC_GROUP);
  return { orderedKeys, storyIds, miscIds };
}

/** True if this Pokémon belongs to the named filter group. */
export function pokemonInGroup(p: Pokemon, group: string, partition: GroupPartition): boolean {
  if (group === STORY_GROUP) return partition.storyIds.has(p.id);
  if (group === MISC_GROUP) return partition.miscIds.has(p.id);
  if (partition.storyIds.has(p.id)) return false;
  if (partition.miscIds.has(p.id)) return false;
  return p.specialty1 === group || p.specialty2 === group;
}
