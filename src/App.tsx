import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useEffect } from 'react';
import { Header } from './components/Header';
import { HouseGrid } from './components/HouseGrid';
import { HouseTable } from './components/HouseTable';
import { LocationTabs } from './components/LocationTabs';
import { PokemonPicker } from './components/PokemonPicker';
import { useStore } from './state/store';

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
      <div className="app">
        <Header />
        <LocationTabs />
        <div className="app__body">
          <main className="app__main">{view === 'grid' ? <HouseGrid /> : <HouseTable />}</main>
          <aside className="app__sidebar">
            <PokemonPicker />
          </aside>
        </div>
      </div>
    </DndContext>
  );
}
