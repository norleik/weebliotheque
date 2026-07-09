import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { calculerStats } from '../lib/stats';

export function useStats(userId, library) {
  const [episodesCeMois, setEpisodesCeMois] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let annule = false;

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    supabase
      .from('activity')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', 'ANIMÉ')
      .in('action', ['progression', 'termine'])
      .gte('created_at', debutMois.toISOString())
      .then(({ count, error }) => {
        if (annule) return;
        if (error) {
          console.error(error);
          setEpisodesCeMois(0);
          return;
        }
        setEpisodesCeMois(count ?? 0);
      });

    return () => {
      annule = true;
    };
  }, [userId, library]);

  return useMemo(() => calculerStats(library, episodesCeMois), [library, episodesCeMois]);
}
