import { useStore } from '../state/store';
import { HouseCard } from './HouseCard';

export function HouseGrid() {
  const houses = useStore((s) => s.houses);
  const activeLocation = useStore((s) => s.filters.activeLocation);
  const visible =
    activeLocation === null ? houses : houses.filter((h) => h.location === activeLocation);

  if (visible.length === 0) {
    return (
      <p className="empty">
        {activeLocation === null
          ? 'No houses yet. Use the controls above to add one.'
          : 'No houses in this location. Use the controls above to add one.'}
      </p>
    );
  }

  return (
    <div className="grid">
      {visible.map((h) => (
        <HouseCard key={h.id} house={h} />
      ))}
    </div>
  );
}
