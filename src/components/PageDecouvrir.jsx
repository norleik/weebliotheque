import { useEffect, useState } from 'react';
import { sortiesSaison } from '../api/jikan';
import './PageDecouvrir.css';

export default function PageDecouvrir({ estDansBiblio, onAjouter }) {
  const [sorties, setSorties] = useState([]);
  const [saison, setSaison] = useState('');
  const [page, setPage] = useState(1);
  const [aSuite, setASuite] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    let annule = false;
    setChargement(true);
    setErreur(null);

    sortiesSaison(page)
      .then(({ sorties: nouvelles, aSuite, saison }) => {
        if (annule) return;
        setSorties((existantes) => {
          const base = page === 1 ? [] : existantes;
          // Jikan peut renvoyer le même anime deux fois (y compris au sein d'une même page).
          const dejaVus = new Set(base.map((o) => o.malId));
          const ajouts = [];
          for (const oeuvre of nouvelles) {
            if (dejaVus.has(oeuvre.malId)) continue;
            dejaVus.add(oeuvre.malId);
            ajouts.push(oeuvre);
          }
          return [...base, ...ajouts];
        });
        setASuite(aSuite);
        if (saison) setSaison(saison);
        setChargement(false);
      })
      .catch(() => {
        if (annule) return;
        setErreur('Impossible de charger les sorties — réessaie dans un instant.');
        setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [page]);

  return (
    <div className="page-decouvrir">
      <div className="decouvrir-tete">
        <h2>Sorties de la saison</h2>
        {saison && <span className="saison-badge">{saison}</span>}
      </div>

      {erreur && <p className="vide-social">{erreur}</p>}

      <div className="grille">
        {sorties.map((oeuvre) => {
          const dejaAjoutee = estDansBiblio(oeuvre.malId);
          return (
            <article key={oeuvre.malId} className="oeuvre">
              <div className="cover" style={oeuvre.image ? { backgroundImage: `url(${oeuvre.image})` } : undefined}>
                <span className="type">ANIMÉ</span>
                {oeuvre.score != null && <span className="note-c statique">★ {oeuvre.score.toFixed(1)}</span>}
                <h3>{oeuvre.titre}</h3>
              </div>
              <div className="oeuvre-corps">
                <div className="prog-lab">
                  <span>Épisodes</span>
                  <b>{oeuvre.total ?? '?'}</b>
                </div>
                <button className="btn-suivi" disabled={dejaAjoutee} onClick={() => onAjouter(oeuvre)}>
                  {dejaAjoutee ? 'Dans ta bibliothèque ✓' : 'Ajouter à ma bibliothèque'}
                </button>
                <div className="liens-secondaires">
                  <a className="lien-fiche" href={oeuvre.url} target="_blank" rel="noreferrer">
                    Voir la fiche ↗
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {chargement && <p className="decouvrir-etat">Chargement…</p>}

      {!chargement && aSuite && (
        <div className="decouvrir-suite">
          <button className="btn-charger-plus" onClick={() => setPage((p) => p + 1)}>
            Charger plus
          </button>
        </div>
      )}
    </div>
  );
}
