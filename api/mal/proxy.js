import { proxyCatalogue, proxyEcriture } from '../_lib/malProxy.js';

// Le chemin cible MAL est passé en paramètre de requête (?path=…) plutôt que
// dans l'URL elle-même : les routes catch-all Vercel à plusieurs segments
// ([...path].js) ne sont fiables que sous Next.js — en dehors, une requête
// comme /api/mal/anime/1 ou /api/mal/users/@me/animelist (2+ segments)
// tombe sur la page 404 générique de Vercel avant même d'atteindre la
// fonction. Cette route statique à un seul segment n'a pas ce problème.
export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const chemin = url.searchParams.get('path') ?? '';
  if (req.method === 'PUT' || req.method === 'DELETE') {
    return proxyEcriture(req, res, chemin);
  }
  return proxyCatalogue(req, res, chemin);
}
