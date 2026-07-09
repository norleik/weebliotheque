import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

export default function Auth() {
  const { connexion, inscription } = useAuth();
  const [mode, setMode] = useState('connexion');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState(null);
  const [info, setInfo] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErreur(null);
    setInfo(null);
    setEnvoi(true);
    try {
      if (mode === 'connexion') {
        await connexion(email, motDePasse);
      } else {
        await inscription(email, motDePasse);
        setInfo('Compte créé — vérifie tes mails pour confirmer ton adresse, puis connecte-toi.');
      }
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="auth-ecran">
      <div className="auth-carte">
        <a href="#" className="logo">
          <span className="w">Weeb</span>liothèque
          <span className="logo-kata">ウィーブ・図書館</span>
        </a>

        <div className="auth-onglets">
          <button
            className={`auth-onglet${mode === 'connexion' ? ' actif' : ''}`}
            onClick={() => setMode('connexion')}
            type="button"
          >
            Connexion
          </button>
          <button
            className={`auth-onglet${mode === 'inscription' ? ' actif' : ''}`}
            onClick={() => setMode('inscription')}
            type="button"
          >
            Inscription
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'connexion' ? 'current-password' : 'new-password'}
            />
          </label>

          {erreur && <p className="auth-erreur">{erreur}</p>}
          {info && <p className="auth-info">{info}</p>}

          <button className="auth-submit" type="submit" disabled={envoi}>
            {mode === 'connexion' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
}
