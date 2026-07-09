import { useEffect, useRef, useState } from 'react';
import { rechercherOeuvres } from '../api/jikan';
import './Recherche.css';

export default function Recherche({ estDansBiblio, onAjouter }) {
  const [requete, setRequete] = useState('');
  const [resultats, setResultats] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    if (!requete.trim()) {
      setResultats([]);
      setErreur(null);
      return;
    }

    const delai = setTimeout(async () => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setChargement(true);
      setErreur(null);
      try {
        const resultats = await rechercherOeuvres(requete, { signal: controller.signal });
        setResultats(resultats);
      } catch (err) {
        if (err.name !== 'AbortError') setErreur('Recherche impossible, réessaie.');
      } finally {
        setChargement(false);
      }
    }, 450);

    return () => clearTimeout(delai);
  }, [requete]);

  return (
    <div className="recherche-conteneur">
      <div className="recherche">
        <span>🔍</span>
        <input
          type="text"
          placeholder="Rechercher un animé, manga, LN…"
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          onFocus={() => setOuvert(true)}
          onBlur={() => setTimeout(() => setOuvert(false), 150)}
        />
      </div>

      {ouvert && requete.trim() && (
        <div className="recherche-resultats">
          {chargement && <div className="recherche-etat">Recherche…</div>}
          {erreur && <div className="recherche-etat">{erreur}</div>}
          {!chargement && !erreur && resultats.length === 0 && (
            <div className="recherche-etat">Aucun résultat</div>
          )}
          {resultats.map((oeuvre) => {
            const dejaAjoutee = estDansBiblio(oeuvre.malId);
            return (
              <div key={`${oeuvre.type}-${oeuvre.malId}`} className="resultat">
                {oeuvre.image && <img src={oeuvre.image} alt="" />}
                <div className="resultat-info">
                  <span className="resultat-type">{oeuvre.type}</span>
                  <span className="resultat-titre">{oeuvre.titre}</span>
                </div>
                <button
                  className="resultat-btn"
                  disabled={dejaAjoutee}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onAjouter(oeuvre)}
                >
                  {dejaAjoutee ? 'Ajoutée ✓' : 'Ajouter'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
