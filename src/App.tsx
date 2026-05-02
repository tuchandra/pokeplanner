import { HouseGrid } from '@/components/HouseGrid';
import { HouseTable } from '@/components/HouseTable';
import { PokemonPicker } from '@/components/PokemonPicker';
import { Topbar } from '@/components/Topbar';
import { useStore } from '@/state/store';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useEffect } from 'react';

export function App() {
  const view = useStore((s) => s.filters.view);
  const theme = useStore((s) => s.filters.theme);
  const setSlotPokemon = useStore((s) => s.setSlotPokemon);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function onDragEnd(e: DragEndEvent) {
    const over = e.over;
    if (!over) return;
    const data = e.active.data.current as { kind?: string; pokemonId?: string } | undefined;
    const dropData = over.data.current as
      | { kind?: string; houseId?: string; slot?: number }
      | undefined;
    if (data?.kind !== 'pokemon' || !data.pokemonId) return;
    if (dropData?.kind !== 'slot' || !dropData.houseId || dropData.slot == null) return;
    setSlotPokemon(dropData.houseId, dropData.slot, data.pokemonId);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid grid-rows-[auto_1fr] h-screen">
        <Topbar />
        <div className="grid grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px] min-h-0 overflow-hidden">
          <main className="overflow-y-auto px-6 py-6 pb-12">
            {view === 'grid' ? <HouseGrid /> : <HouseTable />}
          </main>
          <aside className="border-l border-border-soft bg-secondary flex flex-col min-h-0">
            <PokemonPicker />
          </aside>
        </div>
      </div>
    </DndContext>
  );
}
