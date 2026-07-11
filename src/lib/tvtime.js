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

// TV Time propose plusieurs exports CSV différents (via la demande RGPD, qui
// livre un gros dossier de fichiers). On en reconnaît trois, du moins au plus
// précis :
// - "abonnements" (tv_show_name/active/archived…) : séries suivies et leurs
//   réglages de notification — ne garantit pas que la série ait été regardée.
// - "episodes_vus" (episode_id/tv_show_name/tv_show_id…, sans active/archived) :
//   le dernier épisode vu par série — garantit qu'au moins un épisode a été vu,
//   mais sans numéro d'épisode ni total.
// - "progression" (nb_episodes_seen/tv_show_name…, fichier user_tv_show_data) :
//   le nombre total d'épisodes vus par série, déjà calculé par TV Time — le
//   plus utile, à privilégier si l'utilisateur le trouve dans son export.
export function parserCsvTvTime(texte) {
  const lignes = texte.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lignes.length < 2) return { format: null, lignes: [] };

  const entetes = parseLigneCsv(lignes[0]).map((h) => h.trim());
  const idxNom = entetes.indexOf('tv_show_name');
  if (idxNom === -1) {
    throw new Error('Colonne "tv_show_name" introuvable — ce fichier ne semble pas venir de TV Time.');
  }

  const idxProgression = entetes.indexOf('nb_episodes_seen');
  const idxActif = entetes.indexOf('active');
  const idxArchive = entetes.indexOf('archived');

  const format =
    idxProgression !== -1 ? 'progression' : idxActif !== -1 || idxArchive !== -1 ? 'abonnements' : 'episodes_vus';

  const parLigne = lignes
    .slice(1)
    .map((ligne) => {
      const champs = parseLigneCsv(ligne);
      return {
        nom: champs[idxNom]?.trim() ?? '',
        actif: idxActif !== -1 && champs[idxActif]?.trim() === '1',
        archive: idxArchive !== -1 && champs[idxArchive]?.trim() === '1',
        progression: idxProgression !== -1 ? Number(champs[idxProgression]) || 0 : null,
      };
    })
    .filter((r) => r.nom);

  // Une ligne par série attendue dans les trois formats, on déduplique par
  // sécurité (garde la première occurrence rencontrée).
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

// Statut par défaut pour les formats "abonnements"/"episodes_vus", qui ne
// donnent pas de vrai nombre d'épisodes.
export function statutParDefaut({ actif, archive }, format) {
  if (format === 'episodes_vus') return 'en_cours'; // au moins un épisode vu, c'est confirmé
  if (actif) return 'en_cours';
  if (archive) return 'arrete';
  return 'pas_commence';
}

// Pour le format "progression" : statut déduit en comparant le nombre
// d'épisodes vus au total de l'œuvre MAL choisie (si connu).
export function statutDepuisProgression(progressionVue, total) {
  if (total && progressionVue >= total) return 'termine';
  return 'en_cours';
}
