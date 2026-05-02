import { useDroppable } from '@dnd-kit/core';
import { LOCATION_BY_ID } from '../data/locations';
import { POKEMON_BY_ID } from '../data/pokemon';
import { useStore } from '../state/store';
import { type House, derivedHabitats } from '../types';

type SlotProps = { houseId: string; slot: number; pokemonId: string | null };

function HouseSlot({ houseId, slot, pokemonId }: SlotProps) {
  const setSlotPokemon = useStore((s) => s.setSlotPokemon);
  const { isOver, setNodeRef } = useDroppable({
    id: `slot:${houseId}:${slot}`,
    data: { kind: 'slot', houseId, slot },
  });
  const p = pokemonId == null ? null : (POKEMON_BY_ID.get(pokemonId) ?? null);
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: drop target with click-to-clear shortcut; primary affordance is drag/drop
    <li
      ref={setNodeRef}
      className={`member ${p ? 'filled' : 'empty'} ${isOver ? 'is-over' : ''}`}
      onClick={p ? () => setSlotPokemon(houseId, slot, null) : undefined}
      title={p ? `${p.name} — click to remove` : 'Drop a Pokémon here'}
    >
      {p ? <img src={p.spriteUrl} alt={p.name} /> : <span className="member__empty">?</span>}
    </li>
  );
}

type Props = { house: House };

export function HouseCard({ house }: Props) {
  const removeHouse = useStore((s) => s.removeHouse);
  const renameHouse = useStore((s) => s.renameHouse);
  const selectHouse = useStore((s) => s.selectHouse);
  const isSelected = useStore((s) => s.selectedHouseId === house.id);

  const locationClass = house.location.toLowerCase();
  const { lighting, tags } = derivedHabitats(house, (id) => POKEMON_BY_ID.get(id));

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: card click selects to scope the picker; nested controls remain individually focusable
    <article
      className={`house ${locationClass} ${isSelected ? 'selected' : ''}`}
      onClick={() => selectHouse(house.id)}
    >
      <header className="house-header">
        <div className="house-info">
          <input
            className="title"
            value={house.name}
            onChange={(e) => renameHouse(house.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="location">
            {LOCATION_BY_ID[house.location].name} — {house.type === 'prefab' ? 'Prefab' : 'Custom'}
          </div>
        </div>
        <button
          type="button"
          className="remove-house"
          aria-label="Remove house"
          onClick={(e) => {
            e.stopPropagation();
            removeHouse(house.id);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <title>Remove house</title>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      <ul className="members">
        {house.slots.map((pId, i) => (
          <HouseSlot key={`${house.id}-${i}`} houseId={house.id} slot={i} pokemonId={pId} />
        ))}
      </ul>

      <div className="house-habitats">
        {lighting.map((l) => (
          <span key={l} className="habitat-chip habitat-chip--lighting">
            {l}
          </span>
        ))}
        {tags.map((t) => (
          <span key={t} className="habitat-chip">
            {t}
          </span>
        ))}
      </div>
    </article>
  );
}
