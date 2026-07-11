import { useState } from 'react';
import Recherche from './Recherche';
import Avatar from './Avatar';
import './Header.css';

const LIENS_NAV = [
  { id: 'profil', label: 'Profil' },
  { id: 'amis', label: 'Amis' },
  { id: 'groupes', label: 'Communauté' },
  { id: 'decouvrir', label: 'Découvrir' },
  { id: 'calendrier', label: 'Calendrier' },
];

export default function Header({
  initiale = 'L',
  avatarUrl,
  pageActive,
  onNaviguer,
  estDansBiblio,
  onAjouter,
  onDeconnexion,
  theme,
  onBasculerTheme,
}) {
  const [menuOuvert, setMenuOuvert] = useState(false);

  function naviguer(id) {
    onNaviguer(id);
    setMenuOuvert(false);
  }

  return (
    <header>
      <div className="header-in">
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); naviguer('profil'); }}>
          <span className="w">Weeb</span>liothèque
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
        <Recherche estDansBiblio={estDansBiblio} onAjouter={onAjouter} />
        <button
          className="btn-theme"
          onClick={onBasculerTheme}
          title={theme === 'sombre' ? 'Passer au thème clair' : 'Passer au thème sombre'}
        >
          {theme === 'sombre' ? '☀️' : '🌙'}
        </button>
        <Avatar
          url={avatarUrl}
          pseudo={initiale}
          title="Mon profil"
          onClick={() => onNaviguer('profil')}
        />
        <button className="btn-deconnexion" onClick={onDeconnexion} title="Se déconnecter">
          🚪
        </button>
      </div>
    </header>
  );
}
