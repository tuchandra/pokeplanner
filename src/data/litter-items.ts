import { LITTER_ITEM_SPRITES as RAW } from './litter-items.generated';

const BASE = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '');

export const LITTER_ITEM_SPRITES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(RAW).map(([name, path]) => [name, `${BASE}${path}`]),
);
