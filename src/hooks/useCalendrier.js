import { useEffect, useState } from 'react';
import { infoDiffusion, occurrences } from '../lib/calendrier';

// Récupère (progressivement) les prochaines diffusions des animés suivis.
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
    setEvenements([]);

    (async () => {
      const tous = [];
      for (const oeuvre of suivis) {
        try {
          const info = await infoDiffusion(oeuvre.malId);
          if (annule) return;
          tous.push(...occurrences(oeuvre, info));
          setEvenements([...tous]);
        } catch (err) {
          console.error(err);
        }
      }
      if (!annule) setChargement(false);
    })();

    return () => {
      annule = true;
    };
  }, [clesSuivies]); // eslint-disable-line react-hooks/exhaustive-deps

  return { evenements, chargement };
}
