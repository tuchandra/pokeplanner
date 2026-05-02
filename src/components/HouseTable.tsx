import { LOCATION_BY_ID } from '../data/locations';
import { POKEMON_BY_ID } from '../data/pokemon';
import { useStore } from '../state/store';

export function HouseTable() {
  const houses = useStore((s) => s.houses);
  const activeLocation = useStore((s) => s.filters.activeLocation);
  const removeHouse = useStore((s) => s.removeHouse);
  const visible = houses.filter((h) => h.location === activeLocation);

  if (visible.length === 0) {
    return <p className="empty">No houses in this location.</p>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Location</th>
          <th>Type</th>
          <th>Slots</th>
          <th>Pokémon</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {visible.map((h) => (
          <tr key={h.id}>
            <td>{h.name}</td>
            <td>{LOCATION_BY_ID[h.location].name}</td>
            <td>{h.type === 'prefab' ? 'Prefab' : 'Custom'}</td>
            <td>{h.slotCount}</td>
            <td>
              <ul className="table-sprites">
                {h.slots.map((id, i) => {
                  const p = id == null ? null : (POKEMON_BY_ID.get(id) ?? null);
                  return (
                    <li
                      key={`${h.id}-${i}`}
                      className={`table-sprite ${p ? 'filled' : 'empty'}`}
                      title={p?.name ?? 'Empty slot'}
                    >
                      {p ? <img src={p.spriteUrl} alt={p.name} /> : '—'}
                    </li>
                  );
                })}
              </ul>
            </td>
            <td>
              <button type="button" className="btn" onClick={() => removeHouse(h.id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
