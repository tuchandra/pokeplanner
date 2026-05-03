import { HouseGrid } from '@/components/HouseGrid';
import { HouseTable } from '@/components/HouseTable';
import { PokemonPicker } from '@/components/PokemonPicker';
import { Topbar } from '@/components/Topbar';
import { clearShareHash, readShareHash } from '@/lib/share';
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

  // On mount, hydrate from a share hash if present. Confirm overwrite when the
  // user already has houses locally so a stray link can't wipe their work.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const payload = await readShareHash(window.location.hash);
      if (cancelled || !payload) return;
      const existing = useStore.getState().houses.length;
      if (
        existing > 0 &&
        !window.confirm(
          `This link contains a shared planner with ${payload.houses.length} house${
            payload.houses.length === 1 ? '' : 's'
          }. Replace your current ${existing}-house planner?`,
        )
      ) {
        clearShareHash();
        return;
      }
      useStore.setState({
        houses: [...payload.houses],
        filters: payload.filters,
        selectedHouseId: null,
        selectedPokemonId: null,
      });
      clearShareHash();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
