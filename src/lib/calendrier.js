import { planningDiffusion } from '../api/anilist';

const CLE_CACHE = 'weebliotheque:calendrier:v2'; // v2 : forme AniList (v1 était MAL)
const TTL = 12 * 3600e3; // les infos de diffusion bougent peu : 12 h de cache
const HORIZON_JOURS = 28;
const MAX_OCCURRENCES = 3;

const JOURS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function lireCache() {
  try {
    return JSON.parse(localStorage.getItem(CLE_CACHE)) ?? {};
  } catch {
    return {};
  }
}

// Planning de diffusion avec cache (12 h) : ne redemande à AniList que les
// animés absents ou expirés du cache, en une requête groupée pour tous.
export async function planningAvecCache(malIds) {
  const cache = lireCache();
  const maintenant = Date.now();
  const frais = malIds.filter((id) => !(cache[id] && maintenant - cache[id].fetchedAt < TTL));

  if (frais.length) {
    const planning = await planningDiffusion(frais);
    for (const id of frais) {
      const info = planning.get(id) ?? { statut: null, debutMs: null, episodes: [] };
      cache[id] = { ...info, fetchedAt: maintenant };
    }
    localStorage.setItem(CLE_CACHE, JSON.stringify(cache));
  }

  const resultat = new Map();
  for (const id of malIds) if (cache[id]) resultat.set(id, cache[id]);
  return resultat;
}

// Événements à venir pour une œuvre : les prochains épisodes planifiés par
// AniList (horodatage exact), ou la date de sortie si aucun épisode n'est
// encore planifié pour une série pas encore diffusée.
export function occurrences(oeuvre, info, maintenant = new Date()) {
  const resultats = [];
  const horizon = maintenant.getTime() + HORIZON_JOURS * 86400e3;

  for (const ep of info.episodes ?? []) {
    if (ep.atMs > horizon) break;
    if (ep.atMs <= maintenant.getTime()) continue;
    resultats.push({ oeuvre, date: new Date(ep.atMs), episode: ep.episode, premiere: ep.episode === 1 });
    if (resultats.length >= MAX_OCCURRENCES) break;
  }

  if (resultats.length === 0 && info.statut === 'NOT_YET_RELEASED' && info.debutMs) {
    if (info.debutMs > maintenant.getTime() && info.debutMs <= horizon) {
      resultats.push({ oeuvre, date: new Date(info.debutMs), episode: 1, premiere: true });
    }
  }

  return resultats;
}

function debutJour(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function joursRestants(date, maintenant = new Date()) {
  return Math.round((debutJour(date) - debutJour(maintenant)) / 86400e3);
}

function libelleGroupe(date, maintenant) {
  const jours = joursRestants(date, maintenant);
  if (jours <= 0) return "Aujourd'hui";
  if (jours === 1) return 'Demain';
  if (jours < 7) return JOURS_FR[date.getDay()];
  return 'Plus tard';
}

// Trie et regroupe les événements par jour ("Aujourd'hui", "Demain", jours de la
// semaine, puis "Plus tard") — même logique que l'onglet À venir de TV Time.
export function grouperParJour(evenements, maintenant = new Date()) {
  const tries = [...evenements].sort((a, b) => a.date - b.date);
  const groupes = [];
  const parLibelle = new Map();

  for (const ev of tries) {
    const libelle = libelleGroupe(ev.date, maintenant);
    if (!parLibelle.has(libelle)) {
      const groupe = { libelle, evenements: [] };
      parLibelle.set(libelle, groupe);
      groupes.push(groupe);
    }
    parLibelle.get(libelle).evenements.push(ev);
  }
  return groupes;
}
