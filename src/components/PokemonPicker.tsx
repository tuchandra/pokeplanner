import { useDraggable } from '@dnd-kit/core';
import { POKEMON, POKEMON_BY_ID } from '../data/pokemon';
import { recommend } from '../lib/recommend';
import { useStore } from '../state/store';
import { type Pokemon, derivedHabitats } from '../types';
import { PokemonDetail } from './PokemonDetail';
import { SpecialtyFilter } from './SpecialtyFilter';

function PickItem({ p, assigned }: { p: Pokemon; assigned: boolean }) {
  const selectPokemon = useStore((s) => s.selectPokemon);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pokemon:${p.id}`,
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

function groupBySpecialty(visible: readonly Pokemon[]): [string, Pokemon[]][] {
  const groups = new Map<string, Pokemon[]>();
  for (const p of visible) {
    const list = groups.get(p.specialty1);
    if (list) list.push(p);
    else groups.set(p.specialty1, [p]);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export function PokemonPicker() {
  const specFilter = useStore((s) => s.filters.specialtyFilter);
  const habitatCompat = useStore((s) => s.filters.habitatCompatible);
  const grouping = useStore((s) => s.filters.pickerGrouping);
  const houses = useStore((s) => s.houses);
  const selectedHouseId = useStore((s) => s.selectedHouseId);
  const selectedPokemonId = useStore((s) => s.selectedPokemonId);

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
      <div className="picker__scroll">
        {selectedPokemonId && <PokemonDetail key={selectedPokemonId} id={selectedPokemonId} />}
        {recommendations.length > 0 && (
          <section className="picker__recs">
            <h3 className="picker__group-title">
              <span>Recommended</span>
              <span className="picker__group-count">{selectedHouse?.name}</span>
            </h3>
            <ul className="picker__grid">
              {recommendations.map((p) => (
                <PickItem key={`rec-${p.id}`} p={p} assigned={false} />
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
                    <PickItem key={p.id} p={p} assigned={assignedIds.has(p.id)} />
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
