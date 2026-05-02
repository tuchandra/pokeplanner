import { describe, expect, test } from 'bun:test';
import { parseTSV, parseTSVRows } from './tsv';

describe('parseTSV', () => {
  test('parses header + rows', () => {
    const rows = parseTSV('a\tb\tc\n1\t2\t3\n4\t5\t6\n');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ a: '1', b: '2', c: '3' });
  });

  test('handles missing trailing cells as empty strings', () => {
    const rows = parseTSV('a\tb\tc\n1\t2\n');
    expect(rows[0]).toEqual({ a: '1', b: '2', c: '' });
  });

  test('skips blank lines', () => {
    const rows = parseTSV('a\tb\n\n1\t2\n\n');
    expect(rows).toHaveLength(1);
  });
});

describe('parseTSVRows', () => {
  test('returns raw cells with blank-header columns preserved positionally', () => {
    const rows = parseTSVRows('a\t\tc\n1\t2\t3\n');
    expect(rows).toEqual([['1', '2', '3']]);
  });

  test('skips header and blank lines', () => {
    const rows = parseTSVRows('a\tb\n\n1\t2\n\n3\t4\n');
    expect(rows).toEqual([
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  test('returns empty array for header-only input', () => {
    expect(parseTSVRows('a\tb\tc\n')).toEqual([]);
  });
});
