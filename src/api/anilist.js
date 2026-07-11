// Client AniList (GraphQL) — utilisé uniquement pour le calendrier de
// diffusion. Contrairement à MAL (qui ne donne qu'un jour/heure hebdomadaire
// approximatif), AniList expose un vrai planning épisode par épisode avec
// horodatage exact, et son endpoint public autorise les appels directs
// depuis le navigateur (CORS) — pas besoin de proxy ici.

const URL_ANILIST = 'https://graphql.anilist.co';
const TAILLE_LOT = 50; // perPage max accepté par AniList

const REQUETE = `
  query($ids: [Int]) {
    Page(page: 1, perPage: ${TAILLE_LOT}) {
      media(idMal_in: $ids, type: ANIME) {
        idMal
        status
        startDate { year month day }
        airingSchedule(notYetAired: true, perPage: 5) {
          nodes { airingAt episode }
        }
      }
    }
  }
`;

function decouper(liste, taille) {
  const lots = [];
  for (let i = 0; i < liste.length; i += taille) lots.push(liste.slice(i, i + taille));
  return lots;
}

async function requeterLot(ids) {
  const res = await fetch(URL_ANILIST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: REQUETE, variables: { ids } }),
  });
  if (!res.ok) throw new Error(`Erreur AniList (${res.status})`);
  const json = await res.json();
  return json.data?.Page?.media ?? [];
}

// Planning de diffusion pour un ensemble d'animés (identifiés par leur MAL
// id), en un minimum de requêtes (par lots de 50, la limite d'AniList).
// Renvoie une Map malId → { statut, debutMs, episodes: [{ atMs, episode }] }.
export async function planningDiffusion(malIds) {
  const lots = decouper(malIds, TAILLE_LOT);
  const resultats = await Promise.all(lots.map(requeterLot));

  const parId = new Map();
  for (const media of resultats.flat()) {
    parId.set(media.idMal, {
      statut: media.status,
      debutMs: media.startDate?.year
        ? Date.UTC(media.startDate.year, (media.startDate.month || 1) - 1, media.startDate.day || 1)
        : null,
      episodes: (media.airingSchedule?.nodes ?? []).map((n) => ({
        atMs: n.airingAt * 1000,
        episode: n.episode,
      })),
    });
  }
  return parId;
}
