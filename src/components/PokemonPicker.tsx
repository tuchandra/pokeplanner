import { useDraggable } from '@dnd-kit/core';
import { useEffect, useRef } from 'react';
import { POKEMON, POKEMON_BY_ID } from '../data/pokemon';
import { recommend } from '../lib/recommend';
import { useStore } from '../state/store';
import { type Pokemon, derivedHabitats } from '../types';
import { PokemonDetail } from './PokemonDetail';
import { SpecialtyFilter } from './SpecialtyFilter';

const STORY_NAMES: ReadonlySet<string> = new Set([
  'Tinkmaster',
  'Peakychu',
  'Mosslax',
  'Smearguru',
  'Ditto',
  'Chef Dente',
  'DJ Rotom',
  'Professor Tangrowth',
]);

const MISC_GROUP = 'Misc.';
const STORY_GROUP = 'Story';
const MISC_THRESHOLD = 2; // groups with ≤2 (non-story) members fold into Misc.

function PickItem({
  p,
  assigned,
  groupKey,
}: {
  p: Pokemon;
  assigned: boolean;
  groupKey?: string;
}) {
  const selectPokemon = useStore((s) => s.selectPokemon);
  const dndId = groupKey ? `pokemon:${groupKey}:${p.id}` : `pokemon:${p.id}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dndId,
    data: { kind: 'pokemon', pokemonId: p.id },
    disabled: assigned,
  });
  const dragProps = assigned ? {} : { ...attributes, ...listeners };
  const title = assigned
    ? `${p.name} — already assigned (click for details)`
    : `${p.name} — ${p.habitat}, ${p.specialty1}${p.specialty2 ? ` / ${p.specialty2}` : ''}`;
  return (
    <li
      ref={setNodeRef}
      {...dragProps}
      className={`pick ${isDragging ? 'pick--dragging' : ''} ${assigned ? 'pick--assigned' : ''}`}
      title={title}
      onClick={() => selectPokemon(p.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectPokemon(p.id);
        }
      }}
    >
      <img src={p.spriteUrl} alt={p.name} draggable={false} />
    </li>
  );
}

/**
 * Groups Pokémon by specialty for the grouped picker view, with three rules:
 *   1. Story characters (named in STORY_NAMES) collapse into a single 'Story'
 *      group regardless of their specialty1/2.
 *   2. Pokémon with two specialties appear in BOTH groups (e.g. Venusaur in
 *      Grow and Litter).
 *   3. Specialties with very few members fold into a 'Misc.' group so the
 *      picker isn't dominated by tiny single-Pokémon sections.
 * Returns groups in this order: alphabetical work specialties, then Story,
 * then Misc.
 */
function groupBySpecialty(visible: readonly Pokemon[]): [string, Pokemon[]][] {
  const groups = new Map<string, Pokemon[]>();
  const push = (key: string, p: Pokemon) => {
    const list = groups.get(key);
    if (list) list.push(p);
    else groups.set(key, [p]);
  };

  for (const p of visible) {
    if (STORY_NAMES.has(p.name)) {
      push(STORY_GROUP, p);
      continue;
    }
    push(p.specialty1, p);
    if (p.specialty2 && p.specialty2 !== p.specialty1) push(p.specialty2, p);
  }

  // Any specialty with <= MISC_THRESHOLD members (excluding Story) folds into Misc.
  const misc: Pokemon[] = [];
  const main: [string, Pokemon[]][] = [];
  for (const [key, list] of groups) {
    if (key === STORY_GROUP) continue;
    if (list.length <= MISC_THRESHOLD) {
      for (const p of list) {
        if (!misc.includes(p)) misc.push(p);
      }
    } else {
      main.push([key, list]);
    }
  }
  main.sort(([a], [b]) => a.localeCompare(b));
  if (groups.has(STORY_GROUP)) main.push([STORY_GROUP, groups.get(STORY_GROUP) ?? []]);
  if (misc.length > 0) main.push([MISC_GROUP, misc]);
  return main;
}

export function PokemonPicker() {
  const specFilter = useStore((s) => s.filters.specialtyFilter);
  const habitatCompat = useStore((s) => s.filters.habitatCompatible);
  const grouping = useStore((s) => s.filters.pickerGrouping);
  const houses = useStore((s) => s.houses);
  const selectedHouseId = useStore((s) => s.selectedHouseId);
  const selectedPokemonId = useStore((s) => s.selectedPokemonId);

  // Restore picker scroll position when the detail panel closes.
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);
  const prevSelected = useRef<string | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: respond to id transitions
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    if (prevSelected.current === null && selectedPokemonId !== null) {
      savedScroll.current = node.scrollTop;
    } else if (prevSelected.current !== null && selectedPokemonId === null) {
      node.scrollTop = savedScroll.current;
    }
    prevSelected.current = selectedPokemonId;
  }, [selectedPokemonId]);

  const selectedHouse = selectedHouseId
    ? (houses.find((h) => h.id === selectedHouseId) ?? null)
    : null;
  const targetLighting = selectedHouse
    ? new Set(derivedHabitats(selectedHouse, (id) => POKEMON_BY_ID.get(id)).lighting)
    : null;

  const assignedIds = new Set<string>();
  for (const h of houses) {
    for (const id of h.slots) {
      if (id != null) assignedIds.add(id);
    }
  }

  const visible = POKEMON.filter((p) => {
    if (specFilter.length > 0) {
      const ok =
        specFilter.includes(p.specialty1) ||
        (p.specialty2 != null && specFilter.includes(p.specialty2));
      if (!ok) return false;
    }
    if (
      habitatCompat &&
      targetLighting &&
      targetLighting.size > 0 &&
      !targetLighting.has(p.habitat)
    ) {
      return false;
    }
    return true;
  });

  const recommendations = selectedHouse
    ? recommend(POKEMON, selectedHouse, (id) => POKEMON_BY_ID.get(id), assignedIds)
    : [];

  return (
    <div className="picker">
      <div className="picker__head">
        <SpecialtyFilter />
      </div>
      <div className="picker__scroll" ref={scrollRef}>
        {selectedPokemonId && <PokemonDetail key={selectedPokemonId} id={selectedPokemonId} />}
        {recommendations.length > 0 && (
          <section className="picker__recs">
            <h3 className="picker__group-title">
              <span>Recommended</span>
              <span className="picker__group-count">{selectedHouse?.name}</span>
            </h3>
            <ul className="picker__grid">
              {recommendations.map((p) => (
                <PickItem key={`rec-${p.id}`} p={p} assigned={false} groupKey="rec" />
              ))}
            </ul>
          </section>
        )}
        {grouping === 'specialty' ? (
          <div className="picker__groups">
            {groupBySpecialty(visible).map(([specialty, members]) => (
              <section key={specialty} className="picker__group">
                <h3 className="picker__group-title">
                  <span>{specialty}</span>
                  <span className="picker__group-count">{members.length}</span>
                </h3>
                <ul className="picker__grid">
                  {members.map((p) => (
                    <PickItem
                      key={`${specialty}-${p.id}`}
                      p={p}
                      assigned={assignedIds.has(p.id)}
                      groupKey={specialty}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul className="picker__grid">
            {visible.map((p) => (
              <PickItem key={p.id} p={p} assigned={assignedIds.has(p.id)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
