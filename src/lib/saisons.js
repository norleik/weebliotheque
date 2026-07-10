// Regroupe les saisons/films d'un même animé sous un dossier commun,
// en normalisant les titres MAL ("X 2nd Season", "X Movie: …", "X III"…).

const SUFFIXES = [
  /\s+(the\s+)?movie.*$/i,
  /\s+(2nd|3rd|[4-9]th)\s+season.*$/i,
  /\s+season\s+\d+.*$/i,
  /\s+(final\s+season|part\s+\d+|cour\s+\d+)$/i,
  /\s+(II|III|IV|V|VI|VII|VIII|IX|X)$/,
  /\s+S\d+$/i,
];

export function cleTitre(titre) {
  // Coupe le sous-titre après ": " (mais pas "Re:Zero" — pas d'espace après le deux-points).
  let t = titre.split(': ')[0];
  for (const suffixe of SUFFIXES) t = t.replace(suffixe, '');
  return t.trim().toLowerCase();
}

// → [{ genre: 'dossier', cle, nom, image, items }, { genre: 'oeuvre', oeuvre }, …]
export function grouperSaisons(oeuvres) {
  const groupes = new Map();
  for (const oeuvre of oeuvres) {
    const cle = cleTitre(oeuvre.titre);
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle).push(oeuvre);
  }

  const elements = [];
  const clesVues = new Set();
  for (const oeuvre of oeuvres) {
    const cle = cleTitre(oeuvre.titre);
    if (clesVues.has(cle)) continue;
    clesVues.add(cle);

    const items = groupes.get(cle);
    if (items.length === 1) {
      elements.push({ genre: 'oeuvre', oeuvre });
      continue;
    }

    // Le titre le plus court est généralement la saison de base ("Sousou no Frieren").
    const tries = [...items].sort((a, b) => a.titre.length - b.titre.length || a.titre.localeCompare(b.titre));
    const base = tries[0];
    elements.push({
      genre: 'dossier',
      cle,
      nom: base.titre.split(': ')[0],
      image: base.image,
      items: tries,
    });
  }
  return elements;
}
