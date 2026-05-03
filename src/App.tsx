import { HouseGrid } from '@/components/HouseGrid';
import { HouseTable } from '@/components/HouseTable';
import { PokemonPicker } from '@/components/PokemonPicker';
import { Topbar } from '@/components/Topbar';
import { cn } from '@/lib/cn';
import { clearShareHash, readShareHash } from '@/lib/share';
import { useStore } from '@/state/store';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function App() {
  const view = useStore((s) => s.filters.view);
  const theme = useStore((s) => s.filters.theme);
  const setSlotPokemon = useStore((s) => s.setSlotPokemon);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Mobile-only: the picker slides in as a drawer when open. md+ ignores this.
  const [pickerOpen, setPickerOpen] = useState(false);

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
        <Topbar onTogglePicker={() => setPickerOpen((v) => !v)} pickerOpen={pickerOpen} />
        <div className="relative md:grid md:grid-cols-[minmax(0,1fr)_360px] xl:md:grid-cols-[minmax(0,1fr)_380px] min-h-0 overflow-hidden">
          <main className="h-full overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 pb-12">
            {view === 'grid' ? <HouseGrid /> : <HouseTable />}
          </main>

          {/* Backdrop — mobile only, while the picker is open */}
          <button
            type="button"
            aria-label="Close Pokémon list"
            tabIndex={pickerOpen ? 0 : -1}
            onClick={() => setPickerOpen(false)}
            className={cn(
              'md:hidden fixed inset-0 z-20 bg-black/45 transition-opacity',
              pickerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
          />

          <aside
            className={cn(
              // Desktop: in-flow column, always visible.
              'md:relative md:flex md:flex-col md:translate-x-0 md:bg-secondary md:border-l md:border-border-soft md:min-h-0',
              // Mobile: fixed drawer sliding in from the right.
              'fixed inset-y-0 right-0 z-30 w-full max-w-sm bg-secondary border-l border-border-soft flex flex-col transition-transform duration-200',
              pickerOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0',
            )}
          >
            <button
              type="button"
              aria-label="Close Pokémon list"
              onClick={() => setPickerOpen(false)}
              className="md:hidden absolute top-1.5 right-1.5 z-20 size-8 rounded-md bg-card border border-border-soft grid place-items-center text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
            <PokemonPicker />
          </aside>
        </div>
      </div>
    </DndContext>
  );
}
