import { LITTER_ITEM_SPRITES } from '@/data/litter-items';
import { LOCATIONS, LOCATION_BY_ID } from '@/data/locations';
import { POKEMON_BY_ID } from '@/data/pokemon';
import { cn } from '@/lib/cn';
import { useStore } from '@/state/store';
import {
  type House,
  type HouseType,
  type LocationId,
  type Pokemon,
  type SlotCount,
  derivedHabitats,
} from '@/types';
import { useDroppable } from '@dnd-kit/core';
import { Lock, Unlock, X } from 'lucide-react';
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

const LOC_DOT: Record<LocationId, string> = {
  WW: 'bg-loc-ww',
  BB: 'bg-loc-bb',
  RR: 'bg-loc-rr',
  SS: 'bg-loc-ss',
  PT: 'bg-loc-pt',
};

// Combined options for the type+size dropdown — encoded as 'prefab-1' /
// 'prefab-2' / 'prefab-4' / 'custom'. Custom is always 4 slots.
const SHAPE_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
  type: HouseType;
  slotCount: SlotCount;
}> = [
  { value: 'prefab-1', label: 'Prefab · 1', type: 'prefab', slotCount: 1 },
  { value: 'prefab-2', label: 'Prefab · 2', type: 'prefab', slotCount: 2 },
  { value: 'prefab-4', label: 'Prefab · 4', type: 'prefab', slotCount: 4 },
  { value: 'custom', label: 'Custom', type: 'custom', slotCount: 4 },
];

function shapeKey(h: Pick<House, 'type' | 'slotCount'>): string {
  return h.type === 'custom' ? 'custom' : `prefab-${h.slotCount}`;
}
function shapeLabel(h: Pick<House, 'type' | 'slotCount'>): string {
  return SHAPE_OPTIONS.find((o) => o.value === shapeKey(h))?.label ?? 'Prefab';
}

type SlotProps = {
  houseId: string;
  slot: number;
  pokemonId: string | null;
  locked: boolean;
};

