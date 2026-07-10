import { useEffect, useState } from 'react';
import LibraryTabs from './LibraryTabs';
import WorksGrid from './WorksGrid';
import GrilleAnimes from './GrilleAnimes';
import Collection from './Collection';
import ListesBande from './ListesBande';
import Avatar from './Avatar';
import { supabase } from '../lib/supabaseClient';
import { onglets } from '../data/profil';
import './PageAmis.css';

function ProfilAmi({ ami, onRetour }) {
  const [profil, setProfil] = useState(null);
  const [library, setLibrary] = useState([]);
  const [ongletActif, setOngletActif] = useState(onglets[0].id);

  useEffect(() => {
    let annule = false;

    supabase
      .from('profiles')
      .select('id, pseudo, avatar, created_at')
      .eq('id', ami.id)
      .single()
      .then(({ data, error }) => {
        if (annule) return;
        if (error) console.error(error);
        setProfil(data);
      });

    supabase
      .from('library_entries')
      .select('*')
      .eq('user_id', ami.id)
      .order('date_ajout', { ascending: true })
      .then(({ data, error }) => {
        if (annule) return;
        if (error) console.error(error);
        setLibrary(
          (data ?? []).map((l) => ({
            malId: l.mal_id,
            type: l.type,
            titre: l.titre,
            image: l.image,
            total: l.total,
            url: l.url,
            progression: l.progression,
            note: l.note,
            statut: l.statut,
          })),
        );
      });

    return () => {
      annule = true;
    };
  }, [ami.id]);

  const depuis = profil
    ? new Date(profil.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '…';

  const ongletsAvecTotal = onglets.map((onglet) => ({
    ...onglet,
    total: onglet.type ? library.filter((o) => o.type === onglet.type).length : library.length,
  }));
  const estCollection = ongletActif === 'collection';
  const typeActif = onglets.find((o) => o.id === ongletActif)?.type;
  const oeuvresFiltrees = library.filter((o) => o.type === typeActif);

  return (
    <div>
      <button className="btn-retour" onClick={onRetour}>
        ← Retour aux amis
      </button>
      <div className="ami-banner">
        <Avatar url={profil?.avatar} pseudo={ami.pseudo} />
        <div>
          <h2>{ami.pseudo}</h2>
          <span className="ami-depuis">membre depuis {depuis}</span>
        </div>
      </div>
      <ListesBande userId={ami.id} />
      <LibraryTabs
        onglets={ongletsAvecTotal}
        ongletActif={ongletActif}
        onChangeOnglet={setOngletActif}
        titre="Sa bibliothèque"
      />
      {estCollection ? (
        <Collection oeuvres={library} lectureSeule />
      ) : typeActif === 'ANIMÉ' ? (
        <GrilleAnimes oeuvres={oeuvresFiltrees} lectureSeule />
      ) : (
        <WorksGrid oeuvres={oeuvresFiltrees} lectureSeule />
      )}
    </div>
  );
}

export default function PageAmis({ friends }) {
  const {
    amis,
    demandesRecues,
    demandesEnvoyees,
    rechercherUtilisateurs,
    statutRelation,
    envoyerDemande,
    accepterDemande,
    retirerRelation,
  } = friends;

  const [requete, setRequete] = useState('');
  const [resultats, setResultats] = useState([]);
  const [amiSelectionne, setAmiSelectionne] = useState(null);

  useEffect(() => {
    if (!requete.trim()) {
      setResultats([]);
      return;
    }
    const delai = setTimeout(async () => {
      setResultats(await rechercherUtilisateurs(requete));
    }, 350);
    return () => clearTimeout(delai);
  }, [requete]); // eslint-disable-line react-hooks/exhaustive-deps

  if (amiSelectionne) {
    return <ProfilAmi ami={amiSelectionne} onRetour={() => setAmiSelectionne(null)} />;
  }

  return (
    <div className="page-amis">
      <section className="carte-sociale">
        <h2>Ajouter un ami</h2>
        <input
          type="text"
          className="champ-social"
          placeholder="Rechercher un pseudo…"
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
        />
        {resultats.length > 0 && (
          <ul className="liste-sociale">
            {resultats.map((u) => {
              const statut = statutRelation(u.id);
              return (
                <li key={u.id}>
                  <Avatar url={u.avatar} pseudo={u.pseudo} className="mini" />
                  <span className="pseudo-social">{u.pseudo}</span>
                  {statut === 'ami' && <span className="etat-social">Déjà ami ✓</span>}
                  {statut === 'envoyee' && <span className="etat-social">Demande envoyée</span>}
                  {statut === 'recue' && <span className="etat-social">Demande reçue — vois plus bas</span>}
                  {!statut && (
                    <button className="btn-social" onClick={() => envoyerDemande(u.id)}>
                      Ajouter
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {requete.trim() && resultats.length === 0 && <p className="vide-social">Aucun utilisateur trouvé.</p>}
      </section>

      {demandesRecues.length > 0 && (
        <section className="carte-sociale">
          <h2>Demandes reçues</h2>
          <ul className="liste-sociale">
            {demandesRecues.map((d) => (
              <li key={d.friendshipId}>
                <Avatar url={d.avatar} pseudo={d.pseudo} className="mini" />
                <span className="pseudo-social">{d.pseudo}</span>
                <button className="btn-social" onClick={() => accepterDemande(d.friendshipId)}>
                  Accepter
                </button>
                <button className="btn-social secondaire" onClick={() => retirerRelation(d.friendshipId)}>
                  Refuser
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {demandesEnvoyees.length > 0 && (
        <section className="carte-sociale">
          <h2>Demandes envoyées</h2>
          <ul className="liste-sociale">
            {demandesEnvoyees.map((d) => (
              <li key={d.friendshipId}>
                <Avatar url={d.avatar} pseudo={d.pseudo} className="mini" />
                <span className="pseudo-social">{d.pseudo}</span>
                <span className="etat-social">En attente…</span>
                <button className="btn-social secondaire" onClick={() => retirerRelation(d.friendshipId)}>
                  Annuler
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="carte-sociale">
        <h2>
          Mes amis <span className="compteur-social">{amis.length}</span>
        </h2>
        {amis.length === 0 ? (
          <p className="vide-social">Pas encore d'amis — recherche un pseudo ci-dessus pour envoyer une demande.</p>
        ) : (
          <ul className="liste-sociale">
            {amis.map((a) => (
              <li key={a.friendshipId}>
                <Avatar url={a.avatar} pseudo={a.pseudo} className="mini" />
                <span className="pseudo-social">{a.pseudo}</span>
                <button className="btn-social" onClick={() => setAmiSelectionne(a)}>
                  Voir le profil
                </button>
                <button className="btn-social secondaire" onClick={() => retirerRelation(a.friendshipId)}>
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
