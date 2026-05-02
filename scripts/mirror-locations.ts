#!/usr/bin/env bun
/**
 * Downloads location icons from pokopiadex.com into public/locations/<slug>.png.
 * Run once and commit the PNGs.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const OUT_DIR = resolve(ROOT, 'public/locations');
mkdirSync(OUT_DIR, { recursive: true });

// pokopiadex.com filename → our LocationId
const SOURCES: Array<{ slug: string; loc: string }> = [
  { slug: 'withered-wasteland', loc: 'WW' },
  { slug: 'bleak-beach', loc: 'BB' },
  { slug: 'rocky-ridges', loc: 'RR' },
  { slug: 'sparkling-skylands', loc: 'SS' },
  { slug: 'palette-town', loc: 'PT' },
];

let downloaded = 0;
let skipped = 0;
let failed = 0;
for (const { slug, loc } of SOURCES) {
  const dest = resolve(OUT_DIR, `${loc.toLowerCase()}.png`);
  if (existsSync(dest)) {
    skipped++;
    continue;
  }
  const url = `https://pokopiadex.com/images/icons/${slug}.png`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`! ${loc} (${url}): HTTP ${res.status}`);
      failed++;
      continue;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    writeFileSync(dest, buf);
    downloaded++;
  } catch (err) {
    console.warn(`! ${loc}: ${(err as Error).message}`);
    failed++;
  }
}
console.log(`download: ${downloaded} new, ${skipped} cached, ${failed} failed`);
if (failed > 0) process.exit(1);
