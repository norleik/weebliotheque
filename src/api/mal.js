// Client de l'API MyAnimeList officielle, via notre proxy /api/mal
// (l'API MAL ne permet pas les appels directs depuis le navigateur).
// Même interface que l'ancien client Jikan : les mal_id sont identiques.

const BASE = '/api/mal';
const CLIENT_ID = import.meta.env.VITE_MAL_CLIENT_ID;
const CLE_TOKENS = 'weebliotheque:mal';
const CLE_VERIFIER = 'weebliotheque:mal:verifier';
const CLE_PROFIL_MAL = 'weebliotheque:mal:profil';
const CLE_DERNIERE_SYNC = 'weebliotheque:mal:derniere';

// Le chemin MAL cible est passé en paramètre de requête plutôt que dans
// l'URL — voir le commentaire dans api/mal/proxy.js pour le pourquoi.
function urlProxy(chemin) {
  return `${BASE}/proxy?path=${encodeURIComponent(chemin)}`;
}

// ===== Mappers =====

const TYPES_MANGA = {
  light_novel: 'LIGHT NOVEL',
  novel: 'LIGHT NOVEL',
  manhwa: 'MANHWA',
  manhua: 'MANHWA',
};

function mapAnime(node) {
  return {
    malId: node.id,
    type: 'ANIMÉ',
    titre: node.title,
    image: node.main_picture?.medium ?? null,
    total: node.num_episodes || null,
    url: `https://myanimelist.net/anime/${node.id}`,
    dureeEpisode: node.average_episode_duration
      ? Math.round(node.average_episode_duration / 60)
      : null,
    score: node.mean ?? null,
  };
}

function mapManga(node) {
  const type = TYPES_MANGA[node.media_type] ?? 'MANGA';
  return {
    malId: node.id,
    type,
    titre: node.title,
    image: node.main_picture?.medium ?? null,
    total: (type === 'LIGHT NOVEL' ? node.num_volumes : node.num_chapters) || null,
    url: `https://myanimelist.net/manga/${node.id}`,
    score: node.mean ?? null,
  };
}

// ===== Catalogue (recherche, saison, diffusion) =====

const CHAMPS_ANIME = 'main_picture,num_episodes,media_type,mean,average_episode_duration';
const CHAMPS_MANGA = 'main_picture,num_chapters,num_volumes,media_type,mean';

export async function rechercherOeuvres(query, { signal } = {}) {
  const q = query.trim();
  if (q.length < 3) return []; // l'API MAL exige au moins 3 caractères

  const [animeRes, mangaRes] = await Promise.all([
    fetch(urlProxy(`anime?q=${encodeURIComponent(q)}&limit=6&fields=${CHAMPS_ANIME}`), { signal }),
    fetch(urlProxy(`manga?q=${encodeURIComponent(q)}&limit=6&fields=${CHAMPS_MANGA}`), { signal }),
  ]);

  if (!animeRes.ok || !mangaRes.ok) {
    throw new Error('Erreur lors de la recherche MAL');
  }

  const [animeData, mangaData] = await Promise.all([animeRes.json(), mangaRes.json()]);

  return [
    ...(animeData.data ?? []).map((d) => mapAnime(d.node)),
    ...(mangaData.data ?? []).map((d) => mapManga(d.node)),
  ];
}

const SAISONS_FR = { winter: 'Hiver', spring: 'Printemps', summer: 'Été', fall: 'Automne' };

function saisonCourante(date = new Date()) {
  const mois = date.getMonth() + 1;
  const saison = mois <= 3 ? 'winter' : mois <= 6 ? 'spring' : mois <= 9 ? 'summer' : 'fall';
  return { saison, annee: date.getFullYear() };
}

const PAR_PAGE = 24;

export async function sortiesSaison(page = 1) {
  const { saison, annee } = saisonCourante();
  const offset = (page - 1) * PAR_PAGE;
  const res = await fetch(
    urlProxy(
      `anime/season/${annee}/${saison}?limit=${PAR_PAGE}&offset=${offset}&sort=anime_num_list_users&fields=${CHAMPS_ANIME}`,
    ),
  );
  if (!res.ok) throw new Error('Erreur lors du chargement des sorties de la saison');
  const json = await res.json();

  return {
    sorties: (json.data ?? []).map((d) => mapAnime(d.node)),
    aSuite: Boolean(json.paging?.next),
    saison: `${SAISONS_FR[saison]} ${annee}`,
  };
}

