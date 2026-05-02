import { POKEMON, POKEMON_BY_ID } from '@/data/pokemon';
import { cn } from '@/lib/cn';
import { recommend } from '@/lib/recommend';
import { useStore } from '@/state/store';
import { type Pokemon, derivedHabitats } from '@/types';
import { useDraggable } from '@dnd-kit/core';
import { useEffect, useRef } from 'react';
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
const STORY_GROUP = 'Story';
const MISC_GROUP = 'Misc.';
const MISC_THRESHOLD = 2;

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
      title={title}
      onClick={() => selectPokemon(p.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectPokemon(p.id);
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
    <div className="flex flex-col flex-1 min-h-0">
      <div className="sticky top-0 z-10 flex flex-col gap-2 px-3 py-2.5 bg-secondary border-b border-border-soft">
        <SpecialtyFilter />
      </div>
      <div
        ref={scrollRef}
        className="flex flex-col gap-3.5 px-3 py-3 overflow-y-auto flex-1 min-h-0"
      >
        {selectedPokemonId && <PokemonDetail key={selectedPokemonId} id={selectedPokemonId} />}
        {recommendations.length > 0 && (
          <section className="flex flex-col gap-1.5 pb-3 border-b border-dashed border-border-soft">
            <GroupTitle title="Recommended" count={selectedHouse?.name} />
            <Grid>
              {recommendations.map((p) => (
                <PickItem key={`rec-${p.id}`} p={p} assigned={false} groupKey="rec" />
              ))}
            </Grid>
          </section>
        )}
        {grouping === 'specialty' ? (
          <div className="flex flex-col gap-4">
            {groupBySpecialty(visible).map(([specialty, members]) => (
              <section key={specialty} className="flex flex-col gap-1.5">
                <GroupTitle title={specialty} count={members.length} />
                <Grid>
                  {members.map((p) => (
                    <PickItem
                      key={`${specialty}-${p.id}`}
                      p={p}
                      assigned={assignedIds.has(p.id)}
                      groupKey={specialty}
                    />
                  ))}
                </Grid>
              </section>
            ))}
          </div>
        ) : (
          <Grid>
            {visible.map((p) => (
              <PickItem key={p.id} p={p} assigned={assignedIds.has(p.id)} />
            ))}
          </Grid>
        )}
      </div>
    </div>
  );
}
