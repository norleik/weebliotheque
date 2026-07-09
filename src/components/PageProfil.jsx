import { useState } from 'react';
import ProfileBanner from './ProfileBanner';
import StatsGrid from './StatsGrid';
import LibraryTabs from './LibraryTabs';
import WorksGrid from './WorksGrid';
import { useStats } from '../hooks/useStats';
import { onglets } from '../data/profil';

export default function PageProfil({ userId, utilisateur, onModifier, bibliotheque }) {
  const [ongletActif, setOngletActif] = useState(onglets[0].id);
  const { library, incrementerProgression, definirNote, retirerOeuvre } = bibliotheque;
  const stats = useStats(userId, library);

  const ongletsAvecTotal = onglets.map((onglet) => ({
    ...onglet,
    total: library.filter((o) => o.type === onglet.type).length,
  }));

  const typeActif = onglets.find((o) => o.id === ongletActif)?.type;
  const oeuvresFiltrees = library.filter((oeuvre) => oeuvre.type === typeActif);

  return (
    <>
      <ProfileBanner utilisateur={utilisateur} onModifier={onModifier} />
      <StatsGrid stats={stats} />
      <LibraryTabs onglets={ongletsAvecTotal} ongletActif={ongletActif} onChangeOnglet={setOngletActif} />
      <WorksGrid
        oeuvres={oeuvresFiltrees}
        onIncrementer={incrementerProgression}
        onDefinirNote={definirNote}
        onRetirer={retirerOeuvre}
      />
    </>
  );
}
