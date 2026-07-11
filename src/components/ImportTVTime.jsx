import { useState } from 'react';
import { rechercherAnime } from '../api/mal';
import { parserCsvTvTime, nettoyerTitreRecherche, statutParDefaut } from '../lib/tvtime';
import './ImportTVTime.css';

export default function ImportTVTime({ onImporter }) {
  const [etape, setEtape] = useState('choix'); // choix | recherche | revue | import | fait | erreur
  const [progres, setProgres] = useState({ fait: 0, total: 0 });
  const [lignes, setLignes] = useState([]);
  const [format, setFormat] = useState(null);
  const [resultatFinal, setResultatFinal] = useState(0);
  const [erreur, setErreur] = useState('');

  async function onFichier(e) {
    const fichier = e.target.files?.[0];
    e.target.value = '';
    if (!fichier) return;
    setErreur('');

    try {
      const texte = await fichier.text();
      const { format, lignes: brut } = parserCsvTvTime(texte);
      if (brut.length === 0) throw new Error('Aucune ligne exploitable dans ce fichier.');

      setFormat(format);
      setEtape('recherche');
      setProgres({ fait: 0, total: brut.length });

      const enrichies = [];
      for (const ligne of brut) {
        let resultats = [];
        try {
          resultats = await rechercherAnime(nettoyerTitreRecherche(ligne.nom));
        } catch (err) {
          console.error(err);
        }
        enrichies.push({
          ...ligne,
          resultats,
          choisi: resultats[0]?.malId ?? '',
          inclure: resultats.length > 0,
        });
        setProgres((p) => ({ ...p, fait: p.fait + 1 }));
        await new Promise((r) => setTimeout(r, 350)); // ménage l'API MAL
      }
      setLignes(enrichies);
      setEtape('revue');
    } catch (err) {
      console.error(err);
      setErreur(err.message);
      setEtape('erreur');
    }
  }

  function onChangerChoix(index, malId) {
    setLignes((ls) => ls.map((l, i) => (i === index ? { ...l, choisi: malId } : l)));
  }

  function onToggleInclure(index) {
    setLignes((ls) => ls.map((l, i) => (i === index ? { ...l, inclure: !l.inclure } : l)));
  }

  async function onConfirmerImport() {
    setEtape('import');
    const aImporter = lignes
      .filter((l) => l.inclure && l.choisi)
      .map((l) => {
        const oeuvre = l.resultats.find((r) => String(r.malId) === String(l.choisi));
        return { ...oeuvre, progression: 0, note: null, statut: statutParDefaut(l, format) };
      });

    try {
      const total = await onImporter(aImporter);
      setResultatFinal(total);
      setEtape('fait');
    } catch (err) {
      console.error(err);
      setErreur(err.message);
      setEtape('erreur');
    }
  }

  const nbTrouves = lignes.filter((l) => l.resultats.length > 0).length;
  const nbInclus = lignes.filter((l) => l.inclure && l.choisi).length;

  return (
    <section className="import-tvtime carte-sociale">
      <h2>📺 Importer depuis TV Time</h2>

      {etape === 'choix' && (
        <>
          <p className="import-tvtime-aide">
            Exporte tes données depuis TV Time, puis choisis un des fichiers CSV reçus :{' '}
            <code>subscriptions</code> (séries suivies) ou{' '}
            <code>show_seen_episode_latest</code> (séries dont au moins un épisode a été vu — plus
            fiable). Aucun des deux ne donne le nombre exact d'épisodes vus : seuls les titres et
            un statut approximatif seront importés, à toi d'ajuster la progression ensuite.
          </p>
          <label className="btn-social btn-fichier">
            Choisir le fichier CSV
            <input type="file" accept=".csv,text/csv" hidden onChange={onFichier} />
          </label>
        </>
      )}

      {etape === 'recherche' && (
        <p className="import-tvtime-aide">
          Recherche des correspondances sur MyAnimeList… {progres.fait} / {progres.total}
        </p>
      )}

      {etape === 'revue' && (
        <>
          <p className="import-tvtime-aide">
            Fichier « {format === 'episodes_vus' ? 'épisodes vus' : 'abonnements'} » — {nbTrouves} /{' '}
            {lignes.length} titres reconnus sur MyAnimeList. Vérifie les correspondances, décoche
            celles à ignorer, puis confirme.
          </p>
          <ul className="import-tvtime-liste">
            {lignes.map((l, i) => (
              <li key={i} className={l.resultats.length === 0 ? 'non-trouve' : ''}>
                <input
                  type="checkbox"
                  checked={l.inclure}
                  disabled={l.resultats.length === 0}
                  onChange={() => onToggleInclure(i)}
                />
                <span className="import-tvtime-nom">{l.nom}</span>
                {l.resultats.length > 0 ? (
                  <select value={l.choisi} onChange={(e) => onChangerChoix(i, e.target.value)}>
                    {l.resultats.map((r) => (
                      <option key={r.malId} value={r.malId}>
                        {r.titre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="import-tvtime-aucun">Aucune correspondance</span>
                )}
              </li>
            ))}
          </ul>
          <button className="btn-social" onClick={onConfirmerImport} disabled={nbInclus === 0}>
            Importer {nbInclus} œuvre{nbInclus > 1 ? 's' : ''}
          </button>
        </>
      )}

      {etape === 'import' && <p className="import-tvtime-aide">Import en cours…</p>}

      {etape === 'fait' && (
        <>
          <p className="import-tvtime-aide">
            ✓ {resultatFinal} œuvres importées — celles déjà dans ta bibliothèque n'ont pas été
            modifiées.
          </p>
          <button className="btn-social secondaire" onClick={() => setEtape('choix')}>
            OK
          </button>
        </>
      )}

      {etape === 'erreur' && (
        <>
          <p className="import-tvtime-aide erreur">Erreur : {erreur}</p>
          <button className="btn-social secondaire" onClick={() => setEtape('choix')}>
            Réessayer
          </button>
        </>
      )}
    </section>
  );
}
