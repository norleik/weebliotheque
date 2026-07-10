const BASE_URL = 'https://api.jikan.moe/v4';

// "24 min per ep", "1 hr 55 min", "23 min" → minutes (null si inconnu).
function parseDuree(duration) {
  if (!duration) return null;
  const heures = /(\d+)\s*hr/.exec(duration);
  const minutes = /(\d+)\s*min/.exec(duration);
  const total = (heures ? Number(heures[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
  return total || null;
}

function mapAnime(item) {
  return {
    malId: item.mal_id,
    type: 'ANIMÉ',
    titre: item.title,
    image: item.images?.jpg?.image_url ?? null,
    total: item.episodes ?? null,
    url: item.url,
    dureeEpisode: parseDuree(item.duration),
    score: item.score ?? null,
  };
}

function mapManga(item) {
  const typeJikan = (item.type || '').toLowerCase();
  let type = 'MANGA';
  if (typeJikan.includes('novel')) type = 'LIGHT NOVEL';
  else if (typeJikan.includes('manhwa') || typeJikan.includes('manhua')) type = 'MANHWA';

  return {
    malId: item.mal_id,
    type,
    titre: item.title,
    image: item.images?.jpg?.image_url ?? null,
    total: (type === 'LIGHT NOVEL' ? item.volumes : item.chapters) ?? null,
    url: item.url,
    score: item.score ?? null,
  };
}

export async function rechercherOeuvres(query, { signal } = {}) {
  const q = query.trim();
  if (!q) return [];

  const [animeRes, mangaRes] = await Promise.all([
    fetch(`${BASE_URL}/anime?q=${encodeURIComponent(q)}&limit=6`, { signal }),
    fetch(`${BASE_URL}/manga?q=${encodeURIComponent(q)}&limit=6`, { signal }),
  ]);

  if (!animeRes.ok || !mangaRes.ok) {
    throw new Error('Erreur lors de la recherche sur Jikan');
  }

  const [animeData, mangaData] = await Promise.all([animeRes.json(), mangaRes.json()]);

  const animes = (animeData.data ?? []).map(mapAnime);
  const mangas = (mangaData.data ?? []).map(mapManga);

  return [...animes, ...mangas];
}

// Infos de diffusion d'un animé (pour le calendrier).
export async function ficheDiffusion(malId) {
  const res = await fetch(`${BASE_URL}/anime/${malId}`);
  if (!res.ok) throw new Error(`Erreur Jikan pour l'animé ${malId}`);
  const { data } = await res.json();
  return {
    airing: data?.airing ?? false,
    day: data?.broadcast?.day ?? null,
    time: data?.broadcast?.time ?? null,
    from: data?.aired?.from ?? null,
    total: data?.episodes ?? null,
  };
}

const SAISONS_FR = { winter: 'Hiver', spring: 'Printemps', summer: 'Été', fall: 'Automne' };

export async function sortiesSaison(page = 1) {
  const res = await fetch(`${BASE_URL}/seasons/now?page=${page}`);
  if (!res.ok) throw new Error('Erreur lors du chargement des sorties de la saison');
  const json = await res.json();

  const premier = json.data?.[0];
  const saison = premier ? `${SAISONS_FR[premier.season] ?? ''} ${premier.year ?? ''}`.trim() : '';

  return {
    sorties: (json.data ?? []).map(mapAnime),
    aSuite: json.pagination?.has_next_page ?? false,
    saison,
  };
}
