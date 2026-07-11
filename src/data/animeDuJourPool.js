// Réserve d'animés connus pour le mini-jeu "L'Anime du Jour" — chaque
// identifiant MAL a été vérifié manuellement auprès de l'API avant d'être
// ajouté ici (voir la conversation de conception). L'animé du jour est
// déterminé par rotation déterministe : tout le monde a le même, sans base
// de données ni tâche planifiée.

export const POOL_ANIME_DU_JOUR = [
  1, 5, 19, 20, 21, 30, 199, 269, 431, 813, 1535, 1575, 2001, 2167, 4224, 5114,
  6547, 9253, 10087, 10620, 11061, 11757, 13601, 14719, 16498, 18679, 19815,
  20507, 20583, 22319, 23273, 24833, 25777, 28223, 28851, 28999, 29803, 30015,
  30276, 30831, 31240, 31964, 32182, 32281, 32935, 33352, 34599, 35120, 36038,
  36098, 37430, 37450, 37510, 37521, 37999, 38000, 38524, 39468, 39535, 39551,
  40028, 40456, 40748, 41467, 42897, 44042, 44511, 47160, 48583, 49387, 49458,
  50265, 51009, 51535, 52299, 52991, 53446, 54492, 55701, 56784, 57334, 58390,
  59978,
];

// Point de départ arbitraire de la rotation (1er janvier 2026) — n'affecte
// que l'ordre de passage dans le pool, jamais son contenu.
const EPOQUE = Date.UTC(2026, 0, 1);
const JOUR_MS = 86400000;

function dateUTCDuJour(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

// Clé stable du jour (locale), ex : "2026-07-11" — sert d'identifiant de
// partie unique par utilisateur et par jour.
export function cléJour(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

// Identifiant MAL de l'animé caché du jour — identique pour tous les
// joueurs, quel que soit le moment où ils chargent la page.
export function idAnimeDuJour(date = new Date()) {
  const jours = Math.floor((dateUTCDuJour(date) - EPOQUE) / JOUR_MS);
  const taille = POOL_ANIME_DU_JOUR.length;
  return POOL_ANIME_DU_JOUR[((jours % taille) + taille) % taille];
}
