import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { House, HouseType, LocationId, SlotCount } from '../types';
import { STORAGE_KEY } from './storage';

type Filters = {
  /** Active location tab. Null = "All locations" view. */
  activeLocation: LocationId | null;
  pendingType: HouseType;
  pendingSlots: SlotCount;
  /**
   * Group filter for the Pokémon picker. Multi-select. Each entry is either a
   * canonical Specialty name, or one of the picker's virtual groups: 'Story'
   * (story characters) or 'Misc.' (??? specialty + small one/two-mon
   * specialties). Empty array = no filter.
   */
  specialtyFilter: readonly string[];
  /**
   * How to render the picker grid. 'none' is the default flat tracker order
   * (preserves evolutionary adjacency). 'specialty' groups by specialty1/2.
   */
  pickerGrouping: 'none' | 'specialty';
  view: 'grid' | 'table';
  theme: 'dark' | 'light';
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
  /** Adds a house to the active location (or 'WW' when "All" is active). */
  addHouse: () => string;
  /** Adds a house and assigns the given Pokémon to its first slot. */
  addHouseWith: (pokemonId: string) => string;
  removeHouse: (id: string) => void;
  renameHouse: (id: string, name: string) => void;
  /** Moves a house to a different location. No-op when the house is locked. */
  relocateHouse: (id: string, location: LocationId) => void;
  /** Reshapes a house — change type (prefab/custom) and/or slotCount. Custom is forced to 4 slots. */
  reshapeHouse: (id: string, type: HouseType, slotCount: SlotCount) => void;
  /** Toggle the locked flag on a house. Locked houses block other state-changing actions. */
  setHouseLocked: (id: string, locked: boolean) => void;
  setSlotPokemon: (houseId: string, slot: number, pokemonId: string | null) => void;
  selectHouse: (id: string | null) => void;
  selectPokemon: (id: string | null) => void;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  /** Replaces all houses with a curated demo set spanning all five locations. */
  loadExample: () => void;
};

const initialFilters: Filters = {
  activeLocation: 'WW',
  pendingType: 'prefab',
  pendingSlots: 4,
  specialtyFilter: [],
  pickerGrouping: 'none',
  view: 'grid',
  theme: 'dark',
};

function newId(): string {
  return `h_${Math.random().toString(36).slice(2, 10)}`;
}

function buildHouse(s: AppState, name: string): House {
  const slotCount = s.filters.pendingSlots;
  return {
    id: newId(),
    name,
    type: s.filters.pendingType,
    location: s.filters.activeLocation ?? 'WW',
    slotCount,
    slots: Array<string | null>(slotCount).fill(null),
  };
}

/**
 * Demo data — curated houses across all five locations using Pokémon from the
 * tracker. Each house has an `id`, `name`, `type`, `location`, `slotCount`,
 * and pre-populated `slots`. Used by the "Load example" button.
 */
function buildExampleHouses(): House[] {
  type Demo = {
    name: string;
    type: 'prefab' | 'custom';
    location: LocationId;
    slots: (string | null)[];
  };
  const demos: Demo[] = [
    {
      name: 'Greenhouse',
      type: 'prefab',
      location: 'WW',
      slots: ['bulbasaur', 'ivysaur', 'venusaur', 'oddish'],
    },
    {
      name: 'Charcoal Pit',
      type: 'prefab',
      location: 'WW',
      slots: ['charmander', 'charmeleon'],
    },
    {
      name: 'Tide Pool',
      type: 'prefab',
      location: 'BB',
      slots: ['squirtle', 'wartortle', 'blastoise', 'magikarp'],
    },
    {
      name: 'Stone Hut',
      type: 'prefab',
      location: 'RR',
      slots: ['geodude', 'graveler', 'onix', 'rampardos'],
    },
    {
      name: 'Roost',
      type: 'prefab',
      location: 'SS',
      slots: ['pidgey', 'pidgeotto', 'pidgeot', 'swablu'],
    },
    {
      name: "Painter's Loft",
      type: 'custom',
      location: 'PT',
      slots: ['rotom', 'pikachu', 'mareep', 'flaaffy'],
    },
  ];
  return demos.map((d) => ({
    id: newId(),
    name: d.name,
    type: d.type,
    location: d.location,
    slotCount: d.slots.length as 1 | 2 | 4,
    slots: d.slots,
  }));
}

