import { useState } from 'react';
import ProfileBanner from './ProfileBanner';
import StatsGrid from './StatsGrid';
import ListesBande from './ListesBande';
import LibraryTabs from './LibraryTabs';
import WorksGrid from './WorksGrid';
import { useStats } from '../hooks/useStats';
import { onglets } from '../data/profil';

export default function PageProfil({ userId, utilisateur, onModifier, bibliotheque }) {
  const [ongletActif, setOngletActif] = useState(onglets[0].id);
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const { library, incrementerProgression, definirNote, definirStatut, retirerOeuvre } = bibliotheque;
  const stats = useStats(userId, library);

  const ongletsAvecTotal = onglets.map((onglet) => ({
    ...onglet,
    total: library.filter((o) => o.type === onglet.type).length,
  }));

  const typeActif = onglets.find((o) => o.id === ongletActif)?.type;
  const oeuvresFiltrees = library.filter(
    (oeuvre) => oeuvre.type === typeActif && (filtreStatut === 'tous' || oeuvre.statut === filtreStatut),
  );

  return (
    <>
      <ProfileBanner utilisateur={utilisateur} onModifier={onModifier} />
      <StatsGrid stats={stats} />
      <ListesBande userId={userId} proprietaire library={library} />
      <LibraryTabs
        onglets={ongletsAvecTotal}
        ongletActif={ongletActif}
        onChangeOnglet={setOngletActif}
        filtreStatut={filtreStatut}
        onChangeFiltre={setFiltreStatut}
      />
      <WorksGrid
        oeuvres={oeuvresFiltrees}
        onIncrementer={incrementerProgression}
        onDefinirNote={definirNote}
        onDefinirStatut={definirStatut}
        onRetirer={retirerOeuvre}
      />
    </>
  );
}
