import { useEffect, useRef, useState } from 'react';
import {
  compteLie,
  delierCompte,
  demarrerLiaison,
  terminerLiaison,
  importerListeMAL,
  profilMAL,
  derniereSynchro,
} from '../api/mal';
import { tempsRelatif } from '../lib/activite';
import './ImportMAL.css';

export default function ImportMAL({ onImporter, onResynchroniser }) {
  const [lie, setLie] = useState(compteLie());
  const [etat, setEtat] = useState(null); // null | 'liaison' | 'import' | 'resync' | 'fait' | 'erreur'
  const [progres, setProgres] = useState(0);
  const [resultat, setResultat] = useState(0);
  const [erreurDetail, setErreurDetail] = useState('');
  const [malProfil, setMalProfil] = useState(null);
  const [derniereAction, setDerniereAction] = useState('import'); // 'import' | 'resync'
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
        setErreurDetail(err.message);
        setEtat('erreur');
      })
      .finally(() => {
        window.history.replaceState({}, '', window.location.pathname);
      });
  }, []);

  // Pseudo MAL affiché une fois lié (nouvelle liaison ou compte déjà lié au chargement).
  useEffect(() => {
    if (!lie) {
      setMalProfil(null);
      return;
    }
    let annule = false;
    profilMAL().then((p) => {
      if (!annule) setMalProfil(p);
    });
    return () => {
      annule = true;
    };
  }, [lie]);

  async function onImport() {
    setEtat('import');
    setProgres(0);
    try {
      const entrees = await importerListeMAL(setProgres);
      const total = await onImporter(entrees);
      setResultat(total);
      setDerniereAction('import');
      setEtat('fait');
    } catch (err) {
      console.error(err);
      setErreurDetail(err.message);
      setEtat('erreur');
    }
  }

  async function onResync() {
    setEtat('resync');
    setProgres(0);
    try {
      await onResynchroniser((fait, total) => setProgres({ fait, total }));
      setDerniereAction('resync');
      setEtat('fait');
    } catch (err) {
      console.error(err);
      setErreurDetail(err.message);
      setEtat('erreur');
    }
  }

  function onDelier() {
    delierCompte();
    setLie(false);
    setEtat(null);
  }

  const derniere = lie ? derniereSynchro() : null;

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
          {malProfil ? (
            <a className="import-mal-lien" href={malProfil.url} target="_blank" rel="noreferrer">
              {malProfil.pseudo} sur MyAnimeList ↗
            </a>
          ) : (
            <span className="import-mal-texte">Compte lié ✓</span>
          )}
          {derniere && (
            <span className="import-mal-sync">Synchronisé {tempsRelatif(derniere.toISOString())}</span>
          )}
          <button className="btn-social" onClick={onImport}>
            Importer ma liste MAL
          </button>
          <button className="btn-social secondaire" onClick={onResync} title="Repousse le statut, la progression et la note de toute ta bibliothèque vers MAL — utile après un import TV Time, qui ne synchronise pas automatiquement.">
            Actualiser MAL avec ma bibliothèque
          </button>
          <button className="btn-social secondaire" onClick={onDelier}>
            Délier
          </button>
        </>
      )}

      {etat === 'import' && (
        <span className="import-mal-texte">Import en cours… {progres} œuvres récupérées</span>
      )}

      {etat === 'resync' && (
        <span className="import-mal-texte">
          Actualisation en cours… {progres.fait ?? 0} / {progres.total ?? '?'}
        </span>
      )}

      {etat === 'fait' && derniereAction === 'import' && (
        <>
          <span className="import-mal-texte">
            ✓ {resultat} œuvres importées — celles déjà dans ta bibliothèque n'ont pas été modifiées.
          </span>
          <button className="btn-social secondaire" onClick={() => setEtat(null)}>
            OK
          </button>
        </>
      )}

      {etat === 'fait' && derniereAction === 'resync' && (
        <>
          <span className="import-mal-texte">✓ Ta liste MAL a été actualisée avec ta bibliothèque.</span>
          <button className="btn-social secondaire" onClick={() => setEtat(null)}>
            OK
          </button>
        </>
      )}

      {etat === 'erreur' && (
        <>
          <span className="import-mal-texte erreur">
            Un problème est survenu{erreurDetail ? ` (${erreurDetail})` : ''} — réessaie, ou délie
            puis relie ton compte.
          </span>
          <button className="btn-social secondaire" onClick={() => setEtat(null)}>
            OK
          </button>
        </>
      )}
    </section>
  );
}
