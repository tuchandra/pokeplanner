import { LOCATION_BY_ID } from '@/data/locations';
import { POKEMON_BY_ID } from '@/data/pokemon';
import { useStore } from '@/state/store';
import { Button } from './ui/button';

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
          {['Name', 'Location', 'Type', 'Slots', 'Pokémon', ''].map((h, i) => (
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
        {visible.map((h) => (
          <tr key={h.id} className="border-b border-border-soft last:border-0">
            <td className="px-3 py-2.5 align-middle">{h.name}</td>
            <td className="px-3 py-2.5 align-middle">{LOCATION_BY_ID[h.location].name}</td>
            <td className="px-3 py-2.5 align-middle">
              {h.type === 'prefab' ? 'Prefab' : 'Custom'}
            </td>
            <td className="px-3 py-2.5 align-middle">{h.slotCount}</td>
            <td className="px-3 py-2.5 align-middle">
              <ul className="flex flex-wrap gap-1 list-none m-0 p-0">
                {h.slots.map((id, i) => {
                  const p = id == null ? null : (POKEMON_BY_ID.get(id) ?? null);
                  return (
                    <li
                      key={`${h.id}-${i}`}
                      className="size-8 rounded-md bg-card-soft border border-border-soft grid place-items-center text-[11px] text-faint-foreground"
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
              <Button variant="secondary" size="sm" onClick={() => removeHouse(h.id)}>
                Delete
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
