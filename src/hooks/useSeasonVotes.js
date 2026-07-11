import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { saisonId } from '../api/mal';

export function useSeasonVotes(userId) {
  const [votes, setVotes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const saison = saisonId();

  const rafraichir = useCallback(async () => {
    const { data, error } = await supabase
      .from('season_votes')
      .select('id, user_id, mal_id, titre, image, url, profiles(pseudo)')
      .eq('saison', saison);

    if (error) {
      console.error(error);
      setChargement(false);
      return;
    }
    setVotes(data ?? []);
    setChargement(false);
  }, [saison]);

  useEffect(() => {
    rafraichir();
  }, [rafraichir]);

  const monVote = votes.find((v) => v.user_id === userId) ?? null;

  // Classement : nombre de votes par œuvre, du plus au moins voté.
  const classement = (() => {
    const parOeuvre = new Map();
    for (const v of votes) {
      if (!parOeuvre.has(v.mal_id)) {
        parOeuvre.set(v.mal_id, { malId: v.mal_id, titre: v.titre, image: v.image, url: v.url, votants: [] });
      }
      parOeuvre.get(v.mal_id).votants.push(v.profiles?.pseudo ?? '?');
    }
    return [...parOeuvre.values()].sort((a, b) => b.votants.length - a.votants.length);
  })();

  async function voter(oeuvre) {
    if (!userId) return;
    const ligne = {
      user_id: userId,
      saison,
      mal_id: oeuvre.malId,
      titre: oeuvre.titre,
      image: oeuvre.image,
      url: oeuvre.url,
    };
    const { error } = await supabase.from('season_votes').upsert(ligne, { onConflict: 'user_id,saison' });
    if (error) return console.error(error);
    await rafraichir();
  }

  async function retirerVote() {
    if (!userId) return;
    const { error } = await supabase.from('season_votes').delete().eq('user_id', userId).eq('saison', saison);
    if (error) return console.error(error);
    await rafraichir();
  }

  return { votes, classement, monVote, chargement, saison, voter, retirerVote, rafraichir };
}
