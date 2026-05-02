import { LITTER_ITEM_SPRITES } from '@/data/litter-items';
import { LOCATIONS } from '@/data/locations';
import { POKEMON_BY_ID } from '@/data/pokemon';
import { cn } from '@/lib/cn';
import { useStore } from '@/state/store';
import { type House, type LocationId, type Pokemon, derivedHabitats } from '@/types';
import { useDroppable } from '@dnd-kit/core';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

function specialtyLabel(p: Pokemon): string {
  return p.specialty2 ? `${p.specialty1} / ${p.specialty2}` : p.specialty1;
}

const LOC_BORDER: Record<LocationId, string> = {
  WW: 'border-loc-ww',
  BB: 'border-loc-bb',
  RR: 'border-loc-rr',
  SS: 'border-loc-ss',
  PT: 'border-loc-pt',
};

type SlotProps = { houseId: string; slot: number; pokemonId: string | null };

function HouseSlot({ houseId, slot, pokemonId }: SlotProps) {
  const setSlotPokemon = useStore((s) => s.setSlotPokemon);
  const { isOver, setNodeRef } = useDroppable({
    id: `slot:${houseId}:${slot}`,
    data: { kind: 'slot', houseId, slot },
  });
  const p = pokemonId == null ? null : (POKEMON_BY_ID.get(pokemonId) ?? null);
  const litterSprite = p?.litterDrop ? LITTER_ITEM_SPRITES[p.litterDrop] : null;
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: drop target with click-to-clear; primary affordance is drag
    <li
      ref={setNodeRef}
      className={cn(
        'rounded-lg border border-border-soft bg-card-soft transition-colors relative overflow-hidden flex flex-col',
        p ? 'cursor-pointer hover:border-destructive bg-background' : 'cursor-default min-h-20',
        isOver &&
          'border-primary bg-[color-mix(in_oklch,var(--color-primary)_15%,transparent)] shadow-[inset_0_0_0_1px_var(--color-primary)]',
      )}
      onClick={p ? () => setSlotPokemon(houseId, slot, null) : undefined}
      title={p ? `${p.name} — click to remove` : 'Drop a Pokémon here'}
    >
      {p ? (
        <>
          <div className="relative grid place-items-center pt-1">
            <img src={p.spriteUrl} alt={p.name} className="size-12 [image-rendering:pixelated]" />
            {litterSprite && (
              <img
                src={litterSprite}
                alt={p.litterDrop ?? 'litter'}
                title={p.litterDrop ?? undefined}
                className="absolute right-0.5 bottom-0 size-5 rounded-sm bg-card border border-border-soft p-0.5"
              />
            )}
          </div>
          <div className="text-[9px] uppercase tracking-[0.04em] font-mono text-faint-foreground text-center leading-tight px-1 py-1 truncate">
            {specialtyLabel(p)}
          </div>
          <span className="absolute inset-0 bg-destructive/15 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
        </>
      ) : (
        <span className="m-auto font-medium text-base text-faint-foreground">?</span>
      )}
    </li>
  );
}

type Props = { house: House };

export function HouseCard({ house }: Props) {
  const removeHouse = useStore((s) => s.removeHouse);
  const renameHouse = useStore((s) => s.renameHouse);
  const relocateHouse = useStore((s) => s.relocateHouse);
  const selectHouse = useStore((s) => s.selectHouse);
  const isSelected = useStore((s) => s.selectedHouseId === house.id);

  const { lighting, tags } = derivedHabitats(house, (id) => POKEMON_BY_ID.get(id));

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: card click selects to scope picker; nested controls remain focusable
    <article
      className={cn(
        'relative rounded-2xl border bg-card p-3.5 flex flex-col gap-2.5 cursor-pointer transition-[border-color,transform] animate-in fade-in slide-in-from-bottom-1 duration-300',
        isSelected
          ? cn(
              LOC_BORDER[house.location],
              'shadow-[0_0_0_1px_var(--tw-shadow-color)] shadow-current',
            )
          : 'border-border-soft hover:border-border',
      )}
      onClick={() => selectHouse(house.id)}
    >
      <header className="flex items-start gap-1">
        <div className="flex-1 min-w-0">
          <input
            className="w-full bg-transparent border-0 outline-none text-foreground text-[15px] font-bold tracking-[-0.015em] focus:text-[--color-loc-ww] p-0"
            value={house.name}
            onChange={(e) => renameHouse(house.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.04em] font-mono text-faint-foreground">
            <Select
              value={house.location}
              onValueChange={(v) => relocateHouse(house.id, v as LocationId)}
            >
              <SelectTrigger
                size="sm"
                className="h-auto px-1.5 py-0.5 border-transparent bg-transparent uppercase tracking-[0.04em] font-mono text-[10px] hover:bg-card-soft hover:border-border-soft w-auto gap-1"
                onClick={(e) => e.stopPropagation()}
                title="Move to another area"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {LOCATIONS.map((l) => (
                  <SelectItem key={l.id} value={l.id} className="text-xs">
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="opacity-40">·</span>
            <span>{house.type === 'prefab' ? 'Prefab' : 'Custom'}</span>
          </div>
        </div>
        <Button
          variant="destructive"
          size="iconSm"
          aria-label="Remove house"
          onClick={(e) => {
            e.stopPropagation();
            removeHouse(house.id);
          }}
        >
          <X />
        </Button>
      </header>

      <ul className="grid grid-cols-4 gap-1.5 list-none m-0 p-0">
        {house.slots.map((pId, i) => (
          <HouseSlot key={`${house.id}-${i}`} houseId={house.id} slot={i} pokemonId={pId} />
        ))}
      </ul>

      <div className="flex flex-wrap gap-1 min-h-5">
        {lighting.map((l) => (
          <span
            key={l}
            className="rounded-full border-0 bg-[color-mix(in_oklch,var(--color-primary)_18%,transparent)] px-2 py-0.5 text-[11px] font-semibold text-foreground"
          >
            {l}
          </span>
        ))}
        {tags.map((t) => (
          <span
            key={t}
            className="rounded-full border border-border-soft bg-[color-mix(in_oklch,var(--color-foreground)_4%,transparent)] px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            {t}
          </span>
        ))}
      </div>
    </article>
  );
}
