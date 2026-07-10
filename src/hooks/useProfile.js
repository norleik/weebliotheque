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

  async function uploaderAvatar(fichier) {
    if (!userId) return;
    if (!fichier.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image.');
    }
    if (fichier.size > 5 * 1024 * 1024) {
      throw new Error('Image trop lourde (5 Mo max).');
    }

    const extension = fichier.name.split('.').pop() || 'jpg';
    const chemin = `${userId}/avatar.${extension}`;

    const { error: erreurUpload } = await supabase.storage
      .from('avatars')
      .upload(chemin, fichier, { upsert: true, cacheControl: '3600' });
    if (erreurUpload) throw erreurUpload;

    const { data } = supabase.storage.from('avatars').getPublicUrl(chemin);
    const url = `${data.publicUrl}?t=${Date.now()}`;

    const { error } = await supabase.from('profiles').update({ avatar: url }).eq('id', userId);
    if (error) throw error;
    setProfile((p) => ({ ...p, avatar: url }));
  }

  return { profile, renommer, uploaderAvatar };
}
