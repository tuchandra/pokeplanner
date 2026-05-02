import { useState } from 'react';
import { SPECIALTIES } from '../data/specialties';
import { useStore } from '../state/store';
import type { Specialty } from '../types';

export function SpecialtyFilter() {
  const selected = useStore((s) => s.filters.specialtyFilter);
  const habitatCompat = useStore((s) => s.filters.habitatCompatible);
  const setFilter = useStore((s) => s.setFilter);
  const [open, setOpen] = useState(false);

  function toggle(s: Specialty) {
    const set = new Set(selected);
    if (set.has(s)) set.delete(s);
    else set.add(s);
    setFilter('specialtyFilter', Array.from(set));
  }

  const label = selected.length === 0 ? 'All Specialties' : `${selected.length} selected`;

  return (
    <div className="specialty-filter">
      <button
        type="button"
        className={`specialty-filter__trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{label}</span>
        <span aria-hidden>▾</span>
      </button>
      {open && (
        <ul className="specialty-filter__menu" role="listbox" aria-multiselectable>
          {SPECIALTIES.map((s) => (
            <li key={s}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(s)}
                  onChange={() => toggle(s)}
                />
                {s}
              </label>
            </li>
          ))}
        </ul>
      )}
      <button
        id="habitat-filter-toggle"
        type="button"
        className={`habitat-toggle ${habitatCompat ? 'is-on' : ''}`}
        onClick={() => setFilter('habitatCompatible', !habitatCompat)}
        aria-pressed={habitatCompat}
      >
        Habitat: {habitatCompat ? 'compatible' : 'all'}
      </button>
    </div>
  );
}
