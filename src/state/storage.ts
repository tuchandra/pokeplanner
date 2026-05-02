import type { House } from '../types';

export type PersistedState = {
  schemaVersion: 1;
  houses: House[];
};

const KEY = 'pokeplanner.v1';

export function readPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed?.schemaVersion !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writePersisted(state: PersistedState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export const STORAGE_KEY = KEY;
