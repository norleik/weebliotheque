import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: abonnement } = supabase.auth.onAuthStateChange((_event, nouvelleSession) => {
      setSession(nouvelleSession);
    });

    return () => abonnement.subscription.unsubscribe();
  }, []);

  async function inscription(email, motDePasse) {
    const { error } = await supabase.auth.signUp({ email, password: motDePasse });
    if (error) throw error;
  }

  async function connexion(email, motDePasse) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
    if (error) throw error;
  }

  async function deconnexion() {
    await supabase.auth.signOut();
  }

  const valeur = {
    session,
    utilisateur: session?.user ?? null,
    chargement: session === undefined,
    inscription,
    connexion,
    deconnexion,
  };

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
