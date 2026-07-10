import { useEffect, useRef, useState } from 'react';
import {
  compteLie,
  delierCompte,
  demarrerLiaison,
  terminerLiaison,
  importerListeMAL,
} from '../api/mal';
import './ImportMAL.css';

export default function ImportMAL({ onImporter }) {
  const [lie, setLie] = useState(compteLie());
  const [etat, setEtat] = useState(null); // null | 'liaison' | 'import' | 'fait' | 'erreur'
  const [progres, setProgres] = useState(0);
  const [resultat, setResultat] = useState(0);
  const echangeFait = useRef(false);

  // Retour de la redirection OAuth MAL (?code=…&state=liaison-mal).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code || params.get('state') !== 'liaison-mal' || echangeFait.current) return;
    echangeFait.current = true;

    setEtat('liaison');
    terminerLiaison(code)
      .then(() => {
        setLie(true);
        setEtat(null);
      })
      .catch((err) => {
        console.error(err);
        setEtat('erreur');
      })
      .finally(() => {
        window.history.replaceState({}, '', window.location.pathname);
      });
  }, []);

  async function onImport() {
    setEtat('import');
    setProgres(0);
    try {
      const entrees = await importerListeMAL(setProgres);
      const total = await onImporter(entrees);
      setResultat(total);
      setEtat('fait');
    } catch (err) {
      console.error(err);
      setEtat('erreur');
    }
  }

  function onDelier() {
    delierCompte();
    setLie(false);
    setEtat(null);
  }

  return (
    <section className="import-mal">
      <span className="import-mal-titre">🔗 Compte MyAnimeList</span>

      {!lie && etat !== 'liaison' && (
        <>
          <span className="import-mal-texte">
            Lie ton compte MAL pour importer ta liste d'animés et de mangas.
          </span>
          <button className="btn-social" onClick={demarrerLiaison}>
            Lier mon compte
          </button>
        </>
      )}

      {etat === 'liaison' && <span className="import-mal-texte">Liaison en cours…</span>}

      {lie && etat === null && (
        <>
          <span className="import-mal-texte">Compte lié ✓</span>
          <button className="btn-social" onClick={onImport}>
            Importer ma liste MAL
          </button>
          <button className="btn-social secondaire" onClick={onDelier}>
            Délier
          </button>
        </>
      )}

      {etat === 'import' && (
        <span className="import-mal-texte">Import en cours… {progres} œuvres récupérées</span>
      )}

      {etat === 'fait' && (
        <>
          <span className="import-mal-texte">
            ✓ {resultat} œuvres importées — celles déjà dans ta bibliothèque n'ont pas été modifiées.
          </span>
          <button className="btn-social secondaire" onClick={() => setEtat(null)}>
            OK
          </button>
        </>
      )}

      {etat === 'erreur' && (
        <>
          <span className="import-mal-texte erreur">
            Un problème est survenu — réessaie, ou délie puis relie ton compte.
          </span>
          <button className="btn-social secondaire" onClick={() => setEtat(null)}>
            OK
          </button>
        </>
      )}
    </section>
  );
}
