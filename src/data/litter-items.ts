import { LITTER_ITEM_SPRITES as RAW } from './litter-items.generated';

const BASE = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '');

// Index by lowercased name so ingest-side casing variations ('Small log' vs
// 'Small Log') resolve to the same sprite.
const BY_LOWER: Record<string, string> = Object.fromEntries(
  Object.entries(RAW).map(([name, path]) => [name.toLowerCase(), `${BASE}${path}`]),
);

export const LITTER_ITEM_SPRITES: Readonly<Record<string, string>> = new Proxy(
  {},
  {
    get(_t, prop) {
      if (typeof prop !== 'string') return undefined;
      return BY_LOWER[prop.toLowerCase()];
    },
    has(_t, prop) {
      return typeof prop === 'string' && prop.toLowerCase() in BY_LOWER;
    },
  },
) as Record<string, string>;
