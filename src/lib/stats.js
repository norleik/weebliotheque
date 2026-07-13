const DUREE_EPISODE_DEFAUT = 24; // minutes, quand Jikan ne fournit pas la durée

function formatNombre(n) {
  return n.toLocaleString('fr-FR');
}

function formatTemps(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const jours = Math.floor(minutes / 1440);
  const heures = Math.floor((minutes % 1440) / 60);
  if (jours === 0) return `${heures} h ${minutes % 60} min`;
  return `${jours} j ${heures} h`;
}

export function calculerStats(library, episodesCeMois = null) {
  const animes = library.filter((o) => o.type === 'ANIMÉ');
  const lectures = library.filter((o) => o.type !== 'ANIMÉ');

  // Un revisionnage compte pour un visionnage complet de plus (tous ses
  // épisodes) — ex : SNK revu 4 fois ajoute 4 × 25 épisodes aux stats.
  const episodesEffectifs = (o) =>
    (o.progression || 0) + (o.revisionnages || 0) * (o.total || o.progression || 0);

  const episodesVus = animes.reduce((somme, o) => somme + episodesEffectifs(o), 0);
  const minutes = animes.reduce(
    (somme, o) => somme + episodesEffectifs(o) * (o.dureeEpisode ?? DUREE_EPISODE_DEFAUT),
    0,
  );
  const chapitresLus = lectures.reduce((somme, o) => somme + (o.progression || 0), 0);
  const terminees = library.filter((o) => o.statut === 'termine').length;

  const notees = library.filter((o) => o.note != null);
  const noteMoyenne = notees.length
    ? (notees.reduce((somme, o) => somme + o.note, 0) / notees.length).toFixed(1).replace('.', ',')
    : '—';

  return [
    {
      valeur: formatNombre(episodesVus),
      label: 'Épisodes vus',
      detail: episodesCeMois != null ? `+${formatNombre(episodesCeMois)} CE MOIS-CI` : '…',
    },
    {
      valeur: formatTemps(minutes),
      label: 'Temps devant les animés',
      detail: `≈ ${formatNombre(minutes)} MINUTES`,
    },
    {
      valeur: formatNombre(chapitresLus),
      label: 'Chapitres lus',
      detail: 'MANGA · LN · MANHWA',
      rose: true,
    },
    {
      valeur: formatNombre(terminees),
      label: 'Œuvres terminées',
      detail: library.length ? `${Math.round((terminees / library.length) * 100)}% DE TA BIBLIOTHÈQUE` : '—',
    },
    {
      valeur: noteMoyenne,
      label: 'Note moyenne',
      detail: notees.length
        ? `SUR ${formatNombre(notees.length)} ŒUVRE${notees.length > 1 ? 'S' : ''} NOTÉE${notees.length > 1 ? 'S' : ''}`
        : 'AUCUNE ŒUVRE NOTÉE',
      rose: true,
    },
  ];
}
