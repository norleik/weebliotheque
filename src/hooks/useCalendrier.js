import { useEffect, useState } from 'react';
import { planningAvecCache, occurrences } from '../lib/calendrier';

// Récupère (en un lot) les prochaines diffusions des animés suivis.
export function useCalendrier(library) {
  const [evenements, setEvenements] = useState([]);
  const [chargement, setChargement] = useState(true);

  // On ne suit pas les animés arrêtés.
  const suivis = library.filter((o) => o.type === 'ANIMÉ' && o.statut !== 'arrete');
  const clesSuivies = suivis.map((o) => o.malId).join(',');

  useEffect(() => {
    if (!suivis.length) {
      setEvenements([]);
      setChargement(false);
      return;
    }

    let annule = false;
    setChargement(true);

    planningAvecCache(suivis.map((o) => o.malId))
      .then((planning) => {
        if (annule) return;
        const tous = [];
        for (const oeuvre of suivis) {
          const info = planning.get(oeuvre.malId);
          if (info) tous.push(...occurrences(oeuvre, info));
        }
        setEvenements(tous);
        setChargement(false);
      })
      .catch((err) => {
        console.error(err);
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [clesSuivies]); // eslint-disable-line react-hooks/exhaustive-deps

  return { evenements, chargement };
}
