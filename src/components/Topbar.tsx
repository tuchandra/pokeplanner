import { useEffect, useRef, useState } from 'react';
import { LOCATIONS } from '../data/locations';
import { useStore } from '../state/store';
import { type House, type HouseType, type LocationId, capacityPoints } from '../types';

function pointsAtLocation(houses: House[], id: LocationId): number {
  return houses.filter((h) => h.location === id).reduce((sum, h) => sum + capacityPoints(h), 0);
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Sun</title>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Moon</title>
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <title>Add</title>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Grid</title>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <title>List</title>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function ComposePopover({ onClose }: { onClose: () => void }) {
  const { pendingType, pendingSlots, pendingLocation } = useStore((s) => s.filters);
  const setFilter = useStore((s) => s.setFilter);
  const addHouse = useStore((s) => s.addHouse);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    // defer attach so the click that opened the popover doesn't immediately close it
    const t = setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    document.addEventListener('keydown', onEsc);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [onClose]);

  const slotOptions: readonly (1 | 2 | 4)[] = pendingType === 'custom' ? [1, 4] : [1, 2, 4];

  return (
    <div ref={ref} className="popover" aria-label="Add house">
      <div className="popover__row">
        <span className="popover__label">Type</span>
        <div className="seg">
          {(['prefab', 'custom'] as HouseType[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`seg__btn ${pendingType === t ? 'seg__btn--on' : ''}`}
              onClick={() => {
                setFilter('pendingType', t);
                if (t === 'custom' && pendingSlots === 2) setFilter('pendingSlots', 4);
              }}
            >
              {t === 'prefab' ? 'Prefab' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      <div className="popover__row">
        <span className="popover__label">Slots</span>
        <div className="seg">
          {slotOptions.map((n) => (
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

      <div className="popover__row">
        <span className="popover__label">Location</span>
        <select
          value={pendingLocation}
          onChange={(e) => setFilter('pendingLocation', e.target.value as LocationId)}
          className="popover__select"
        >
          {LOCATIONS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="btn btn--primary popover__submit"
        onClick={() => {
          addHouse();
          onClose();
        }}
      >
        Add house
      </button>
    </div>
  );
}

export function Topbar() {
  const houses = useStore((s) => s.houses);
  const activeLocation = useStore((s) => s.filters.activeLocation);
  const view = useStore((s) => s.filters.view);
  const theme = useStore((s) => s.filters.theme);
  const setFilter = useStore((s) => s.setFilter);
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="brand">Pokopia</span>
        <span className="brand__sub">habitat planner</span>
      </div>

      <nav className="topbar__locations" aria-label="Locations">
        {LOCATIONS.map((loc) => {
          const used = pointsAtLocation(houses, loc.id);
          const active = activeLocation === loc.id;
          const ratio = Math.min(1, used / loc.capacity);
          return (
            <button
              key={loc.id}
              type="button"
              className={`loc ${active ? 'loc--active' : ''} loc--${loc.id.toLowerCase()}`}
              onClick={() => setFilter('activeLocation', loc.id)}
            >
              <span className="loc__id">{loc.id}</span>
              <span className="loc__name">{loc.name}</span>
              <span className="loc__count">
                <span className="loc__used">{used}</span>
                <span className="loc__sep">/</span>
                <span>{loc.capacity}</span>
              </span>
              <span className="loc__bar" aria-hidden>
                <span className="loc__bar-fill" style={{ width: `${ratio * 100}%` }} />
              </span>
            </button>
          );
        })}
      </nav>

      <div className="topbar__actions">
        <div className="seg seg--icon" aria-label="View">
          <button
            type="button"
            className={`seg__btn ${view === 'grid' ? 'seg__btn--on' : ''}`}
            onClick={() => setFilter('view', 'grid')}
            title="Grid view"
            aria-label="Grid view"
          >
            <GridIcon />
          </button>
          <button
            type="button"
            className={`seg__btn ${view === 'table' ? 'seg__btn--on' : ''}`}
            onClick={() => setFilter('view', 'table')}
            title="Table view"
            aria-label="Table view"
          >
            <ListIcon />
          </button>
        </div>

        <div className="compose">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setComposeOpen((v) => !v)}
            aria-expanded={composeOpen}
          >
            <PlusIcon />
            <span>House</span>
          </button>
          {composeOpen && <ComposePopover onClose={() => setComposeOpen(false)} />}
        </div>

        <button
          type="button"
          className="icon-btn"
          onClick={() => setFilter('theme', theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}
