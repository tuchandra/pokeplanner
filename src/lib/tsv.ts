/**
 * Minimal TSV parser. Treats the first non-empty row as the header. Trims
 * trailing tabs/whitespace per cell. Returns one record per data row, keyed
 * by header.
 *
 * Caveat: when the header has multiple blank-string columns (as in the
 * Pokopia tracker, which has 5 unnamed favorite columns), those keys collide
 * and only the last value survives. Use {@link parseTSVRows} for positional
 * access in that case.
 */
export function parseTSV(input: string): ReadonlyArray<Record<string, string>> {
  const lines = splitLines(input);
  if (lines.length === 0) return [];
  const headerLine = lines[0] ?? '';
  const header = headerLine.split('\t').map((h) => h.trim());
  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const cells = line.split('\t');
    const rec: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      const key = header[j] ?? '';
      rec[key] = (cells[j] ?? '').trim();
    }
    records.push(rec);
  }
  return records;
}

/**
 * Returns raw cell arrays (header skipped, blank lines dropped). Cells are
 * trimmed. Use this when the header has duplicate or blank column names and
 * you need positional access.
 */
export function parseTSVRows(input: string): ReadonlyArray<readonly string[]> {
  const lines = splitLines(input);
  if (lines.length <= 1) return [];
  const out: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ?? '';
    out.push(line.split('\t').map((c) => c.trim()));
  }
  return out;
}

function splitLines(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.replace(/\r$/, ''))
    .filter((line) => line.length > 0);
}
