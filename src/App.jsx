import { useState } from 'react';
import Header from './components/Header';
import PageProfil from './components/PageProfil';
import PageAmis from './components/PageAmis';
import PageGroupes from './components/PageGroupes';
import PageDecouvrir from './components/PageDecouvrir';
import Auth from './components/Auth';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { useLibrary } from './hooks/useLibrary';
import { useFriends } from './hooks/useFriends';
import { useGroups } from './hooks/useGroups';
import './App.css';

function App() {
  const { utilisateur: authUser, chargement: chargementAuth, deconnexion } = useAuth();
  const { profile, renommer } = useProfile(authUser?.id);
  const bibliotheque = useLibrary(authUser?.id);
  const friends = useFriends(authUser?.id);
  const groups = useGroups(authUser?.id);
  const [page, setPage] = useState('profil');

  if (chargementAuth) return null;
  if (!authUser) return <Auth />;

  const nomAffiche = profile?.pseudo ?? authUser.email.split('@')[0];
  const depuis = new Date(authUser.created_at).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  const utilisateurAffiche = {
    nom: nomAffiche,
    pseudo: `@${nomAffiche}`,
    depuis,
    initiale: nomAffiche[0]?.toUpperCase() ?? '?',
    badges: [
      `👥 ${friends.amis.length} ami${friends.amis.length > 1 ? 's' : ''}`,
      `🏠 ${groups.groupes.length} groupe${groups.groupes.length > 1 ? 's' : ''}`,
    ],
  };

  function onModifierProfil() {
    const nouveauPseudo = window.prompt('Nouveau pseudo :', nomAffiche);
    if (nouveauPseudo && nouveauPseudo.trim()) renommer(nouveauPseudo.trim());
  }

  return (
    <>
      <Header
        initiale={utilisateurAffiche.initiale}
        pageActive={page}
        onNaviguer={setPage}
        estDansBiblio={bibliotheque.estDansBiblio}
        onAjouter={bibliotheque.ajouterOeuvre}
        onDeconnexion={deconnexion}
      />
      <div className="page">
        {page === 'profil' && (
          <PageProfil
            userId={authUser.id}
            utilisateur={utilisateurAffiche}
            onModifier={onModifierProfil}
            bibliotheque={bibliotheque}
          />
        )}
        {page === 'amis' && <PageAmis friends={friends} />}
        {page === 'groupes' && <PageGroupes moi={authUser.id} groups={groups} />}
        {page === 'decouvrir' && (
          <PageDecouvrir estDansBiblio={bibliotheque.estDansBiblio} onAjouter={bibliotheque.ajouterOeuvre} />
        )}
      </div>
      <div className="badge-maquette">REACT · SUPABASE</div>
    </>
  );
}

export default App;
