import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useLists(ownerId) {
  const [listes, setListes] = useState([]);
  const [chargement, setChargement] = useState(true);

  const rafraichir = useCallback(async () => {
    if (!ownerId) {
      setListes([]);
      setChargement(false);
      return;
    }
    const { data, error } = await supabase
      .from('lists')
      .select('id, nom, created_at, list_items(id, mal_id, type, titre, image, url, position)')
      .eq('user_id', ownerId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(error);
      setChargement(false);
      return;
    }
    setListes(
      (data ?? []).map((l) => ({
        id: l.id,
        nom: l.nom,
        items: [...(l.list_items ?? [])].sort((a, b) => a.position - b.position),
      })),
    );
    setChargement(false);
  }, [ownerId]);

  useEffect(() => {
    rafraichir();
  }, [rafraichir]);

  async function creerListe(nom) {
    const { error } = await supabase.from('lists').insert({ user_id: ownerId, nom });
    if (error) throw error;
    await rafraichir();
  }

  async function supprimerListe(listId) {
    const { error } = await supabase.from('lists').delete().eq('id', listId);
    if (error) return console.error(error);
    await rafraichir();
  }

  async function ajouterItem(listId, oeuvre) {
    const liste = listes.find((l) => l.id === listId);
    const position = liste ? liste.items.length : 0;
    const { error } = await supabase.from('list_items').insert({
      list_id: listId,
      mal_id: oeuvre.malId,
      type: oeuvre.type,
      titre: oeuvre.titre,
      image: oeuvre.image,
      url: oeuvre.url,
      position,
    });
    if (error) {
      if (error.code !== '23505') console.error(error);
      return;
    }
    await rafraichir();
  }

  async function retirerItem(itemId) {
    const { error } = await supabase.from('list_items').delete().eq('id', itemId);
    if (error) return console.error(error);
    await rafraichir();
  }

  // Échange la position d'un élément avec son voisin (direction -1 = monter, +1 = descendre).
  async function deplacerItem(listId, index, direction) {
    const liste = listes.find((l) => l.id === listId);
    if (!liste) return;
    const a = liste.items[index];
    const b = liste.items[index + direction];
    if (!a || !b) return;

    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from('list_items').update({ position: b.position }).eq('id', a.id),
      supabase.from('list_items').update({ position: a.position }).eq('id', b.id),
    ]);
    if (e1 || e2) console.error(e1 ?? e2);
    await rafraichir();
  }

  return { listes, chargement, creerListe, supprimerListe, ajouterItem, retirerItem, deplacerItem, rafraichir };
}
