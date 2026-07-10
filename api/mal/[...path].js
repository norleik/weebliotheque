import { proxyCatalogue } from '../_lib/malProxy.js';

export default async function handler(req, res) {
  const chemin = req.url.replace(/^\/api\/mal\//, '');
  return proxyCatalogue(req, res, chemin);
}
