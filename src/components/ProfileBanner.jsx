import { useRef, useState } from 'react';
import Avatar from './Avatar';
import './ProfileBanner.css';

export default function ProfileBanner({ utilisateur, onModifier, onUploaderAvatar }) {
  const { nom, pseudo, depuis, initiale, avatarUrl, badges } = utilisateur;
  const fileRef = useRef(null);
  const [envoi, setEnvoi] = useState(false);

  async function onFichierChoisi(e) {
    const fichier = e.target.files?.[0];
    e.target.value = ''; // permet de re-choisir le même fichier plus tard
    if (!fichier || !onUploaderAvatar) return;
    setEnvoi(true);
    try {
      await onUploaderAvatar(fichier);
    } catch (err) {
      console.error(err);
      window.alert(err.message || "Impossible d'envoyer cette photo.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <section className="profil-banner">
      <div className="banner-haut">
        <span className="kata">プロフィール</span>
      </div>
      <div className="banner-corps">
        <div className="avatar-zone">
          <Avatar url={avatarUrl} pseudo={nom || initiale} />
          {onUploaderAvatar && (
            <>
              <button
                type="button"
                className="btn-avatar-edit"
                onClick={() => fileRef.current?.click()}
                disabled={envoi}
                title="Changer la photo de profil"
              >
                {envoi ? '…' : '📷'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFichierChoisi} />
            </>
          )}
        </div>
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
