import { LITTER_ITEM_SPRITES } from '@/data/litter-items';
import { POKEMON, POKEMON_BY_ID } from '@/data/pokemon';
import { UNPLACEABLE_NAMES } from '@/lib/picker-groups';
import { useStore } from '@/state/store';
import type { Pokemon } from '@/types';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from './ui/button';

const SIMILAR_LIMIT = 8;
const FAVORITE_OVERLAP_THRESHOLD = 3;

function findSimilar(p: Pokemon): Pokemon[] {
  const favs = new Set(p.favorites);
  return POKEMON.filter((q) => {
    if (q.id === p.id) return false;
    if (q.specialty1 === p.specialty1) return true;
    let overlap = 0;
    for (const f of q.favorites) {
      if (favs.has(f)) overlap++;
      if (overlap >= FAVORITE_OVERLAP_THRESHOLD) return true;
    }
    return false;
  }).slice(0, SIMILAR_LIMIT);
}

export function PokemonDetail({ id }: { id: string }) {
  const selectPokemon = useStore((s) => s.selectPokemon);
  const addHouseWith = useStore((s) => s.addHouseWith);
  const p = POKEMON_BY_ID.get(id);
  const ref = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on id change
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [id]);

  if (!p) {
    return (
      <div ref={ref} className="flex flex-col gap-3 pb-3 border-b border-dashed border-border-soft">
        <BackButton onClick={() => selectPokemon(null)} />
        <p className="text-muted-foreground">Unknown Pokémon.</p>
      </div>
    );
  }

  const similar = findSimilar(p);

  return (
    <div
      ref={ref}
      className="flex flex-col gap-3 pb-3 border-b border-dashed border-border-soft animate-in fade-in slide-in-from-top-1 duration-200"
    >
      <BackButton onClick={() => selectPokemon(null)} />

      <div className="flex items-center gap-3">
        <div className="relative size-16">
          <img
            src={p.spriteUrl}
            alt={p.name}
            className="size-16 rounded-xl border border-border-soft bg-card p-1.5 [image-rendering:pixelated]"
          />
          {p.litterDrop && LITTER_ITEM_SPRITES[p.litterDrop] && (
            <img
              src={LITTER_ITEM_SPRITES[p.litterDrop]}
              alt={p.litterDrop}
              title={p.litterDrop}
              className="absolute -right-1 -bottom-1 size-7 rounded-md bg-card border border-border-soft p-1 [image-rendering:pixelated]"
            />
          )}
        </div>
        <div>
          <h2 className="m-0 text-[18px] font-bold tracking-[-0.015em]">{p.name}</h2>
          <p className="m-0 mt-0.5 font-mono text-[10px] tracking-[0.08em] text-faint-foreground">
            #{p.number}
          </p>
        </div>
      </div>

      {UNPLACEABLE_NAMES.has(p.name) ? (
        <p className="m-0 rounded-md border border-dashed border-border-soft bg-card-soft px-3 py-2 text-center text-xs text-muted-foreground">
          Story Pokémon — can't be housed
        </p>
      ) : (
        <Button onClick={() => addHouseWith(p.id)}>Move to a new house</Button>
      )}

      <dl className="m-0 flex items-stretch divide-x divide-border-soft rounded-lg border border-border-soft bg-card text-center">
        <Stat label="Habitat" value={p.habitat} />
        <Stat
          label="Specialty"
          value={`${p.specialty1}${p.specialty2 ? ` / ${p.specialty2}` : ''}`}
        />
        <Stat label="Taste" value={tasteLabel(p.taste)} />
        {p.litterDrop && (
          <Stat label="Litter" value={p.litterDrop} icon={LITTER_ITEM_SPRITES[p.litterDrop]} />
        )}
      </dl>

      <Section title="Favorites">
        {p.favorites.length === 0 ? (
          <p className="text-muted-foreground text-sm">No favorites listed.</p>
        ) : (
          <ul className="flex flex-wrap gap-1 list-none m-0 p-0">
            {p.favorites.map((f) => (
              <li
                key={f}
                className="rounded-full border border-border-soft bg-[color-mix(in_oklch,var(--color-foreground)_4%,transparent)] px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {f}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Similar Pokémon">
        {similar.length === 0 ? (
          <p className="text-muted-foreground text-sm">No close matches.</p>
        ) : (
          <ul className="grid grid-cols-4 gap-1.5 list-none m-0 p-0">
            {similar.map((q) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => selectPokemon(q.id)}
                  title={`${q.name} — ${q.specialty1}`}
                  className="w-full bg-card border border-border-soft rounded-md p-1 cursor-pointer flex flex-col items-center gap-1 text-foreground transition-all hover:border-primary hover:-translate-y-px"
                >
                  <img
                    src={q.spriteUrl}
                    alt={q.name}
                    className="size-10 [image-rendering:pixelated]"
                  />
                  <span className="text-[10px] text-muted-foreground text-center w-full overflow-hidden text-ellipsis whitespace-nowrap">
                    {q.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-start inline-flex items-center gap-1 bg-transparent border-0 text-faint-foreground text-xs font-mono tracking-[0.05em] uppercase cursor-pointer p-0 hover:text-foreground transition-colors"
    >
      <ChevronLeft className="size-3.5" />
      Back
    </button>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <div className="flex flex-1 min-w-0 flex-col items-center gap-1 px-2 py-2">
      <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-faint-foreground">
        {label}
      </dt>
      <dd className="m-0 inline-flex items-center gap-1 text-[13px] leading-tight font-medium truncate w-full justify-center">
        {icon && <img src={icon} alt="" className="size-4 [image-rendering:pixelated] shrink-0" />}
        <span className="truncate">{value}</span>
      </dd>
    </div>
  );
}

function tasteLabel(t: string): string {
  // 'Sweet flavors' -> 'Sweet', 'None' stays.
  return t.replace(/\s+flavors$/i, '');
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="m-0 mb-1.5 font-mono text-[10px] uppercase tracking-[0.1em] font-medium text-faint-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}
