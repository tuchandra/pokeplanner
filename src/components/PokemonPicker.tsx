import { POKEMON, POKEMON_BY_ID } from '@/data/pokemon';
import { cn } from '@/lib/cn';
import {
  type GroupPartition,
  MISC_GROUP,
  STORY_GROUP,
  partitionGroups,
  pokemonInGroup,
} from '@/lib/picker-groups';
import { recommend } from '@/lib/recommend';
import { useStore } from '@/state/store';
import { type Pokemon, derivedHabitats } from '@/types';
import { useDraggable } from '@dnd-kit/core';
import { useEffect, useMemo, useRef } from 'react';
import { PokemonDetail } from './PokemonDetail';
import { SpecialtyFilter } from './SpecialtyFilter';

function PickItem({
  p,
  assigned,
  quickPlaceMode,
  groupKey,
}: {
  p: Pokemon;
  assigned: boolean;
  /** When true, click places into the active house's next empty slot instead of opening detail. */
  quickPlaceMode: boolean;
  groupKey?: string;
}) {
  const selectPokemon = useStore((s) => s.selectPokemon);
  const setSlotPokemon = useStore((s) => s.setSlotPokemon);
  const selectedHouseId = useStore((s) => s.selectedHouseId);
  const houses = useStore((s) => s.houses);
  const dndId = groupKey ? `pokemon:${groupKey}:${p.id}` : `pokemon:${p.id}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dndId,
    data: { kind: 'pokemon', pokemonId: p.id },
    disabled: assigned,
  });
  const dragProps = assigned ? {} : { ...attributes, ...listeners };

  function handleClick() {
    if (quickPlaceMode && !assigned && selectedHouseId) {
      const house = houses.find((h) => h.id === selectedHouseId);
      if (house) {
        const emptyIdx = house.slots.findIndex((s) => s == null);
        if (emptyIdx !== -1) {
          setSlotPokemon(house.id, emptyIdx, p.id);
          return;
        }
      }
    }
    selectPokemon(p.id);
  }

  const title = assigned
    ? `${p.name} — already assigned (click for details)`
    : quickPlaceMode
      ? `${p.name} — click to place; drag to a specific slot`
      : `${p.name} — ${p.habitat}, ${p.specialty1}${p.specialty2 ? ` / ${p.specialty2}` : ''}`;
  return (
    <li
      ref={setNodeRef}
      {...dragProps}
      title={title}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        'aspect-square rounded-md border border-border-soft bg-card-soft cursor-pointer p-0 grid place-items-center transition-all list-none',
        'hover:bg-card hover:border-border hover:-translate-y-px',
        isDragging && 'cursor-grabbing opacity-55',
        assigned &&
          'cursor-default opacity-30 grayscale-[70%] hover:translate-y-0 hover:bg-card-soft hover:border-border-soft',
      )}
    >
      <img
        src={p.spriteUrl}
        alt={p.name}
        draggable={false}
        className="size-[86%] [image-rendering:pixelated] pointer-events-none"
      />
    </li>
  );
}

function GroupTitle({ title, count }: { title: string; count?: number | string }) {
  return (
    <h3 className="m-0 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-faint-foreground font-medium">
      <span>{title}</span>
      {count != null && <span className="opacity-70 font-normal">{count}</span>}
      <span aria-hidden className="flex-1 h-px bg-border-soft" />
    </h3>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <ul className="grid grid-cols-6 gap-1 list-none m-0 p-0">{children}</ul>;
}

function buildGroupedView(
  visible: readonly Pokemon[],
  partition: GroupPartition,
  showAllGroups: boolean,
): [string, Pokemon[]][] {
  const groups = new Map<string, Pokemon[]>();
  const push = (key: string, p: Pokemon) => {
    const list = groups.get(key);
    if (list) list.push(p);
    else groups.set(key, [p]);
  };

  for (const p of visible) {
    if (partition.storyIds.has(p.id)) {
      push(STORY_GROUP, p);
      continue;
    }
    if (showAllGroups) {
      push(p.specialty1, p);
      if (p.specialty2 && p.specialty2 !== p.specialty1) push(p.specialty2, p);
      continue;
    }
    if (partition.miscIds.has(p.id)) {
      push(MISC_GROUP, p);
      continue;
    }
    push(p.specialty1, p);
    if (p.specialty2 && p.specialty2 !== p.specialty1) push(p.specialty2, p);
  }

  // Order: real specialties (alpha), then Story, then Misc.
  const main: [string, Pokemon[]][] = [];
  const realKeys: string[] = [];
  for (const key of groups.keys()) {
    if (key !== STORY_GROUP && key !== MISC_GROUP) realKeys.push(key);
  }
  realKeys.sort((a, b) => a.localeCompare(b));
  for (const key of realKeys) main.push([key, groups.get(key) ?? []]);
  if (groups.has(STORY_GROUP)) main.push([STORY_GROUP, groups.get(STORY_GROUP) ?? []]);
  if (groups.has(MISC_GROUP)) main.push([MISC_GROUP, groups.get(MISC_GROUP) ?? []]);
  return main;
}

export function PokemonPicker() {
  const specFilter = useStore((s) => s.filters.specialtyFilter);
  const grouping = useStore((s) => s.filters.pickerGrouping);
  const houses = useStore((s) => s.houses);
  const selectedHouseId = useStore((s) => s.selectedHouseId);
  const selectedPokemonId = useStore((s) => s.selectedPokemonId);

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

  const partition = useMemo(() => partitionGroups(POKEMON), []);

  const visible = POKEMON.filter((p) => {
    if (specFilter.length > 0) {
      // Match if the Pokémon belongs to ANY selected group. Groups can be a
      // real specialty, Story, or Misc. — see partitionGroups.
      const ok = specFilter.some((key) => pokemonInGroup(p, key, partition));
      if (!ok) return false;
    }
    return true;
  });

  // "Compatible" = Pokémon that already share the active house's lighting set
  // (so adding them won't expand its habitat chips). Sorted by recommend score
  // so the strongest fits float to the top of the section. Only shown when a
  // house is selected and has at least one assigned Pokémon — otherwise the
  // lighting set is empty and "compatible" has no meaning.
  const compatible =
    selectedHouse && targetLighting && targetLighting.size > 0
      ? recommend(
          POKEMON.filter((p) => targetLighting.has(p.habitat)),
          selectedHouse,
          (id) => POKEMON_BY_ID.get(id),
          assignedIds,
          Number.POSITIVE_INFINITY,
        )
      : [];

  // Click → place into the active house's first empty slot when one exists.
  const quickPlaceMode = !!selectedHouse && selectedHouse.slots.some((s) => s == null);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="sticky top-0 z-10 flex flex-col gap-2 px-3 py-2.5 bg-secondary border-b border-border-soft">
        <SpecialtyFilter />
      </div>
      <div
        ref={scrollRef}
        className="flex flex-col gap-3.5 px-3 py-3 overflow-y-auto flex-1 min-h-0"
      >
        {selectedPokemonId && <PokemonDetail key={selectedPokemonId} id={selectedPokemonId} />}
        {compatible.length > 0 && (
          <section className="flex flex-col gap-1.5 pb-3 border-b border-dashed border-border-soft">
            <GroupTitle title="Compatible" count={selectedHouse?.name} />
            <Grid>
              {compatible.map((p) => (
                <PickItem
                  key={`compat-${p.id}`}
                  p={p}
                  assigned={assignedIds.has(p.id)}
                  quickPlaceMode={quickPlaceMode}
                  groupKey="compat"
                />
              ))}
            </Grid>
          </section>
        )}
        {grouping === 'specialty' ? (
          <div className="flex flex-col gap-4">
            {buildGroupedView(visible, partition, specFilter.length > 0).map(
              ([specialty, members]) => (
                <section key={specialty} className="flex flex-col gap-1.5">
                  <GroupTitle title={specialty} count={members.length} />
                  <Grid>
                    {members.map((p) => (
                      <PickItem
                        key={`${specialty}-${p.id}`}
                        p={p}
                        assigned={assignedIds.has(p.id)}
                        quickPlaceMode={quickPlaceMode}
                        groupKey={specialty}
                      />
                    ))}
                  </Grid>
                </section>
              ),
            )}
          </div>
        ) : (
          <Grid>
            {visible.map((p) => (
              <PickItem
                key={p.id}
                p={p}
                assigned={assignedIds.has(p.id)}
                quickPlaceMode={quickPlaceMode}
              />
            ))}
          </Grid>
        )}
      </div>
    </div>
  );
}
