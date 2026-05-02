import { POKEMON, POKEMON_BY_ID } from '../data/pokemon';
import { useStore } from '../state/store';
import type { Pokemon } from '../types';

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
  const p = POKEMON_BY_ID.get(id);

  if (!p) {
    return (
      <div className="detail">
        <button type="button" className="detail__close" onClick={() => selectPokemon(null)}>
          ← Back
        </button>
        <p className="empty">Unknown Pokémon.</p>
      </div>
    );
  }

  const similar = findSimilar(p);

  return (
    <div className="detail">
      <button type="button" className="detail__close" onClick={() => selectPokemon(null)}>
        ← Back
      </button>

      <div className="detail__head">
        <img src={p.spriteUrl} alt={p.name} className="detail__sprite" />
        <div className="detail__title">
          <h2>{p.name}</h2>
          <p className="detail__num">#{p.number}</p>
        </div>
      </div>

      <dl className="detail__stats">
        <div>
          <dt>Habitat</dt>
          <dd>{p.habitat}</dd>
        </div>
        <div>
          <dt>Specialty</dt>
          <dd>
            {p.specialty1}
            {p.specialty2 ? ` / ${p.specialty2}` : ''}
          </dd>
        </div>
        <div>
          <dt>Taste</dt>
          <dd>{p.taste}</dd>
        </div>
      </dl>

      <section className="detail__section">
        <h3>Favorites</h3>
        {p.favorites.length === 0 ? (
          <p className="empty">No favorites listed.</p>
        ) : (
          <ul className="detail__tags">
            {p.favorites.map((f) => (
              <li key={f} className="habitat-chip">
                {f}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail__section">
        <h3>Similar Pokémon</h3>
        {similar.length === 0 ? (
          <p className="empty">No close matches.</p>
        ) : (
          <ul className="detail__similar">
            {similar.map((q) => (
              <li key={q.id}>
                <button
                  type="button"
                  className="detail__similar-btn"
                  onClick={() => selectPokemon(q.id)}
                  title={`${q.name} — ${q.specialty1}`}
                >
                  <img src={q.spriteUrl} alt={q.name} />
                  <span>{q.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
