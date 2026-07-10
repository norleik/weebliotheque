import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useFriends(userId) {
  const [relations, setRelations] = useState([]);
  const [chargement, setChargement] = useState(true);

  const rafraichir = useCallback(async () => {
    if (!userId) {
      setRelations([]);
      setChargement(false);
      return;
    }
    const { data, error } = await supabase
      .from('friendships')
      .select(
        'id, demandeur, destinataire, statut, created_at, profil_demandeur:profiles!demandeur(id, pseudo, avatar), profil_destinataire:profiles!destinataire(id, pseudo, avatar)',
      )
      .or(`demandeur.eq.${userId},destinataire.eq.${userId}`);

    if (error) {
      console.error(error);
      setChargement(false);
      return;
    }
    setRelations(data ?? []);
    setChargement(false);
  }, [userId]);

  useEffect(() => {
    rafraichir();
  }, [rafraichir]);

  const amis = relations
    .filter((r) => r.statut === 'accepte')
    .map((r) => ({
      friendshipId: r.id,
      ...(r.demandeur === userId ? r.profil_destinataire : r.profil_demandeur),
    }));

  const demandesRecues = relations
    .filter((r) => r.statut === 'en_attente' && r.destinataire === userId)
    .map((r) => ({ friendshipId: r.id, ...r.profil_demandeur }));

  const demandesEnvoyees = relations
    .filter((r) => r.statut === 'en_attente' && r.demandeur === userId)
    .map((r) => ({ friendshipId: r.id, ...r.profil_destinataire }));

  async function rechercherUtilisateurs(query) {
    const q = query.trim();
    if (!q) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('id, pseudo, avatar')
      .ilike('pseudo', `%${q}%`)
      .neq('id', userId)
      .limit(10);
    if (error) {
      console.error(error);
      return [];
    }
    return data ?? [];
  }

  // Statut d'une relation avec un utilisateur donné : 'ami' | 'envoyee' | 'recue' | null
  function statutRelation(autreId) {
    const rel = relations.find((r) => r.demandeur === autreId || r.destinataire === autreId);
    if (!rel) return null;
    if (rel.statut === 'accepte') return 'ami';
    return rel.demandeur === userId ? 'envoyee' : 'recue';
  }

  async function envoyerDemande(destinataireId) {
    if (statutRelation(destinataireId)) return;
    const { error } = await supabase
      .from('friendships')
      .insert({ demandeur: userId, destinataire: destinataireId });
    if (error) return console.error(error);
    await rafraichir();
  }

  async function accepterDemande(friendshipId) {
    const { error } = await supabase
      .from('friendships')
      .update({ statut: 'accepte' })
      .eq('id', friendshipId);
    if (error) return console.error(error);
    await rafraichir();
  }

  async function retirerRelation(friendshipId) {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
    if (error) return console.error(error);
    await rafraichir();
  }

  return {
    amis,
    demandesRecues,
    demandesEnvoyees,
    chargement,
    rechercherUtilisateurs,
    statutRelation,
    envoyerDemande,
    accepterDemande,
    retirerRelation,
    rafraichir,
  };
}
