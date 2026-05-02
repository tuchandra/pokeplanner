#!/usr/bin/env bun
/**
 * Reads docs/reference/poketracker.tsv and writes
 * src/data/pokemon.generated.ts. Run from repo root: `bun run scripts/ingest-tracker.ts`
 *
 * The TSV header has 6 blank-string column names (5 unnamed favorite columns
 * plus the leading "Sprite" column shared with two empty habitat-area cells),
 * so we use positional indexing via parseTSVRows rather than the named
 * record form.
 *
 * Column layout (zero-indexed):
 *   0=Number  1=Sprite  2=Name  3=Ability 1  4=Ability 2  5=Registered
 *   6=Home    7=Litter drop     8=Habitat
 *   9..13=Favorites (5 columns)  14=Taste
 *
 * Conversion rules:
 *  - id = slug(name)  e.g. "Mr. Mime" -> "mr-mime"
 *  - number = leading "#" stripped, zero-padded to 3 chars; "00"/"000" -> "???"
 *  - habitat is title-cased already in the TSV, validated against LIGHTING.
 *  - favorites: tracker uses lowercase ("lots of nature") — looked up
 *    case-insensitively against canonical TAGS to recover correct casing.
 *    A literal "none" cell means "no favorites" (Ditto) and is dropped.
 *  - taste: tracker uses lowercase — title-case the first letter, validated
 *    against TASTES. Empty taste -> "None".
 *  - specialty1/2: tracker uses canonical case already, validated against
 *    SPECIALTIES. Empty specialty2 -> null.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LIGHTING } from '../src/data/lighting';
import { SPECIALTIES } from '../src/data/specialties';
import { TAGS } from '../src/data/tags';
import { TASTES } from '../src/data/tastes';
import { parseTSVRows } from '../src/lib/tsv';

const ROOT = resolve(import.meta.dir, '..');
const SRC = resolve(ROOT, 'docs/reference/poketracker.tsv');
const OUT = resolve(ROOT, 'src/data/pokemon.generated.ts');

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function tagFromLowercase(s: string): string | null {
  if (!s) return null;
  const lower = s.trim().toLowerCase();
  for (const t of TAGS) if (t.toLowerCase() === lower) return t;
  // tolerate the historical variants from the user's TSV
  if (lower === 'slender objects') return 'Slender objects';
  if (lower === 'noise stuff') return 'Noisy stuff';
  return null;
}

function titleCaseFirst(s: string): string {
  if (!s) return s;
  const head = s.charAt(0).toUpperCase();
  return head + s.slice(1);
}

function specialtyCanonical(s: string): string | null {
  if (!s) return null;
  for (const sp of SPECIALTIES) if (sp.toLowerCase() === s.toLowerCase()) return sp;
  return null;
}

const tsv = readFileSync(SRC, 'utf8');
const rows = parseTSVRows(tsv);

type Out = {
  id: string;
  number: string;
  name: string;
  specialty1: string;
  specialty2: string | null;
  habitat: string;
  favorites: string[];
  taste: string;
};

const seen = new Set<string>();
const out: Out[] = [];
const errors: string[] = [];
let hasFatal = false;

for (const cells of rows) {
  const name = (cells[2] ?? '').trim();
  if (!name) continue;

  let number = (cells[0] ?? '').replace(/^#/, '').padStart(3, '0');
  if (number === '00' || number === '000') {
    console.log(`! number not determinable from TSV for ${name} — using "???"`);
    number = '???';
  }

  const id = slug(name);
  if (seen.has(id)) {
    errors.push(`duplicate id: ${id} (${name})`);
    continue;
  }
  seen.add(id);

  const sp1Raw = (cells[3] ?? '').trim();
  const sp2Raw = (cells[4] ?? '').trim();
  const sp1 = specialtyCanonical(sp1Raw) ?? sp1Raw;
  const sp2 = sp2Raw ? (specialtyCanonical(sp2Raw) ?? sp2Raw) : null;

  if (!sp1) {
    errors.push(`missing specialty1 for ${name}`);
    hasFatal = true;
  } else if (!SPECIALTIES.includes(sp1 as never)) {
    errors.push(`unknown specialty1 (fatal): "${sp1Raw}" (${name})`);
    hasFatal = true;
  }
  if (sp2 && !SPECIALTIES.includes(sp2 as never)) {
    errors.push(`unknown specialty2: "${sp2Raw}" (${name})`);
  }

  const habitat = (cells[8] ?? '').trim();
  if (!habitat) {
    errors.push(`missing habitat: ${name}`);
  } else if (!LIGHTING.includes(habitat as never)) {
    errors.push(`unknown habitat: "${habitat}" (${name})`);
  }

  const favs: string[] = [];
  for (let i = 9; i <= 13; i++) {
    const v = (cells[i] ?? '').trim();
    if (!v) continue;
    if (v.toLowerCase() === 'none') continue; // Ditto-style "no favorites" sentinel
    const tag = tagFromLowercase(v);
    if (!tag) errors.push(`unknown favorite: "${v}" (${name})`);
    else favs.push(tag);
  }

  const tasteRaw = (cells[14] ?? '').trim();
  let taste = '';
  if (!tasteRaw) {
    taste = 'None';
  } else if (tasteRaw.toLowerCase() === 'none') {
    taste = 'None';
  } else {
    const tCanon = titleCaseFirst(tasteRaw);
    if (TASTES.includes(tCanon as never)) taste = tCanon;
    else {
      errors.push(`unknown taste: "${tasteRaw}" (${name})`);
      taste = tCanon;
    }
  }

  out.push({
    id,
    number,
    name,
    specialty1: sp1,
    specialty2: sp2,
    habitat,
    favorites: favs,
    taste,
  });
}

if (errors.length) {
  console.error(`ingest produced ${errors.length} warning(s):`);
  for (const e of errors) console.error('  -', e);
}

if (hasFatal) {
  console.error('FATAL: validation errors block correctness — not writing output.');
  process.exit(1);
}

// Sprite filenames are keyed by the Pokémon id (slug), not the tracker
// number, because the user's tracker reuses some numbers across distinct
// species (e.g. #079 covers both Pikachu and Peakychu). Slugs are
// guaranteed unique above.
const banner =
  '// GENERATED by scripts/ingest-tracker.ts. Re-run: bun run ingest\n// DO NOT EDIT BY HAND.\n';
const data = JSON.stringify(
  out.map((p) => ({ ...p, spriteUrl: `/sprites/${p.id}.png` })),
  null,
  2,
);
const body = `${banner}import type { Pokemon } from '../types';\n\nexport const POKEMON_RAW: readonly Pokemon[] = ${data} as const;\n`;

writeFileSync(OUT, body);
console.log(`wrote ${out.length} records to ${OUT}`);
