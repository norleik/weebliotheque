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

  // provider: 'google' | 'discord' — redirige vers le fournisseur, puis revient
  // sur le site avec la session déjà active (Supabase gère tout l'échange).
  async function connexionOAuth(provider) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  const valeur = {
    session,
    utilisateur: session?.user ?? null,
    chargement: session === undefined,
    inscription,
    connexion,
    connexionOAuth,
    deconnexion,
  };

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