export async function ficheDiffusion(malId) {
  const res = await fetch(urlProxy(`anime/${malId}?fields=broadcast,status,start_date,num_episodes`));
  if (!res.ok) throw new Error(`Erreur MAL pour l'animé ${malId}`);
  const data = await res.json();
  return {
    airing: data.status === 'currently_airing',
    // MAL renvoie "monday" (singulier) — le calendrier attend le pluriel façon Jikan.
    day: data.broadcast?.day_of_the_week ? `${data.broadcast.day_of_the_week}s` : null,
    time: data.broadcast?.start_time ?? null,
    from: data.start_date ?? null,
    total: data.num_episodes || null,
  };
}

// ===== Liaison de compte (OAuth2 PKCE "plain") =====

function lireTokens() {
  try {
    return JSON.parse(localStorage.getItem(CLE_TOKENS));
  } catch {
    return null;
  }
}

export function compteLie() {
  return Boolean(lireTokens());
}

export function delierCompte() {
  localStorage.removeItem(CLE_TOKENS);
  localStorage.removeItem(CLE_PROFIL_MAL);
  localStorage.removeItem(CLE_DERNIERE_SYNC);
}

// Pseudo + lien du compte MAL lié, mis en cache (rarement amené à changer).
export async function profilMAL() {
  if (!compteLie()) return null;
  const cache = JSON.parse(localStorage.getItem(CLE_PROFIL_MAL) ?? 'null');
  if (cache) return cache;

  try {
    const data = await fetchAvecToken('users/@me?fields=name');
    const profil = { pseudo: data.name, url: `https://myanimelist.net/profile/${data.name}` };
    localStorage.setItem(CLE_PROFIL_MAL, JSON.stringify(profil));
    return profil;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export function derniereSynchro() {
  const v = localStorage.getItem(CLE_DERNIERE_SYNC);
  return v ? new Date(Number(v)) : null;
}

function redirectUri() {
  return `${window.location.origin}/`;
}

export function demarrerLiaison() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const alea = crypto.getRandomValues(new Uint8Array(64));
  const verifier = [...alea].map((n) => alphabet[n % alphabet.length]).join('');
  localStorage.setItem(CLE_VERIFIER, verifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    code_challenge: verifier,
    code_challenge_method: 'plain',
    redirect_uri: redirectUri(),
    state: 'liaison-mal',
  });
  window.location.href = `https://myanimelist.net/v1/oauth2/authorize?${params}`;
}

