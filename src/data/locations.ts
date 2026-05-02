import type { Location } from '../types';

export const LOCATIONS: readonly Location[] = [
  { id: 'WW', name: 'Withered Wastelands', capacity: 40 },
  { id: 'BB', name: 'Bleak Beach', capacity: 40 },
  { id: 'RR', name: 'Rocky Ridges', capacity: 40 },
  { id: 'SS', name: 'Sparkling Skylands', capacity: 40 },
  { id: 'PT', name: 'Palette Town', capacity: 40 },
];

export const LOCATION_BY_ID = Object.fromEntries(LOCATIONS.map((l) => [l.id, l])) as Record<
  Location['id'],
  Location
>;
