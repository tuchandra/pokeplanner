import { LOCATION_BY_ID } from '@/data/locations';
import { POKEMON_BY_ID } from '@/data/pokemon';
import { cn } from '@/lib/cn';
import { useStore } from '@/state/store';
import type { LocationId } from '@/types';
import { Package, Wrench, X } from 'lucide-react';
import { Button } from './ui/button';

const LOC_ACCENT: Record<LocationId, string> = {
  WW: 'text-loc-ww',
  BB: 'text-loc-bb',
  RR: 'text-loc-rr',
  SS: 'text-loc-ss',
  PT: 'text-loc-pt',
};

export function HouseTable() {
  const houses = useStore((s) => s.houses);
  const activeLocation = useStore((s) => s.filters.activeLocation);
  const removeHouse = useStore((s) => s.removeHouse);
  const visible =
    activeLocation === null ? houses : houses.filter((h) => h.location === activeLocation);

  if (visible.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-20">
        {activeLocation === null ? 'No houses yet.' : 'No houses in this location.'}
      </p>
    );
  }

  return (
    <table className="w-full border-collapse overflow-hidden rounded-xl border border-border-soft bg-card">
      <thead>
        <tr>
          {['House', 'Pokémon', ''].map((h, i) => (
            <th
              key={h || `col-${i}`}
              className="border-b border-border-soft bg-card-soft px-3 py-2.5 text-left text-[10px] uppercase tracking-[0.08em] font-medium font-mono text-faint-foreground"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {visible.map((h) => {
          const loc = LOCATION_BY_ID[h.location];
          return (
            <tr key={h.id} className="border-b border-border-soft last:border-0">
              <td className="px-3 py-2.5 align-top whitespace-nowrap">
                <div className="font-medium leading-tight">{h.name}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.04em] font-mono text-faint-foreground">
                  <img
                    src={loc.iconUrl}
                    alt=""
                    aria-hidden
                    className="size-3.5 [image-rendering:pixelated]"
                  />
                  <span className={cn('font-medium', LOC_ACCENT[h.location])}>{h.location}</span>
                  <span className="opacity-40">·</span>
                  {h.type === 'prefab' ? (
                    <Package className="size-3" aria-hidden />
                  ) : (
                    <Wrench className="size-3" aria-hidden />
                  )}
                  <span className="tabular-nums">×{h.slotCount}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 align-middle w-full">
                <ul className="flex gap-1 list-none m-0 p-0 overflow-x-auto">
                  {h.slots.map((id, i) => {
                    const p = id == null ? null : (POKEMON_BY_ID.get(id) ?? null);
                    return (
                      <li
                        key={`${h.id}-${i}`}
                        className="size-9 shrink-0 rounded-md bg-card-soft border border-border-soft grid place-items-center text-[11px] text-faint-foreground"
                        title={p?.name ?? 'Empty slot'}
                      >
                        {p ? (
                          <img
                            src={p.spriteUrl}
                            alt={p.name}
                            className="size-[88%] [image-rendering:pixelated]"
                          />
                        ) : (
                          '—'
                        )}
                      </li>
                    );
                  })}
                </ul>
              </td>
              <td className="px-3 py-2.5 align-middle">
                <Button
                  variant="destructive"
                  size="iconSm"
                  aria-label={`Delete ${h.name}`}
                  title="Delete house"
                  onClick={() => {
                    if (window.confirm(`Delete "${h.name}"? This cannot be undone.`)) {
                      removeHouse(h.id);
                    }
                  }}
                >
                  <X />
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
