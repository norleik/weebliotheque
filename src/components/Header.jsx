import Recherche from './Recherche';
import './Header.css';

const LIENS_NAV = [
  { id: 'profil', label: 'Profil' },
  { id: 'amis', label: 'Amis' },
  { id: 'groupes', label: 'Groupes' },
  { id: 'decouvrir', label: 'Découvrir' },
  { id: 'calendrier', label: 'Calendrier' },
];

export default function Header({
  initiale = 'L',
  pageActive,
  onNaviguer,
  estDansBiblio,
  onAjouter,
  onDeconnexion,
  theme,
  onBasculerTheme,
}) {
  return (
    <header>
      <div className="header-in">
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); onNaviguer('profil'); }}>
          <span className="w">Weeb</span>liothèque
          <span className="logo-kata">ウィーブ・図書館</span>
        </a>
        <nav>
          {LIENS_NAV.map((lien) => (
            <button
              key={lien.id}
              className={`nav-item${lien.id === pageActive ? ' actif' : ''}${lien.inactif ? ' inactif' : ''}`}
              onClick={() => !lien.inactif && onNaviguer(lien.id)}
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
        <div className="avatar av-leo" title="Déconnexion" onClick={onDeconnexion}>
          {initiale}
        </div>
      </div>
    </header>
  );
}
