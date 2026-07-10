// Proxy vers l'API MyAnimeList — nécessaire car l'API MAL n'autorise pas
// les appels directs depuis un navigateur (pas de CORS). Utilisé à la fois
// par les fonctions Vercel (api/mal/*) et par le middleware de dev Vite.

const API_MAL = 'https://api.myanimelist.net/v2';
const URL_TOKEN = 'https://myanimelist.net/v1/oauth2/token';

// Chemins autorisés — évite de servir de proxy ouvert.
const CHEMINS_AUTORISES = [
  /^anime(\/|\?|$)/,
  /^manga(\/|\?|$)/,
  /^users\/@me\/(animelist|mangalist)(\?|$)/,
];

async function lireCorps(req) {
  if (req.body !== undefined && req.body !== null) {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
  }
  const morceaux = [];
  for await (const morceau of req) morceaux.push(morceau);
  const texte = Buffer.concat(morceaux).toString('utf8');
  return texte ? JSON.parse(texte) : {};
}

function repondreJson(res, statut, corps) {
  res.statusCode = statut;
  res.setHeader('Content-Type', 'application/json');
  res.end(typeof corps === 'string' ? corps : JSON.stringify(corps));
}

// GET /api/mal/<chemin> → GET https://api.myanimelist.net/v2/<chemin>
// Avec le token utilisateur si fourni, sinon avec le Client ID de l'appli.
export async function proxyCatalogue(req, res, chemin) {
  if (req.method !== 'GET') {
    return repondreJson(res, 405, { error: 'Méthode non autorisée' });
  }
  const propre = chemin.replace(/^\/+/, '');
  if (!CHEMINS_AUTORISES.some((r) => r.test(propre))) {
    return repondreJson(res, 403, { error: 'Chemin non autorisé' });
  }

  const entetes = {};
  if (req.headers.authorization) {
    entetes.Authorization = req.headers.authorization;
  } else {
    entetes['X-MAL-CLIENT-ID'] = process.env.MAL_CLIENT_ID;
  }

  try {
    const reponse = await fetch(`${API_MAL}/${propre}`, { headers: entetes });
    const corps = await reponse.text();
    return repondreJson(res, reponse.status, corps);
  } catch (err) {
    console.error(err);
    return repondreJson(res, 502, { error: 'MAL injoignable' });
  }
}

// POST /api/mal/token — échange de code OAuth ou rafraîchissement,
// en y ajoutant le client_id/secret gardés côté serveur.
export async function echangeToken(req, res) {
  if (req.method !== 'POST') {
    return repondreJson(res, 405, { error: 'Méthode non autorisée' });
  }

  let corps;
  try {
    corps = await lireCorps(req);
  } catch {
    return repondreJson(res, 400, { error: 'Corps JSON invalide' });
  }

  const params = new URLSearchParams({
    client_id: process.env.MAL_CLIENT_ID,
    client_secret: process.env.MAL_CLIENT_SECRET,
  });

  if (corps.grant_type === 'authorization_code') {
    params.set('grant_type', 'authorization_code');
    params.set('code', corps.code ?? '');
    params.set('code_verifier', corps.code_verifier ?? '');
    params.set('redirect_uri', corps.redirect_uri ?? '');
  } else if (corps.grant_type === 'refresh_token') {
    params.set('grant_type', 'refresh_token');
    params.set('refresh_token', corps.refresh_token ?? '');
  } else {
    return repondreJson(res, 400, { error: 'grant_type non géré' });
  }

  try {
    const reponse = await fetch(URL_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const texte = await reponse.text();
    return repondreJson(res, reponse.status, texte);
  } catch (err) {
    console.error(err);
    return repondreJson(res, 502, { error: 'MAL injoignable' });
  }
}
