import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { useStore } from './store';

// Provide a minimal localStorage shim for bun:test (jsdom is not loaded).
class MemStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
  key(i: number) {
    return Array.from(this.map.keys())[i] ?? null;
  }
  get length() {
    return this.map.size;
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: Storage }).localStorage =
    new MemStorage() as unknown as Storage;
  useStore.setState({
    houses: [],
    filters: {
      activeLocation: 'WW',
      pendingType: 'custom',
      pendingSlots: 4,
      pendingLocation: 'WW',
      specialtyFilter: [],
      habitatCompatible: false,
      pickerGrouping: 'none',
      view: 'grid',
    },
    selectedHouseId: null,
  });
});

afterEach(() => {
  useStore.setState({ houses: [], selectedHouseId: null });
});

describe('store', () => {
  test('addHouse appends a house with the configured slot count', () => {
    useStore.getState().setFilter('pendingSlots', 2);
    useStore.getState().addHouse();
    const houses = useStore.getState().houses;
    expect(houses).toHaveLength(1);
    expect(houses[0]?.slots).toEqual([null, null]);
  });

  test('removeHouse removes by id', () => {
    useStore.getState().addHouse();
    const id = useStore.getState().houses[0]!.id;
    useStore.getState().removeHouse(id);
    expect(useStore.getState().houses).toHaveLength(0);
  });

  test('setSlotPokemon assigns a pokemon to a slot', () => {
    useStore.getState().addHouse();
    const id = useStore.getState().houses[0]!.id;
    useStore.getState().setSlotPokemon(id, 0, 'pikachu');
    expect(useStore.getState().houses[0]!.slots[0]).toBe('pikachu');
  });

  test('renameHouse updates the name', () => {
    useStore.getState().addHouse();
    const id = useStore.getState().houses[0]!.id;
    useStore.getState().renameHouse(id, 'Pikachu Palace');
    expect(useStore.getState().houses[0]!.name).toBe('Pikachu Palace');
  });
});
