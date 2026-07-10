import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function depuisLigne(ligne) {
  return {
    malId: ligne.mal_id,
    type: ligne.type,
    titre: ligne.titre,
    image: ligne.image,
    total: ligne.total,
    url: ligne.url,
    dureeEpisode: ligne.duree_episode,
    progression: ligne.progression,
    note: ligne.note,
    statut: ligne.statut,
    dateAjout: ligne.date_ajout,
  };
}

export function useLibrary(userId) {
  const [library, setLibrary] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLibrary([]);
      setChargement(false);
      return;
    }

    let annule = false;
    setChargement(true);

    supabase
      .from('library_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date_ajout', { ascending: true })
      .then(({ data, error }) => {
        if (annule) return;
        if (error) console.error(error);
        setLibrary((data ?? []).map(depuisLigne));
        setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [userId]);

  function estDansBiblio(malId) {
    return library.some((o) => o.malId === malId);
  }

  // Publie une ligne d'activité (feed amis/groupes) — non bloquant.
  function enregistrerActivite(action, oeuvre, detail = null) {
    supabase
      .from('activity')
      .insert({
        user_id: userId,
        action,
        mal_id: oeuvre.malId,
        titre: oeuvre.titre,
        type: oeuvre.type,
        detail,
      })
      .then(({ error }) => {
        if (error) console.error(error);
      });
  }

  async function ajouterOeuvre(oeuvre) {
    if (!userId) return;
    const { data, error } = await supabase
      .from('library_entries')
      .insert({
        user_id: userId,
        mal_id: oeuvre.malId,
        type: oeuvre.type,
        titre: oeuvre.titre,
        image: oeuvre.image,
        total: oeuvre.total,
        url: oeuvre.url,
        duree_episode: oeuvre.dureeEpisode ?? null,
      })
      .select()
      .single();

    if (error) {
      if (error.code !== '23505') console.error(error);
      return;
    }
    setLibrary((lib) => [...lib, depuisLigne(data)]);
    enregistrerActivite('ajout', oeuvre);
  }

  // Import en masse (liste MAL) : n'écrase jamais une entrée existante et ne
  // publie pas d'activité (pour ne pas inonder le fil des groupes).
  async function importerOeuvres(oeuvres) {
    if (!userId || !oeuvres.length) return 0;

    const lignes = oeuvres.map((o) => ({
      user_id: userId,
      mal_id: o.malId,
      type: o.type,
      titre: o.titre,
      image: o.image,
      total: o.total,
      url: o.url,
      duree_episode: o.dureeEpisode ?? null,
      progression: o.progression ?? 0,
      note: o.note ?? null,
      statut: o.statut ?? 'en_cours',
    }));

    const { error } = await supabase
      .from('library_entries')
      .upsert(lignes, { onConflict: 'user_id,mal_id', ignoreDuplicates: true });
    if (error) {
      console.error(error);
      throw error;
    }

    const { data } = await supabase
      .from('library_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date_ajout', { ascending: true });
    setLibrary((data ?? []).map(depuisLigne));
    return oeuvres.length;
  }

  async function retirerOeuvre(malId) {
    if (!userId) return;
    const { error } = await supabase
      .from('library_entries')
      .delete()
      .eq('user_id', userId)
      .eq('mal_id', malId);

    if (error) return console.error(error);
    setLibrary((lib) => lib.filter((o) => o.malId !== malId));
  }

  async function incrementerProgression(malId) {
    const entree = library.find((o) => o.malId === malId);
    if (!entree || entree.statut === 'termine') return;

    const suivant = (entree.progression || 0) + 1;
    const termine = entree.total ? suivant >= entree.total : false;
    const patch = { progression: termine ? entree.total : suivant, statut: termine ? 'termine' : 'en_cours' };

    const { error } = await supabase
      .from('library_entries')
      .update(patch)
      .eq('user_id', userId)
      .eq('mal_id', malId);

    if (error) return console.error(error);
    setLibrary((lib) => lib.map((o) => (o.malId === malId ? { ...o, ...patch } : o)));
    if (termine) {
      enregistrerActivite('termine', entree);
    } else {
      enregistrerActivite('progression', entree, String(suivant));
    }
  }

  async function definirStatut(malId, statut) {
    const entree = library.find((o) => o.malId === malId);
    if (!entree || entree.statut === statut) return;

    const patch = { statut };
    if (statut === 'termine') patch.progression = entree.total ?? entree.progression;
    if (statut === 'pas_commence') patch.progression = 0;

    const { error } = await supabase
      .from('library_entries')
      .update(patch)
      .eq('user_id', userId)
      .eq('mal_id', malId);

    if (error) return console.error(error);
    setLibrary((lib) => lib.map((o) => (o.malId === malId ? { ...o, ...patch } : o)));
    if (statut === 'termine') enregistrerActivite('termine', entree);
    if (statut === 'arrete') enregistrerActivite('arrete', entree);
  }

  async function definirNote(malId, note) {
    const entree = library.find((o) => o.malId === malId);
    const { error } = await supabase
      .from('library_entries')
      .update({ note })
      .eq('user_id', userId)
      .eq('mal_id', malId);

    if (error) return console.error(error);
    setLibrary((lib) => lib.map((o) => (o.malId === malId ? { ...o, note } : o)));
    if (entree) enregistrerActivite('note', entree, String(note));
  }

  return {
    library,
    chargement,
    estDansBiblio,
    ajouterOeuvre,
    importerOeuvres,
    retirerOeuvre,
    incrementerProgression,
    definirStatut,
    definirNote,
  };
}
