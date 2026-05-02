import { LOCATIONS } from '../data/locations';
import { useStore } from '../state/store';
import type { HouseType, LocationId } from '../types';

export function Header() {
  const { pendingType, pendingSlots, pendingLocation, theme } = useStore((s) => s.filters);
  const setFilter = useStore((s) => s.setFilter);
  const addHouse = useStore((s) => s.addHouse);

  return (
    <header className="header">
      <div className="header__group">
        <span className="header__label">Type</span>
        <div className="seg">
          {(['prefab', 'custom'] as HouseType[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`seg__btn ${pendingType === t ? 'seg__btn--on' : ''}`}
              onClick={() => setFilter('pendingType', t)}
            >
              {t === 'prefab' ? 'Prefab' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      <div className="header__group">
        <span className="header__label">Slots</span>
        <div className="seg">
          {([1, 2, 4] as const).map((n) => (
            <button
              key={n}
              type="button"
              className={`seg__btn ${pendingSlots === n ? 'seg__btn--on' : ''}`}
              onClick={() => setFilter('pendingSlots', n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="header__group">
        <span className="header__label">Location</span>
        <select
          value={pendingLocation}
          onChange={(e) => setFilter('pendingLocation', e.target.value as LocationId)}
          className="header__select"
        >
          {LOCATIONS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div className="header__actions">
        <button type="button" className="btn btn--primary" onClick={addHouse}>
          Add House
        </button>
        <button
          type="button"
          className="btn header__theme"
          onClick={() => setFilter('theme', theme === 'dark' ? 'light' : 'dark')}
          aria-pressed={theme === 'light'}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>
    </header>
  );
}