async function appelToken(corps) {
  const res = await fetch(`${BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
  });
  if (!res.ok) {
    let detail = '';
    try {
      const erreur = await res.json();
      detail = erreur.message || erreur.error || '';
    } catch {
      /* corps non JSON */
    }
    throw new Error(detail ? `MAL : ${detail}` : 'Échange de jetons MAL refusé');
  }
  const tokens = await res.json();
  localStorage.setItem(CLE_TOKENS, JSON.stringify({ ...tokens, obtenu: Date.now() }));
  return tokens;
}

export async function terminerLiaison(code) {
  const verifier = localStorage.getItem(CLE_VERIFIER);
  if (!verifier) throw new Error('Vérifieur PKCE introuvable — relance la liaison');
  await appelToken({
    grant_type: 'authorization_code',
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri(),
  });
  localStorage.removeItem(CLE_VERIFIER);
}

async function rafraichirTokens() {
  const tokens = lireTokens();
  if (!tokens?.refresh_token) throw new Error('Compte MAL non lié');
  return appelToken({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token });
}

async function fetchAvecToken(chemin, dejaRetente = false) {
  const tokens = lireTokens();
  if (!tokens) throw new Error('Compte MAL non lié');

  const res = await fetch(urlProxy(chemin), {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (res.status === 401 && !dejaRetente) {
    await rafraichirTokens();
    return fetchAvecToken(chemin, true);
  }
  if (!res.ok) throw new Error(`Erreur MAL (${res.status}) sur ${chemin}`);
  return res.json();
}

async function ecrireAvecToken(chemin, params, dejaRetente = false) {
  const tokens = lireTokens();
  if (!tokens) return; // pas de compte lié : rien à synchroniser

  const res = await fetch(urlProxy(chemin), {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    body: params.toString(),
  });

  if (res.status === 401 && !dejaRetente) {
    await rafraichirTokens();
    return ecrireAvecToken(chemin, params, true);
  }
  if (!res.ok) {
    const texte = await res.text().catch(() => '');
    throw new Error(`Erreur MAL (${res.status}) sur ${chemin} : ${texte}`);
  }
  localStorage.setItem(CLE_DERNIERE_SYNC, String(Date.now()));
}

// ===== Synchronisation Weebliothèque → MAL =====

const STATUT_VERS_MAL_ANIME = {
  pas_commence: 'plan_to_watch',
  en_cours: 'watching',
  en_pause: 'on_hold',
  termine: 'completed',
  arrete: 'dropped',
};

const STATUT_VERS_MAL_MANGA = {
  pas_commence: 'plan_to_read',
  en_cours: 'reading',
  en_pause: 'on_hold',
  termine: 'completed',
  arrete: 'dropped',
};

// Répercute un changement de statut/progression/note sur le compte MAL lié.
// Silencieux (ne lance jamais) : une panne de sync MAL ne doit pas bloquer
// une action locale sur Weebliothèque — juste loguée en cas d'échec.
export async function synchroniserVersMAL(oeuvre, { statut, progression, note } = {}) {
  if (!compteLie()) return;

  const genre = oeuvre.type === 'ANIMÉ' ? 'anime' : 'manga';
  const params = new URLSearchParams();

  if (statut) {
    const table = genre === 'anime' ? STATUT_VERS_MAL_ANIME : STATUT_VERS_MAL_MANGA;
    params.set('status', table[statut] ?? 'watching');
  }
  if (progression != null) {
    const champ =
      genre === 'anime'
        ? 'num_watched_episodes'
        : oeuvre.type === 'LIGHT NOVEL'
          ? 'num_volumes_read'
          : 'num_chapters_read';
    params.set(champ, String(progression));
  }
  if (note != null) params.set('score', String(note));

  if ([...params.keys()].length === 0) return;

  try {
    await ecrireAvecToken(`${genre}/${oeuvre.malId}/my_list_status`, params);
  } catch (err) {
    console.error('Synchronisation MAL échouée :', err);
  }
}

// ===== Import de la liste MAL de l'utilisateur =====

const CHAMPS_LISTE_ANIME = 'list_status,num_episodes,media_type,main_picture,average_episode_duration';
const CHAMPS_LISTE_MANGA = 'list_status,num_chapters,num_volumes,media_type,main_picture';

async function listeComplete(genre, onProgres) {
  const champs = genre === 'anime' ? CHAMPS_LISTE_ANIME : CHAMPS_LISTE_MANGA;
  const elements = [];
  let offset = 0;

  for (;;) {
    const json = await fetchAvecToken(
      `users/@me/${genre}list?limit=100&offset=${offset}&nsfw=true&fields=${champs}`,
    );
    elements.push(...(json.data ?? []));
    onProgres?.(elements.length);
    if (!json.paging?.next) break;
    offset += 100;
  }
  return elements;
}

const STATUTS_ANIME = {
  watching: 'en_cours',
  completed: 'termine',
  on_hold: 'en_pause',
  dropped: 'arrete',
  plan_to_watch: 'pas_commence',
};

const STATUTS_MANGA = {
  reading: 'en_cours',
  completed: 'termine',
  on_hold: 'en_pause',
  dropped: 'arrete',
  plan_to_read: 'pas_commence',
};

function mapEntreeListe(genre, { node, list_status }) {
  const base = genre === 'anime' ? mapAnime(node) : mapManga(node);
  const statuts = genre === 'anime' ? STATUTS_ANIME : STATUTS_MANGA;
  const progression =
    genre === 'anime'
      ? list_status?.num_episodes_watched
      : base.type === 'LIGHT NOVEL'
        ? list_status?.num_volumes_read
        : list_status?.num_chapters_read;

  return {
    ...base,
    statut: statuts[list_status?.status] ?? 'en_cours',
    progression: progression ?? 0,
    note: list_status?.score || null,
  };
}

// Récupère et mappe toute la bibliothèque MAL (animés + mangas/LN/manhwas).
export async function importerListeMAL(onProgres) {
  const animes = await listeComplete('anime', (n) => onProgres?.(n));
  const mangas = await listeComplete('manga', (n) => onProgres?.(animes.length + n));
  return [
    ...animes.map((e) => mapEntreeListe('anime', e)),
    ...mangas.map((e) => mapEntreeListe('manga', e)),
  ];
}
