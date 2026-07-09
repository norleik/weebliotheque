import './ProfileBanner.css';

export default function ProfileBanner({ utilisateur, onModifier }) {
  const { nom, pseudo, depuis, initiale, badges } = utilisateur;

  return (
    <section className="profil-banner">
      <div className="banner-haut">
        <span className="kata">プロフィール</span>
      </div>
      <div className="banner-corps">
        <div className="avatar av-leo">{initiale}</div>
        <div className="identite">
          <h1>{nom}</h1>
          <span className="pseudo">
            {pseudo} · membre depuis {depuis}
          </span>
          <div className="badges">
            {badges.map((badge) => (
              <span key={badge} className="badge">
                {badge}
              </span>
            ))}
          </div>
        </div>
        <button className="btn-editer" onClick={onModifier}>
          Modifier le profil
        </button>
      </div>
    </section>
  );
}
