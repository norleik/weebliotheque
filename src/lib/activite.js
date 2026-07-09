export function tempsRelatif(dateIso) {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  if (jours < 7) return `il y a ${jours} j`;
  return new Date(dateIso).toLocaleDateString('fr-FR');
}

export function messageActivite(activite) {
  const { action, titre, type, detail } = activite;
  const unite = type === 'ANIMÉ' ? "l'épisode" : type === 'LIGHT NOVEL' ? 'le tome' : 'le chapitre';
  const verbe = type === 'ANIMÉ' ? 'vu' : 'lu';

  switch (action) {
    case 'ajout':
      return `a ajouté ${titre} à sa bibliothèque`;
    case 'progression':
      return `a ${verbe} ${unite} ${detail} de ${titre}`;
    case 'note':
      return `a noté ${titre} ${detail}/10`;
    case 'termine':
      return `a terminé ${titre}`;
    default:
      return '';
  }
}
