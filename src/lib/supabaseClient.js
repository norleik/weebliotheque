import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquantes — copie .env.example vers .env.local et renseigne ton projet Supabase.',
  );
}

export const supabase = createClient(url, anonKey);
