import { SPECIALTY_ICONS as RAW } from './specialty-icons.generated';

const BASE = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '');

export const SPECIALTY_ICONS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(RAW).map(([name, path]) => [name, `${BASE}${path}`]),
);
