#!/usr/bin/env bun
/**
 * Downloads sprites for every Pokémon in the generated roster into
 * public/sprites/<id>.png, where <id> is the Pokémon's slug (the same
 * identifier referenced from src/data/pokemon.generated.ts).
 *
 * Why slug-based, not number-based: the user's tracker `Number` column is a
 * sequential per-tracker index that reuses some slots across distinct
 * species (e.g. #079 covers both Pikachu and Peakychu, #108 covers Snorlax
 * and Mosslax). Naming sprites by tracker number would collide; naming by
 * the unique slug does not.
 *
 * Why we look up by name: the tracker's `Number` is also NOT the National
 * Dex number Serebii hosts under (Pikachu = #079 in the tracker but
 * 025.png on Serebii). We therefore reuse the user's existing reference
 * implementation in docs/reference/pokehouseplan.js, which embeds the
 * (name → image-URL) table for all 312 records.
 *
 * Idempotent: skips files that already exist.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { POKEMON_RAW } from '../src/data/pokemon.generated';

const ROOT = resolve(import.meta.dir, '..');
const OUT_DIR = resolve(ROOT, 'public/sprites');
const REF_JS = resolve(ROOT, 'docs/reference/pokehouseplan.js');
mkdirSync(OUT_DIR, { recursive: true });

// Build a name -> image-URL map from the reference bundle. The bundle embeds
// records of shape {"number":"...","name":"...",...,"image":"https://www.serebii.net/.../NNN[-suffix].png"}.
function loadNameToUrl(): Map<string, string> {
  const js = readFileSync(REF_JS, 'utf8');
  const re =
    /"number":"(\d+)","name":"([^"]+)",[^}]*"image":"(https:\/\/www\.serebii\.net\/[^"]+\.png)"/g;
  const map = new Map<string, string>();
  for (const m of js.matchAll(re)) {
    const name = m[2];
    const url = m[3];
    if (!name || !url) continue;
    if (!map.has(name)) map.set(name, url);
  }
  return map;
}

const nameToUrl = loadNameToUrl();
console.log(`reference table: ${nameToUrl.size} name->URL entries`);

let downloaded = 0;
let skipped = 0;
let failed = 0;

for (const p of POKEMON_RAW) {
  const dest = resolve(OUT_DIR, `${p.id}.png`);
  if (p.number === '???') {
    // Still attempt download — only the tracker number is unknown, but the
    // name is fine and the reference table can resolve it.
  }
  if (existsSync(dest)) {
    skipped++;
    continue;
  }
  const url = nameToUrl.get(p.name);
  if (!url) {
    console.warn(`! ${p.id} (${p.name}): no reference URL — skipping`);
    failed++;
    continue;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`! ${p.id} (${p.name}): HTTP ${res.status} (${url})`);
      failed++;
      continue;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    writeFileSync(dest, buf);
    downloaded++;
    if (downloaded % 25 === 0) console.log(`  ${downloaded} downloaded…`);
  } catch (err) {
    console.warn(`! ${p.id} (${p.name}): ${(err as Error).message}`);
    failed++;
  }
}

console.log(`done — downloaded=${downloaded} skipped=${skipped} failed=${failed}`);
if (failed > 0) process.exit(1);
