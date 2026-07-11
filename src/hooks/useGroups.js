import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useGroups(userId) {
  const [groupes, setGroupes] = useState([]);
  const [chargement, setChargement] = useState(true);

  const rafraichir = useCallback(async () => {
    if (!userId) {
      setGroupes([]);
      setChargement(false);
      return;
    }
    const { data, error } = await supabase
      .from('groups')
      .select('id, nom, code_invitation, createur, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error(error);
      setChargement(false);
      return;
    }
    setGroupes(data ?? []);
    setChargement(false);
  }, [userId]);

  useEffect(() => {
    rafraichir();
  }, [rafraichir]);

  async function creerGroupe(nom) {
    const { data, error } = await supabase.rpc('creer_groupe', { nom_groupe: nom });
    if (error) throw error;
    await rafraichir();
    return data;
  }

  async function rejoindreGroupe(code) {
    const { data, error } = await supabase.rpc('rejoindre_groupe', { code });
    if (error) throw error;
    await rafraichir();
    return data;
  }

  async function quitterGroupe(groupId) {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) return console.error(error);
    await rafraichir();
  }

  // Membres + fil d'activité + messages d'un groupe.
  async function chargerDetails(groupId) {
    const { data: membres, error: erreurMembres } = await supabase
      .from('group_members')
      .select('user_id, joined_at, profiles(id, pseudo, avatar)')
      .eq('group_id', groupId);

    if (erreurMembres) {
      console.error(erreurMembres);
      return { membres: [], fil: [], messages: [] };
    }

    const ids = (membres ?? []).map((m) => m.user_id);
    // Les notifications d'activité (ajout, épisode vu…) ne remontent que sur les
    // 5 derniers jours pour ne pas transformer le fil en liste sans fin — les
    // messages de chat, eux, ne sont pas concernés.
    const seuilActivite = new Date(Date.now() - 5 * 86400e3).toISOString();
    const [{ data: fil, error: erreurFil }, { data: messages, error: erreurMessages }] = await Promise.all([
      supabase
        .from('activity')
        .select('id, user_id, action, mal_id, titre, type, detail, created_at, profiles(pseudo, avatar)')
        .in('user_id', ids)
        .gte('created_at', seuilActivite)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('group_messages')
        .select(
          'id, user_id, contenu, created_at, profiles(pseudo, avatar), activity:activity_id(id, action, titre, type, detail, profiles(pseudo))',
        )
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (erreurFil) console.error(erreurFil);
    if (erreurMessages) console.error(erreurMessages);

    return {
      membres: (membres ?? []).map((m) => ({
        id: m.user_id,
        pseudo: m.profiles?.pseudo ?? '?',
        avatar: m.profiles?.avatar ?? null,
      })),
      fil: fil ?? [],
      messages: messages ?? [],
    };
  }

  async function envoyerMessage(groupId, contenu, activityId = null) {
    const { error } = await supabase.from('group_messages').insert({
      group_id: groupId,
      user_id: userId,
      contenu,
      activity_id: activityId,
    });
    if (error) throw error;
  }

  return {
    groupes,
    chargement,
    creerGroupe,
    rejoindreGroupe,
    quitterGroupe,
    chargerDetails,
    envoyerMessage,
    rafraichir,
  };
}