function HouseSlot({ houseId, slot, pokemonId, locked }: SlotProps) {
  const setSlotPokemon = useStore((s) => s.setSlotPokemon);
  const { isOver, setNodeRef } = useDroppable({
    id: `slot:${houseId}:${slot}`,
    data: { kind: 'slot', houseId, slot },
    disabled: locked,
  });
  const p = pokemonId == null ? null : (POKEMON_BY_ID.get(pokemonId) ?? null);
  const litterSprite = p?.litterDrop ? LITTER_ITEM_SPRITES[p.litterDrop] : null;
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: drop target with click-to-clear; primary affordance is drag
    <li
      ref={setNodeRef}
      className={cn(
        'rounded-lg border border-border-soft bg-card-soft transition-colors relative overflow-hidden flex flex-col',
        p
          ? locked
            ? 'cursor-default bg-background'
            : 'cursor-pointer hover:border-destructive bg-background'
          : 'cursor-default min-h-20',
        isOver &&
          'border-primary bg-[color-mix(in_oklch,var(--color-primary)_15%,transparent)] shadow-[inset_0_0_0_1px_var(--color-primary)]',
      )}
      onClick={p && !locked ? () => setSlotPokemon(houseId, slot, null) : undefined}
      title={
        p
          ? locked
            ? `${p.name} — house is locked`
            : `${p.name} — click to remove`
          : locked
            ? 'House is locked'
            : 'Drop a Pokémon here'
      }
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
          {!locked && (
            <span className="absolute inset-0 bg-destructive/15 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
          )}
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
  const reshapeHouse = useStore((s) => s.reshapeHouse);
  const setHouseLocked = useStore((s) => s.setHouseLocked);
  const selectHouse = useStore((s) => s.selectHouse);
  const isSelected = useStore((s) => s.selectedHouseId === house.id);
  const locked = house.locked === true;

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
      onClick={() => selectHouse(isSelected ? null : house.id)}
    >
      <header className="flex items-start gap-1">
        <div className="flex-1 min-w-0">
          <input
            className="w-full bg-transparent border-0 outline-none text-foreground text-[15px] font-bold tracking-[-0.015em] focus:text-[--color-loc-ww] p-0 disabled:cursor-default"
            value={house.name}
            disabled={locked}
            onChange={(e) => renameHouse(house.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="mt-0.5 flex items-center gap-1 text-[10px] uppercase tracking-[0.04em] font-mono text-faint-foreground flex-wrap">
            <Select
              value={house.location}
              disabled={locked}
              onValueChange={(v) => relocateHouse(house.id, v as LocationId)}
            >
              <SelectTrigger
                size="sm"
                className="h-auto px-1.5 py-0.5 border-transparent bg-transparent uppercase tracking-[0.04em] font-mono text-[10px] hover:bg-card-soft hover:border-border-soft w-auto gap-1.5 disabled:opacity-100"
                onClick={(e) => e.stopPropagation()}
                title={locked ? 'House is locked' : 'Move to another area'}
              >
                <span
                  aria-hidden
                  className={cn('inline-block size-2 rounded-full', LOC_DOT[house.location])}
                />
                <img
                  src={LOCATION_BY_ID[house.location].iconUrl}
                  alt=""
                  aria-hidden
                  className="size-4 [image-rendering:pixelated]"
                />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {LOCATIONS.map((l) => (
                  <SelectItem
                    key={l.id}
                    value={l.id}
                    className="text-xs"
                    icon={
                      <span className="inline-flex items-center gap-1.5 shrink-0">
                        <span
                          aria-hidden
                          className={cn('inline-block size-2 rounded-full', LOC_DOT[l.id])}
                        />
                        <img
                          src={l.iconUrl}
                          alt=""
                          aria-hidden
                          className="size-4 [image-rendering:pixelated]"
                        />
                      </span>
                    }
                  >
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="opacity-40">·</span>
            <Select
              value={shapeKey(house)}
              disabled={locked}
              onValueChange={(v) => {
                const opt = SHAPE_OPTIONS.find((o) => o.value === v);
                if (opt) reshapeHouse(house.id, opt.type, opt.slotCount);
              }}
            >
              <SelectTrigger
                size="sm"
                className="h-auto px-1.5 py-0.5 border-transparent bg-transparent uppercase tracking-[0.04em] font-mono text-[10px] hover:bg-card-soft hover:border-border-soft w-auto gap-1 disabled:opacity-100"
                onClick={(e) => e.stopPropagation()}
                title={locked ? 'House is locked' : 'Change house type or size'}
              >
                <SelectValue>{shapeLabel(house)}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                {SHAPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          variant="ghost"
          size="iconSm"
          aria-label={locked ? 'Unlock house' : 'Lock house'}
          title={locked ? 'Unlock house' : 'Lock house'}
          onClick={(e) => {
            e.stopPropagation();
            setHouseLocked(house.id, !locked);
          }}
          className={locked ? 'text-foreground' : 'text-muted-foreground'}
        >
          {locked ? <Lock /> : <Unlock />}
        </Button>
        <Button
          variant="destructive"
          size="iconSm"
          aria-label="Remove house"
          disabled={locked}
          onClick={(e) => {
            e.stopPropagation();
            removeHouse(house.id);
          }}
        >
          <X />
        </Button>
      </header>

      <ul
        className={cn(
          'grid gap-1.5 list-none m-0 p-0',
          house.slotCount === 1 && 'grid-cols-1',
          house.slotCount === 2 && 'grid-cols-2',
          house.slotCount === 4 && 'grid-cols-4',
        )}
      >
        {house.slots.map((pId, i) => (
          <HouseSlot
            key={`${house.id}-${i}`}
            houseId={house.id}
            slot={i}
            pokemonId={pId}
            locked={locked}
          />
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
