import { useEffect, useRef, useState } from 'react';
import { rechercherAnime } from '../api/mal';
import { useAnimeDuJour } from '../hooks/useAnimeDuJour';
import Avatar from './Avatar';
import './AnimeDuJour.css';

function Puce({ label, indice }) {
  const fleche = indice.direction ? (indice.direction === 'haut' ? ' ↑' : ' ↓') : '';
  const detail =
    indice.communs != null && indice.etat !== 'exact' && indice.etat !== 'inconnu'
      ? ` (${indice.communs}/${indice.total})`
      : '';
  return (
    <div className={`aj-puce aj-${indice.etat}`}>
      <span className="aj-puce-label">{label}</span>
      <span className="aj-puce-valeur">
        {indice.valeur}
        {fleche}
        {detail}
      </span>
    </div>
  );
}

function RechercheAnime({ onChoisir, exclure }) {
  const [requete, setRequete] = useState('');
  const [resultats, setResultats] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const controllerRef = useRef(null);

  useEffect(() => {
    if (requete.trim().length < 3) {
      setResultats([]);
      return;
    }
    const delai = setTimeout(async () => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setChargement(true);
      try {
        const r = await rechercherAnime(requete);
        setResultats(r);
      } catch {
        /* recherche annulée ou échouée : on réessaiera à la frappe suivante */
      } finally {
        setChargement(false);
      }
    }, 400);
    return () => clearTimeout(delai);
  }, [requete]);

  return (
    <div className="recherche-conteneur aj-recherche">
      <div className="recherche">
        <span>🔍</span>
        <input
          type="text"
          placeholder="Nom d'un animé…"
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          onFocus={() => setOuvert(true)}
          onBlur={() => setTimeout(() => setOuvert(false), 150)}
        />
      </div>
      {ouvert && requete.trim().length >= 3 && (
        <div className="recherche-resultats">
          {chargement && <div className="recherche-etat">Recherche…</div>}
          {!chargement && resultats.length === 0 && <div className="recherche-etat">Aucun résultat</div>}
          {resultats.map((o) => {
            const déjàTenté = exclure.includes(o.malId);
            return (
              <div key={o.malId} className="resultat">
                {o.image && <img src={o.image} alt="" />}
                <div className="resultat-info">
                  <span className="resultat-titre">{o.titre}</span>
                </div>
                <button
                  className="resultat-btn"
                  disabled={déjàTenté}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChoisir(o);
                    setRequete('');
                    setResultats([]);
                  }}
                >
                  {déjàTenté ? 'Déjà tenté' : 'Proposer'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AnimeDuJour({ userId }) {
  const {
    chargement,
    cible,
    partie,
    essais,
    terminee,
    essaisMax,
    tenter,
    classementGlobal,
    classementJour,
  } = useAnimeDuJour(userId);

  const niveauBlur = terminee ? 0 : Math.max(0, 16 - essais.length * 3);

  return (
    <section className="carte-sociale anime-du-jour">
      <div className="minijeux-entete">
        <h2>🎯 L'Anime du Jour</h2>
      </div>
      <p className="import-tvtime-aide">
        Un animé caché à deviner chaque jour, identique pour tout le monde — {essaisMax} essais, avec
        studio, année, nombre d'épisodes et genres comme indices.
      </p>

      {chargement && <p className="vide-social">Chargement…</p>}

      {!chargement && cible && (
        <div className="aj-jeu">
          <div className="aj-affiche">
            {cible.image && (
              <img
                src={cible.image}
                alt=""
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                style={{ filter: `blur(${niveauBlur}px)` }}
              />
            )}
          </div>

          <div className="aj-contenu">
            {!terminee && (
              <>
                <p className="aj-compteur">
                  Essai {essais.length + 1} / {essaisMax}
                </p>
                <RechercheAnime exclure={essais.map((e) => e.malId)} onChoisir={tenter} />
              </>
            )}

            {essais.length > 0 && (
              <ul className="aj-tentatives">
                {essais.map((e, i) => (
                  <li key={e.malId} className={`aj-tentative${e.gagne ? ' aj-gagnant' : ''}`}>
                    <span className="aj-tentative-titre">
                      {i + 1}. {e.titre} {e.gagne && '🎉'}
                    </span>
                    <div className="aj-puces">
                      <Puce label="Studio" indice={e.studio} />
                      <Puce label="Année" indice={e.annee} />
                      <Puce label="Épisodes" indice={e.episodes} />
                      <Puce label="Genres" indice={e.genres} />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {terminee && (
              <p className="aj-resultat">
                {partie?.gagne || essais.some((e) => e.gagne) ? (
                  <>
                    Trouvé en {partie?.essais ?? essais.length} essai{(partie?.essais ?? essais.length) > 1 ? 's' : ''}{' '}
                    (+{partie?.points ?? 0} pts) — c'était <b>{cible.titre}</b>. Reviens demain !
                  </>
                ) : (
                  <>
                    Perdu — c'était <b>{cible.titre}</b>. Reviens demain !
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="aj-classements">
        <div className="aj-classement">
          <h3>🏆 Top 5 général</h3>
          {classementGlobal.length === 0 && <p className="vide-social">Personne n'a encore joué.</p>}
          <ol>
            {classementGlobal.map((c) => (
              <li key={c.userId}>
                <Avatar url={c.avatar} pseudo={c.pseudo} className="mini" />
                <span>{c.pseudo}</span>
                <span className="aj-points">{c.points} pts</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="aj-classement">
          <h3>⚡ Top 3 du jour (plus rapides)</h3>
          {classementJour.length === 0 && <p className="vide-social">Personne n'a encore trouvé aujourd'hui.</p>}
          <ol>
            {classementJour.map((c) => (
              <li key={c.user_id}>
                <Avatar url={c.profiles?.avatar} pseudo={c.profiles?.pseudo} className="mini" />
                <span>{c.profiles?.pseudo ?? '?'}</span>
                <span className="aj-points">
                  {c.essais} essai{c.essais > 1 ? 's' : ''}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
