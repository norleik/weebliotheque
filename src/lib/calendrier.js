import { ficheDiffusion } from '../api/jikan';

const CLE_CACHE = 'weebliotheque:calendrier';
const TTL = 12 * 3600e3; // les infos de diffusion bougent peu : 12 h de cache
const HORIZON_JOURS = 28;
const MAX_OCCURRENCES = 3;
const SEMAINE_MS = 7 * 86400e3;

const JOURS_EN = {
  sundays: 0,
  mondays: 1,
  tuesdays: 2,
  wednesdays: 3,
  thursdays: 4,
  fridays: 5,
  saturdays: 6,
};

const JOURS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function lireCache() {
  try {
    return JSON.parse(localStorage.getItem(CLE_CACHE)) ?? {};
  } catch {
    return {};
  }
}

// Infos de diffusion avec cache : une seule requête Jikan par animé et par demi-journée.
// Après un vrai appel réseau, on temporise pour respecter la limite Jikan (3 req/s).
export async function infoDiffusion(malId) {
  const cache = lireCache();
  const entree = cache[malId];
  if (entree && Date.now() - entree.fetchedAt < TTL) return entree;

  const info = await ficheDiffusion(malId);
  const enrichie = { ...info, fetchedAt: Date.now() };
  cache[malId] = enrichie;
  localStorage.setItem(CLE_CACHE, JSON.stringify(cache));
  await new Promise((r) => setTimeout(r, 400));
  return enrichie;
}

// Prochaine occurrence du jour/heure de diffusion (heure japonaise, UTC+9 sans DST).
function prochaineDiffusion(day, time, maintenant) {
  const cible = JOURS_EN[day?.toLowerCase()];
  if (cible == null) return null;
  const [heures, minutes] = (time ?? '00:00').split(':').map(Number);

  // On raisonne en "faux UTC" décalé de +9 h pour représenter le Japon.
  const jstNow = new Date(maintenant.getTime() + 9 * 3600e3);
  const d = new Date(
    Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate(), heures, minutes),
  );
  d.setUTCDate(d.getUTCDate() + ((cible - d.getUTCDay() + 7) % 7));
  if (d.getTime() <= jstNow.getTime()) d.setUTCDate(d.getUTCDate() + 7);

  return new Date(d.getTime() - 9 * 3600e3);
}

// Événements à venir pour une œuvre : épisodes hebdomadaires si en diffusion,
// ou la première si la série n'a pas encore commencé.
export function occurrences(oeuvre, info, maintenant = new Date()) {
  const resultats = [];
  const horizon = maintenant.getTime() + HORIZON_JOURS * 86400e3;

  if (info.airing && info.day) {
    const premiere = prochaineDiffusion(info.day, info.time, maintenant);
    if (!premiere) return resultats;
    const debut = info.from ? new Date(info.from).getTime() : null;

    for (let i = 0; i < MAX_OCCURRENCES; i++) {
      const date = new Date(premiere.getTime() + i * SEMAINE_MS);
      if (date.getTime() > horizon) break;
      const episode = debut ? Math.round((date.getTime() - debut) / SEMAINE_MS) + 1 : null;
      if (info.total && episode && episode > info.total) break;
      resultats.push({ oeuvre, date, episode, heure: info.time });
    }
    return resultats;
  }

  // Pas encore diffusé : la première est un événement à part entière.
  if (!info.airing && info.from) {
    const from = new Date(info.from);
    if (from.getTime() > maintenant.getTime() && from.getTime() <= horizon) {
      resultats.push({ oeuvre, date: from, episode: 1, heure: info.time, premiere: true });
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
