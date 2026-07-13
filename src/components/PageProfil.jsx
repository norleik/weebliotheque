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
  const [recherche, setRecherche] = useState('');
  const {
    library,
    incrementerProgression,
    decrementerProgression,
    toutMarquer,
    incrementerRevisionnage,
    decrementerRevisionnage,
    definirNote,
    definirStatut,
    retirerOeuvre,
    importerOeuvres,
    resynchroniserVersMAL,
  } = bibliotheque;
  const stats = useStats(userId, library);

  const ongletsAvecTotal = onglets.map((onglet) => ({
    ...onglet,
    total: onglet.type ? library.filter((o) => o.type === onglet.type).length : library.length,
  }));

  const estCollection = ongletActif === 'collection';
  const typeActif = onglets.find((o) => o.id === ongletActif)?.type;
  const rechercheNormalisee = recherche.trim().toLowerCase();
  const correspond = (oeuvre) =>
    !rechercheNormalisee || oeuvre.titre.toLowerCase().includes(rechercheNormalisee);
  const oeuvresFiltrees = library.filter(
    (oeuvre) =>
      oeuvre.type === typeActif && (filtreStatut === 'tous' || oeuvre.statut === filtreStatut) && correspond(oeuvre),
  );
  const collectionFiltree = library.filter(correspond);

  const handlers = {
    onIncrementer: incrementerProgression,
    onDecrementer: decrementerProgression,
    onToutMarquer: toutMarquer,
    onIncrementerRevisionnage: incrementerRevisionnage,
    onDecrementerRevisionnage: decrementerRevisionnage,
    onDefinirNote: definirNote,
    onDefinirStatut: definirStatut,
    onRetirer: retirerOeuvre,
  };

  return (
    <>
      <ProfileBanner utilisateur={utilisateur} onModifier={onModifier} onUploaderAvatar={onUploaderAvatar} />
      <ImportMAL onImporter={importerOeuvres} onResynchroniser={resynchroniserVersMAL} />
      <ImportTVTime onImporter={importerOeuvres} />
      <StatsGrid stats={stats} />
      <ListesBande userId={userId} proprietaire library={library} />
      <LibraryTabs
        onglets={ongletsAvecTotal}
        ongletActif={ongletActif}
        onChangeOnglet={setOngletActif}
        filtreStatut={filtreStatut}
        onChangeFiltre={estCollection ? undefined : setFiltreStatut}
        recherche={recherche}
        onChangeRecherche={setRecherche}
      />
      {estCollection ? (
        <Collection oeuvres={collectionFiltree} {...handlers} />
      ) : typeActif === 'ANIMÉ' ? (
        <GrilleAnimes oeuvres={oeuvresFiltrees} {...handlers} />
      ) : (
        <WorksGrid oeuvres={oeuvresFiltrees} {...handlers} />
      )}
    </>
  );
}
