import { useStore } from '@/state/store';
import { HouseCard } from './HouseCard';
import { Button } from './ui/button';

export function HouseGrid() {
  const houses = useStore((s) => s.houses);
  const activeLocation = useStore((s) => s.filters.activeLocation);
  const loadExample = useStore((s) => s.loadExample);
  const visible =
    activeLocation === null ? houses : houses.filter((h) => h.location === activeLocation);

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-muted-foreground text-[15px]">
          {activeLocation === null ? 'No houses yet. Add one above' : 'No houses in this location.'}
        </p>
        {houses.length === 0 && (
          <Button variant="outline" onClick={loadExample}>
            Load example data
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
      {visible.map((h) => (
        <HouseCard key={h.id} house={h} />
      ))}
    </div>
  );
}
