import { useEffect, useState } from 'react';
import { sortiesSaison } from '../api/mal';
import { useSeasonVotes } from '../hooks/useSeasonVotes';
import './VoteSaison.css';

export default function VoteSaison({ userId }) {
  const { classement, monVote, chargement, voter, retirerVote, rafraichir } = useSeasonVotes(userId);
  const [sorties, setSorties] = useState([]);
  const [saisonLabel, setSaisonLabel] = useState('');
  const [page, setPage] = useState(1);
  const [aSuite, setASuite] = useState(false);
  const [chargementListe, setChargementListe] = useState(true);
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    if (!ouvert) return;
    let annule = false;
    setChargementListe(true);
    sortiesSaison(page)
      .then(({ sorties: nouvelles, aSuite, saison }) => {
        if (annule) return;
        setSorties((existantes) => {
          const base = page === 1 ? [] : existantes;
          const vus = new Set(base.map((o) => o.malId));
          return [...base, ...nouvelles.filter((o) => !vus.has(o.malId))];
        });
        setASuite(aSuite);
        setSaisonLabel(saison);
        setChargementListe(false);
      })
      .catch((err) => {
        console.error(err);
        setChargementListe(false);
      });
    return () => {
      annule = true;
    };
  }, [page, ouvert]);

  const totalVotes = classement.reduce((s, o) => s + o.votants.length, 0);

  return (
    <section className="carte-sociale vote-saison">
      <div className="minijeux-entete">
        <h2>🗳️ Vote de la saison{saisonLabel && ` — ${saisonLabel}`}</h2>
        <button className="btn-rafraichir" onClick={rafraichir} title="Rafraîchir le classement">
          ↻
        </button>
      </div>
      <p className="import-tvtime-aide">
        Ouvert à tout le monde, en dehors des groupes — vote pour ton animé préféré de la saison en
        cours. Tu peux changer d'avis à tout moment.
      </p>

      {chargement && <p className="vide-social">Chargement du classement…</p>}

      {!chargement && classement.length === 0 && (
        <p className="vide-social">Aucun vote pour l'instant — sois le premier !</p>
      )}

      {classement.length > 0 && (
        <ul className="vote-classement">
          {classement.map((o, i) => (
            <li key={o.malId} className={monVote?.mal_id === o.malId ? 'mon-vote' : ''}>
              <span className="vote-rang">{i + 1}</span>
              {o.image && <img src={o.image} alt="" />}
              <div className="vote-info">
                <a href={o.url} target="_blank" rel="noreferrer" className="vote-titre">
                  {o.titre}
                </a>
                <div className="vote-barre">
                  <i style={{ width: `${totalVotes ? (o.votants.length / totalVotes) * 100 : 0}%` }} />
                </div>
              </div>
              <span className="vote-nombre">
                {o.votants.length} vote{o.votants.length > 1 ? 's' : ''}
              </span>
            </li>
          ))}
        </ul>
      )}

      {monVote && (
        <p className="vote-mon-choix">
          Ton vote actuel : <b>{monVote.titre}</b> —{' '}
          <button className="vote-lien-retirer" onClick={retirerVote}>
            retirer mon vote
          </button>
        </p>
      )}

      {!ouvert ? (
        <button className="btn-social" onClick={() => setOuvert(true)}>
          {monVote ? 'Changer mon vote' : 'Voter pour mon animé préféré'}
        </button>
      ) : (
        <>
          <div className="vote-grille">
            {sorties.map((o) => {
              const estMonVote = monVote?.mal_id === o.malId;
              return (
                <article key={o.malId} className={`oeuvre vote-carte${estMonVote ? ' vote-actif' : ''}`}>
                  <div className="cover" style={o.image ? { backgroundImage: `url(${o.image})` } : undefined}>
                    <span className="type">ANIMÉ</span>
                    <h3>{o.titre}</h3>
                  </div>
                  <div className="oeuvre-corps">
                    <button
                      className="btn-suivi"
                      onClick={() => {
                        voter(o);
                        setOuvert(false);
                      }}
                      disabled={estMonVote}
                    >
                      {estMonVote ? 'Ton vote ✓' : 'Voter'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          {chargementListe && <p className="vide-social">Chargement…</p>}
          {!chargementListe && aSuite && (
            <div className="decouvrir-suite">
              <button className="btn-charger-plus" onClick={() => setPage((p) => p + 1)}>
                Charger plus
              </button>
            </div>
          )}
          <button className="btn-social secondaire" onClick={() => setOuvert(false)}>
            Fermer
          </button>
        </>
      )}
    </section>
  );
}
