import { LOCATIONS } from '../data/locations';
import { useStore } from '../state/store';
import { capacityPoints } from '../types';
import type { House, LocationId } from '../types';

function pointsAtLocation(houses: House[], id: LocationId): number {
  return houses.filter((h) => h.location === id).reduce((sum, h) => sum + capacityPoints(h), 0);
}

export function LocationTabs() {
  const houses = useStore((s) => s.houses);
  const activeLocation = useStore((s) => s.filters.activeLocation);
  const view = useStore((s) => s.filters.view);
  const setFilter = useStore((s) => s.setFilter);

  return (
    <div className="tabs">
      <div className="tabs__list">
        {LOCATIONS.map((loc) => {
          const used = pointsAtLocation(houses, loc.id);
          const active = activeLocation === loc.id;
          return (
            <button
              key={loc.id}
              type="button"
              className={`tab ${active ? 'tab--active' : ''}`}
              onClick={() => setFilter('activeLocation', loc.id)}
              title={loc.name}
            >
              <span className="tab__id">{loc.id}</span>
              <span className="tab__count">
                {used}/{loc.capacity}
              </span>
            </button>
          );
        })}
      </div>
      <div className="tabs__view">
        <button
          type="button"
          className={`seg__btn ${view === 'grid' ? 'seg__btn--on' : ''}`}
          onClick={() => setFilter('view', 'grid')}
        >
          Grid
        </button>
        <button
          type="button"
          className={`seg__btn ${view === 'table' ? 'seg__btn--on' : ''}`}
          onClick={() => setFilter('view', 'table')}
        >
          Table
        </button>
      </div>
    </div>
  );
}
