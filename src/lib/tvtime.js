// Parseur minimal d'une ligne CSV (gère les champs entre guillemets,
// avec virgules ou guillemets échappés à l'intérieur).
function parseLigneCsv(ligne) {
  const champs = [];
  let champ = '';
  let dansGuillemets = false;

  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (dansGuillemets) {
      if (c === '"') {
        if (ligne[i + 1] === '"') {
          champ += '"';
          i++;
        } else {
          dansGuillemets = false;
        }
      } else {
        champ += c;
      }
    } else if (c === '"') {
      dansGuillemets = true;
    } else if (c === ',') {
      champs.push(champ);
      champ = '';
    } else {
      champ += c;
    }
  }
  champs.push(champ);
  return champs;
}

// TV Time propose plusieurs exports CSV différents. On en reconnaît deux :
// - "subscriptions" (colonnes tv_show_name/active/archived…) : séries suivies
//   et leurs réglages de notification — ne garantit pas que la série ait été
//   vraiment regardée.
// - "show_seen_episode_latest" (colonnes episode_id/tv_show_name/tv_show_id…) :
//   le dernier épisode vu par série — garantit qu'au moins un épisode a été vu,
//   mais ne donne ni le numéro de cet épisode ni le total vu.
// Aucun des deux ne fournit de compteur d'épisodes exploitable tel quel.
export function parserCsvTvTime(texte) {
  const lignes = texte.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lignes.length < 2) return { format: null, lignes: [] };

  const entetes = parseLigneCsv(lignes[0]).map((h) => h.trim());
  const idxNom = entetes.indexOf('tv_show_name');
  if (idxNom === -1) {
    throw new Error('Colonne "tv_show_name" introuvable — ce fichier ne semble pas venir de TV Time.');
  }

  const idxActif = entetes.indexOf('active');
  const idxArchive = entetes.indexOf('archived');
  const format = idxActif !== -1 || idxArchive !== -1 ? 'abonnements' : 'episodes_vus';

  const parLigne = lignes
    .slice(1)
    .map((ligne) => {
      const champs = parseLigneCsv(ligne);
      return {
        nom: champs[idxNom]?.trim() ?? '',
        actif: idxActif !== -1 && champs[idxActif]?.trim() === '1',
        archive: idxArchive !== -1 && champs[idxArchive]?.trim() === '1',
      };
    })
    .filter((r) => r.nom);

  // "show_seen_episode_latest" ne devrait avoir qu'une ligne par série, mais on
  // déduplique par sécurité (garde la première occurrence rencontrée).
  const parTitre = new Map();
  for (const l of parLigne) {
    if (!parTitre.has(l.nom)) parTitre.set(l.nom, l);
  }

  return { format, lignes: [...parTitre.values()] };
}

// TV Time suffixe parfois le titre par l'année ("Hunter x Hunter (2011)") pour
// distinguer les remakes — MAL ne l'a généralement pas dans son titre indexé.
export function nettoyerTitreRecherche(nom) {
  return nom.replace(/\s*\(\d{4}\)\s*$/, '').trim();
}

// Statut Weebliothèque par défaut déduit du fichier TV Time — approximatif,
// aucun des deux formats ne fournit de vrai statut de progression.
export function statutParDefaut({ actif, archive }, format) {
  if (format === 'episodes_vus') return 'en_cours'; // au moins un épisode vu, c'est confirmé
  if (actif) return 'en_cours';
  if (archive) return 'arrete';
  return 'pas_commence';
}
