import { useState } from 'react';
import Recherche from './Recherche';
import './Header.css';

const LIENS_NAV = [
  { id: 'profil', label: 'Profil' },
  { id: 'amis', label: 'Amis' },
  { id: 'groupes', label: 'Communauté' },
  { id: 'decouvrir', label: 'Découvrir' },
  { id: 'calendrier', label: 'Calendrier' },
];

export default function Header({
  pageActive,
  onNaviguer,
  estDansBiblio,
  onAjouter,
  onDeconnexion,
  theme,
  onBasculerTheme,
}) {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [rechercheOuverte, setRechercheOuverte] = useState(false);

  function naviguer(id) {
    onNaviguer(id);
    setMenuOuvert(false);
  }

  return (
    <header>
      <div className={`header-in${rechercheOuverte ? ' recherche-ouverte' : ''}`}>
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); naviguer('profil'); }}>
          <span className="w">Weeb</span>
          <span className="logo-reste">liothèque</span>
          <span className="logo-kata">ウィーブ・図書館</span>
        </a>
        <button
          className="btn-menu-mobile"
          onClick={() => setMenuOuvert((o) => !o)}
          aria-label="Menu"
          aria-expanded={menuOuvert}
        >
          {menuOuvert ? '✕' : '☰'}
        </button>
        <nav className={menuOuvert ? 'ouvert' : ''}>
          {LIENS_NAV.map((lien) => (
            <button
              key={lien.id}
              className={`nav-item${lien.id === pageActive ? ' actif' : ''}${lien.inactif ? ' inactif' : ''}`}
              onClick={() => !lien.inactif && naviguer(lien.id)}
              title={lien.inactif ? 'Bientôt disponible' : undefined}
            >
              {lien.label}
            </button>
          ))}
        </nav>
        <button
          className="btn-recherche-mobile"
          onClick={() => setRechercheOuverte((o) => !o)}
          aria-label="Rechercher"
          aria-expanded={rechercheOuverte}
        >
          {rechercheOuverte ? '✕' : '🔍'}
        </button>
        <Recherche
          estDansBiblio={estDansBiblio}
          onAjouter={(oeuvre) => {
            onAjouter(oeuvre);
            setRechercheOuverte(false);
          }}
        />
        <button
          className="btn-theme"
          onClick={onBasculerTheme}
          title={theme === 'sombre' ? 'Passer au thème clair' : 'Passer au thème sombre'}
        >
          {theme === 'sombre' ? '☀️' : '🌙'}
        </button>
        <button className="btn-deconnexion" onClick={onDeconnexion} title="Se déconnecter">
          🚪
        </button>
      </div>
    </header>
  );
}
