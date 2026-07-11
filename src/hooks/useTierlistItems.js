import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Charge les œuvres d'une tierlist et reste synchronisé en direct : tout
// déplacement fait par un autre membre du groupe arrive via Supabase
// Realtime, sans avoir besoin de rafraîchir la page.
export function useTierlistItems(tierlistId) {
  const [items, setItems] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!tierlistId) {
      setItems([]);
      setChargement(false);
      return;
    }

    let annule = false;
    setChargement(true);

    supabase
      .from('tierlist_items')
      .select('*')
      .eq('tierlist_id', tierlistId)
      .then(({ data, error }) => {
        if (annule) return;
        if (error) console.error(error);
        setItems(data ?? []);
        setChargement(false);
      });

    const canal = supabase
      .channel(`tierlist-${tierlistId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tierlist_items', filter: `tierlist_id=eq.${tierlistId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setItems((prev) => prev.filter((i) => i.id !== payload.old.id));
          } else {
            setItems((prev) => {
              const existe = prev.some((i) => i.id === payload.new.id);
              return existe
                ? prev.map((i) => (i.id === payload.new.id ? payload.new : i))
                : [...prev, payload.new];
            });
          }
        },
      )
      .subscribe();

    return () => {
      annule = true;
      supabase.removeChannel(canal);
    };
  }, [tierlistId]);

  // Optimiste : on met à jour l'état local tout de suite (fluide pour la
  // personne qui glisse la carte), le serveur confirme via le canal realtime.
  async function deplacerItem(itemId, tier) {
    const positionSuivante = items.filter((i) => i.tier === tier).length;
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, tier, position: positionSuivante } : i)));

    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('tierlist_items')
      .update({ tier, position: positionSuivante, updated_by: userData.user.id, updated_at: new Date().toISOString() })
      .eq('id', itemId);
    if (error) console.error(error);
  }

  return { items, chargement, deplacerItem };
}
