import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const TIERS = ['S', 'A', 'B', 'C', 'D', 'F'];

export function useTierlists(groupId) {
  const [tierlists, setTierlists] = useState([]);
  const [chargement, setChargement] = useState(true);

  const rafraichir = useCallback(async () => {
    if (!groupId) {
      setTierlists([]);
      setChargement(false);
      return;
    }
    const { data, error } = await supabase
      .from('tierlists')
      .select('id, titre, createur, created_at, profiles(pseudo)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setChargement(false);
      return;
    }
    setTierlists(data ?? []);
    setChargement(false);
  }, [groupId]);

  useEffect(() => {
    rafraichir();
  }, [rafraichir]);

  // Œuvres vues par au moins 2 membres du groupe — le pool de départ.
  async function oeuvresCommunes() {
    const { data: membres } = await supabase.from('group_members').select('user_id').eq('group_id', groupId);
    const ids = (membres ?? []).map((m) => m.user_id);
    if (ids.length < 2) return [];

    const { data: entrees, error } = await supabase
      .from('library_entries')
      .select('mal_id, type, titre, image, url, user_id')
      .in('user_id', ids);
    if (error) {
      console.error(error);
      return [];
    }

    const parOeuvre = new Map();
    for (const e of entrees ?? []) {
      if (!parOeuvre.has(e.mal_id)) parOeuvre.set(e.mal_id, { ...e, vue_par: new Set() });
      parOeuvre.get(e.mal_id).vue_par.add(e.user_id);
    }
    return [...parOeuvre.values()].filter((o) => o.vue_par.size >= 2);
  }

  async function creerTierlist(titre) {
    const communes = await oeuvresCommunes();
    if (communes.length === 0) {
      throw new Error(
        "Aucune œuvre vue par au moins 2 membres du groupe pour l'instant — impossible de démarrer une tierlist.",
      );
    }

    const { data: userData } = await supabase.auth.getUser();
    const { data: tierlist, error: erreurTierlist } = await supabase
      .from('tierlists')
      .insert({ group_id: groupId, titre, createur: userData.user.id })
      .select()
      .single();
    if (erreurTierlist) throw erreurTierlist;

    const items = communes.map((o) => ({
      tierlist_id: tierlist.id,
      mal_id: o.mal_id,
      type: o.type,
      titre: o.titre,
      image: o.image,
      url: o.url,
    }));
    const { error: erreurItems } = await supabase.from('tierlist_items').insert(items);
    if (erreurItems) throw erreurItems;

    await rafraichir();
    return tierlist.id;
  }

  async function supprimerTierlist(tierlistId) {
    const { error } = await supabase.from('tierlists').delete().eq('id', tierlistId);
    if (error) return console.error(error);
    await rafraichir();
  }

  return { tierlists, chargement, creerTierlist, supprimerTierlist, rafraichir };
}

export { TIERS };
