/**
 * URL-hash share encoding. The full planner state (houses + filters) is
 * gzipped, base64url-encoded, and dropped into the URL hash as `#s=<blob>`.
 * Send the URL to another device, open it, and the app hydrates from the hash.
 *
 * Uses native CompressionStream/DecompressionStream — supported in all evergreen
 * browsers. State is ~1–2 KB compressed, well under typical URL limits.
 */
import type { House, HouseType, LocationId, SlotCount } from '../types';

type Filters = {
  activeLocation: LocationId | null;
  pendingType: HouseType;
  pendingSlots: SlotCount;
  specialtyFilter: readonly string[];
  pickerGrouping: 'none' | 'specialty';
  view: 'grid' | 'table';
  theme: 'dark' | 'light';
};

export type SharePayload = {
  v: 1;
  houses: readonly House[];
  filters: Filters;
};

const PREFIX = 's=';

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i] ?? 0);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function gzipString(input: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(input);
  const stream = new Blob([new Uint8Array(bytes)])
    .stream()
    .pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzipString(bytes: Uint8Array): Promise<string> {
  const stream = new Blob([new Uint8Array(bytes)])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).text();
}

export async function buildShareUrl(payload: Omit<SharePayload, 'v'>): Promise<string> {
  const full: SharePayload = { v: 1, ...payload };
  const compressed = await gzipString(JSON.stringify(full));
  const encoded = base64UrlEncode(compressed);
  const url = new URL(window.location.href);
  url.hash = `${PREFIX}${encoded}`;
  return url.toString();
}

/** Returns the parsed payload if `hash` is a share hash, else null. Quietly returns null on errors. */
export async function readShareHash(hash: string): Promise<SharePayload | null> {
  const trimmed = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!trimmed.startsWith(PREFIX)) return null;
  try {
    const bytes = base64UrlDecode(trimmed.slice(PREFIX.length));
    const json = await gunzipString(bytes);
    const parsed = JSON.parse(json) as Partial<SharePayload>;
    if (parsed?.v !== 1 || !Array.isArray(parsed.houses) || !parsed.filters) return null;
    return parsed as SharePayload;
  } catch {
    return null;
  }
}

/** Strips the share hash from the URL bar without triggering a navigation. */
export function clearShareHash(): void {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}
