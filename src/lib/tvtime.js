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

// Extrait { nom, actif, archive } de l'export "subscriptions" de TV Time
// (colonnes : tv_show_name, ..., archived, ..., active — pas de progression
// épisode par épisode dans ce fichier, juste la liste des séries suivies).
export function parserCsvTvTime(texte) {
  const lignes = texte.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lignes.length < 2) return [];

  const entetes = parseLigneCsv(lignes[0]).map((h) => h.trim());
  const idxNom = entetes.indexOf('tv_show_name');
  const idxActif = entetes.indexOf('active');
  const idxArchive = entetes.indexOf('archived');

  if (idxNom === -1) {
    throw new Error('Colonne "tv_show_name" introuvable — ce fichier ne semble pas venir de TV Time.');
  }

  return lignes
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
}

// TV Time suffixe parfois le titre par l'année ("Hunter x Hunter (2011)") pour
// distinguer les remakes — MAL ne l'a généralement pas dans son titre indexé.
export function nettoyerTitreRecherche(nom) {
  return nom.replace(/\s*\(\d{4}\)\s*$/, '').trim();
}

// Statut Weebliothèque par défaut déduit des colonnes TV Time — approximatif,
// TV Time ne fournit pas de vrai statut de progression dans cet export.
export function statutParDefaut({ actif, archive }) {
  if (actif) return 'en_cours';
  if (archive) return 'arrete';
  return 'pas_commence';
}