export const useStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      houses: [],
      filters: initialFilters,
      selectedHouseId: null,
      selectedPokemonId: null,

      addHouse: () => {
        const s = get();
        const house = buildHouse(s, `House ${s.houses.length + 1}`);
        set({ houses: [...s.houses, house], selectedHouseId: house.id });
        return house.id;
      },

      addHouseWith: (pokemonId) => {
        const s = get();
        // Strip the Pokemon from any UNLOCKED existing slot first so this acts
        // like a move rather than producing a duplicate placement. Locked
        // houses keep their member.
        const stripped = s.houses.map((h) =>
          h.locked ? h : { ...h, slots: h.slots.map((id) => (id === pokemonId ? null : id)) },
        );
        const house = buildHouse(s, `House ${s.houses.length + 1}`);
        house.slots = [pokemonId, ...house.slots.slice(1)];
        set({
          houses: [...stripped, house],
          selectedHouseId: house.id,
          selectedPokemonId: null,
        });
        return house.id;
      },

      removeHouse: (id) =>
        set((s) => {
          const h = s.houses.find((x) => x.id === id);
          if (h?.locked) return {};
          return { houses: s.houses.filter((x) => x.id !== id) };
        }),

      relocateHouse: (id, location) =>
        set((s) => ({
          houses: s.houses.map((h) => (h.id === id && !h.locked ? { ...h, location } : h)),
        })),

      reshapeHouse: (id, type, slotCount) =>
        set((s) => ({
          houses: s.houses.map((h) => {
            if (h.id !== id || h.locked) return h;
            // Custom houses always have 4 slots; ignore the requested size
            // when switching to custom.
            const targetSlots: SlotCount = type === 'custom' ? 4 : slotCount;
            const next: (string | null)[] = h.slots.slice(0, targetSlots);
            while (next.length < targetSlots) next.push(null);
            return { ...h, type, slotCount: targetSlots, slots: next };
          }),
        })),

      setHouseLocked: (id, locked) =>
        set((s) => ({
          houses: s.houses.map((h) => (h.id === id ? { ...h, locked } : h)),
        })),

      renameHouse: (id, name) =>
        set((s) => ({
          houses: s.houses.map((h) => (h.id === id ? { ...h, name } : h)),
        })),

      setSlotPokemon: (houseId, slot, pokemonId) =>
        set((s) => {
          const target = s.houses.find((h) => h.id === houseId);
          if (target?.locked) return {};
          return {
            houses: s.houses.map((h) => {
              if (h.id !== houseId) return h;
              const slots = [...h.slots];
              slots[slot] = pokemonId;
              return { ...h, slots };
            }),
            selectedHouseId: houseId,
          };
        }),

      selectHouse: (id) => set({ selectedHouseId: id }),

      selectPokemon: (id) => set({ selectedPokemonId: id }),

      setFilter: (key, value) =>
        set((s) => {
          const filters = { ...s.filters, [key]: value };
          // Switching to a specific area should deselect any selected house
          // that lives in a different area, otherwise click-to-place silently
          // adds Pokémon to an off-screen house. ('All' / null leaves the
          // selection alone.)
          if (key === 'activeLocation' && value !== null && s.selectedHouseId) {
            const h = s.houses.find((x) => x.id === s.selectedHouseId);
            if (h && h.location !== value) {
              return { filters, selectedHouseId: null };
            }
          }
          return { filters };
        }),

      loadExample: () =>
        set({ houses: buildExampleHouses(), selectedHouseId: null, selectedPokemonId: null }),
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
