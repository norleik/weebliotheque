import { useState } from 'react';
import ProfileBanner from './ProfileBanner';
import ImportMAL from './ImportMAL';
import ImportTVTime from './ImportTVTime';
import StatsGrid from './StatsGrid';
import ListesBande from './ListesBande';
import LibraryTabs from './LibraryTabs';
import WorksGrid from './WorksGrid';
import GrilleAnimes from './GrilleAnimes';
import Collection from './Collection';
import { useStats } from '../hooks/useStats';
import { onglets } from '../data/profil';

export default function PageProfil({ userId, utilisateur, onModifier, onUploaderAvatar, bibliotheque }) {
  const [ongletActif, setOngletActif] = useState(onglets[0].id);
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const {
    library,
    incrementerProgression,
    decrementerProgression,
    toutMarquer,
    definirNote,
    definirStatut,
    retirerOeuvre,
    importerOeuvres,
  } = bibliotheque;
  const stats = useStats(userId, library);

  const ongletsAvecTotal = onglets.map((onglet) => ({
    ...onglet,
    total: onglet.type ? library.filter((o) => o.type === onglet.type).length : library.length,
  }));

  const estCollection = ongletActif === 'collection';
  const typeActif = onglets.find((o) => o.id === ongletActif)?.type;
  const oeuvresFiltrees = library.filter(
    (oeuvre) => oeuvre.type === typeActif && (filtreStatut === 'tous' || oeuvre.statut === filtreStatut),
  );

  const handlers = {
    onIncrementer: incrementerProgression,
    onDecrementer: decrementerProgression,
    onToutMarquer: toutMarquer,
    onDefinirNote: definirNote,
    onDefinirStatut: definirStatut,
    onRetirer: retirerOeuvre,
  };

  return (
    <>
      <ProfileBanner utilisateur={utilisateur} onModifier={onModifier} onUploaderAvatar={onUploaderAvatar} />
      <ImportMAL onImporter={importerOeuvres} />
      <ImportTVTime onImporter={importerOeuvres} />
      <StatsGrid stats={stats} />
      <ListesBande userId={userId} proprietaire library={library} />
      <LibraryTabs
        onglets={ongletsAvecTotal}
        ongletActif={ongletActif}
        onChangeOnglet={setOngletActif}
        filtreStatut={filtreStatut}
        onChangeFiltre={estCollection ? undefined : setFiltreStatut}
      />
      {estCollection ? (
        <Collection oeuvres={library} {...handlers} />
      ) : typeActif === 'ANIMÉ' ? (
        <GrilleAnimes oeuvres={oeuvresFiltrees} {...handlers} />
      ) : (
        <WorksGrid oeuvres={oeuvresFiltrees} {...handlers} />
      )}
    </>
  );
}
