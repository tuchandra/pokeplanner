import { useDraggable } from '@dnd-kit/core';
import { POKEMON, POKEMON_BY_ID } from '../data/pokemon';
import { useStore } from '../state/store';
import { derivedHabitats, type Pokemon } from '../types';
import { SpecialtyFilter } from './SpecialtyFilter';

function PickItem({ p }: { p: Pokemon }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pokemon:${p.id}`,
    data: { kind: 'pokemon', pokemonId: p.id },
  });
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`pick ${isDragging ? 'pick--dragging' : ''}`}
      title={`${p.name} — ${p.habitat}, ${p.specialty1}${p.specialty2 ? ` / ${p.specialty2}` : ''}`}
    >
      <img src={p.spriteUrl} alt={p.name} draggable={false} />
    </li>
  );
}

export function PokemonPicker() {
  const specFilter = useStore((s) => s.filters.specialtyFilter);
  const habitatCompat = useStore((s) => s.filters.habitatCompatible);
  const houses = useStore((s) => s.houses);
  const selectedHouseId = useStore((s) => s.selectedHouseId);

  const selectedHouse = selectedHouseId
    ? (houses.find((h) => h.id === selectedHouseId) ?? null)
    : null;
  const targetLighting = selectedHouse
    ? new Set(derivedHabitats(selectedHouse, (id) => POKEMON_BY_ID.get(id)).lighting)
    : null;

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

  return (
    <div className="picker">
      <div className="picker__head">
        <SpecialtyFilter />
      </div>
      <ul className="picker__grid">
        {visible.map((p) => (
          <PickItem key={p.id} p={p} />
        ))}
      </ul>
    </div>
  );
}
