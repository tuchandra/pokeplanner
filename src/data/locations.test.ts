import { describe, expect, test } from 'bun:test';
import { LOCATIONS, LOCATION_BY_ID } from './locations';

describe('locations', () => {
  test('has exactly 5 locations', () => {
    expect(LOCATIONS).toHaveLength(5);
  });

  test('each location has capacity 40', () => {
    for (const loc of LOCATIONS) {
      expect(loc.capacity).toBe(40);
    }
  });

  test('LOCATION_BY_ID looks up by id', () => {
    expect(LOCATION_BY_ID.WW.name).toBe('Withered Wastelands');
    expect(LOCATION_BY_ID.PT.name).toBe('Palette Town');
  });
});
