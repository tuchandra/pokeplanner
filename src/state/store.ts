import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { House, HouseType, LocationId, SlotCount, Specialty } from '../types';
import { STORAGE_KEY } from './storage';

type Filters = {
  activeLocation: LocationId;
  pendingType: HouseType;
  pendingSlots: SlotCount;
  pendingLocation: LocationId;
  /**
   * Work-specialty filter for the Pokémon picker. Multi-select via checkboxes
   * (matches reference). Empty array = no filter; otherwise show only Pokémon
   * whose specialty1 OR specialty2 is in this set.
   */
  specialtyFilter: readonly Specialty[];
  /**
   * Restrict the picker to Pokémon whose `habitat` is one of the selected
   * house's derived lighting chips. False = show all.
   */
  habitatCompatible: boolean;
  view: 'grid' | 'table';
};

type AppState = {
  houses: House[];
  filters: Filters;
  /** Currently focused house — drives the picker's habitat-compat filter. */
  selectedHouseId: string | null;
  /** Pokémon whose detail panel is open in the sidebar. Null = picker grid view. */
  selectedPokemonId: string | null;
};

type AppActions = {
  addHouse: () => void;
  removeHouse: (id: string) => void;
  renameHouse: (id: string, name: string) => void;
  setSlotPokemon: (houseId: string, slot: number, pokemonId: string | null) => void;
  selectHouse: (id: string | null) => void;
  selectPokemon: (id: string | null) => void;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
};

const initialFilters: Filters = {
  activeLocation: 'WW',
  pendingType: 'custom',
  pendingSlots: 4,
  pendingLocation: 'WW',
  specialtyFilter: [],
  habitatCompatible: false,
  view: 'grid',
};

function newId(): string {
  return `h_${Math.random().toString(36).slice(2, 10)}`;
}

export const useStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      houses: [],
      filters: initialFilters,
      selectedHouseId: null,
      selectedPokemonId: null,

      addHouse: () =>
        set((s) => {
          const slotCount = s.filters.pendingSlots;
          const slots = Array<string | null>(slotCount).fill(null);
          const house: House = {
            id: newId(),
            name: `House ${s.houses.length + 1}`,
            type: s.filters.pendingType,
            location: s.filters.pendingLocation,
            slotCount,
            slots,
          };
          return { houses: [...s.houses, house], selectedHouseId: house.id };
        }),

      removeHouse: (id) => set((s) => ({ houses: s.houses.filter((h) => h.id !== id) })),

      renameHouse: (id, name) =>
        set((s) => ({
          houses: s.houses.map((h) => (h.id === id ? { ...h, name } : h)),
        })),

      setSlotPokemon: (houseId, slot, pokemonId) =>
        set((s) => ({
          houses: s.houses.map((h) => {
            if (h.id !== houseId) return h;
            const slots = [...h.slots];
            slots[slot] = pokemonId;
            return { ...h, slots };
          }),
          selectedHouseId: houseId,
        })),

      selectHouse: (id) => set({ selectedHouseId: id }),

      selectPokemon: (id) => set({ selectedPokemonId: id }),

      setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (s) => ({
        houses: s.houses,
        filters: s.filters,
        selectedHouseId: s.selectedHouseId,
      }),
    },
  ),
);
