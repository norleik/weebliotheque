import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useProfile(userId) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    let annule = false;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (annule) return;
        if (error) console.error(error);
        setProfile(data ?? null);
      });

    return () => {
      annule = true;
    };
  }, [userId]);

  async function renommer(pseudo) {
    if (!userId) return;
    const { error } = await supabase.from('profiles').update({ pseudo }).eq('id', userId);
    if (error) return console.error(error);
    setProfile((p) => ({ ...p, pseudo }));
  }

  return { profile, renommer };
}
