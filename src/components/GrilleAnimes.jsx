import { useState } from 'react';
import WorksGrid, { WorkCard } from './WorksGrid';
import { grouperSaisons } from '../lib/saisons';
import './GrilleAnimes.css';

function DossierCard({ dossier, onOuvrir }) {
  const totalEpisodes = dossier.items.reduce((somme, o) => somme + (o.total || 0), 0);
  const episodesVus = dossier.items.reduce((somme, o) => somme + (o.progression || 0), 0);
  const pourcentage = totalEpisodes ? Math.min(100, Math.round((episodesVus / totalEpisodes) * 100)) : 0;

  return (
    <article className="oeuvre dossier" onClick={onOuvrir}>
      <div
        className="cover"
        style={dossier.image ? { backgroundImage: `url(${dossier.image})` } : undefined}
      >
        <span className="type">DOSSIER</span>
        <span className="note-c statique">📁 {dossier.items.length}</span>
        <h3>{dossier.nom}</h3>
      </div>
      <div className="oeuvre-corps">
        <div className="prog-lab">
          <span>Épisodes</span>
          <b>
            {episodesVus} / {totalEpisodes || '?'}
          </b>
        </div>
        <div className="barre">
          <i style={{ width: `${pourcentage}%` }} />
        </div>
        <button className="btn-suivi">
          Ouvrir · {dossier.items.length} titre{dossier.items.length > 1 ? 's' : ''}
        </button>
      </div>
    </article>
  );
}

// Grille des animés : les saisons/films d'une même série sont regroupés en dossiers.
export default function GrilleAnimes({ oeuvres, lectureSeule = false, ...handlers }) {
  const [dossierOuvert, setDossierOuvert] = useState(null);
  const elements = grouperSaisons(oeuvres);
  const ouvert = elements.find((el) => el.genre === 'dossier' && el.cle === dossierOuvert);

  if (ouvert) {
    return (
      <div>
        <div className="dossier-entete">
          <button className="btn-retour" onClick={() => setDossierOuvert(null)}>
            ← Tous les animés
          </button>
          <h3 className="dossier-titre">📁 {ouvert.nom}</h3>
        </div>
        <WorksGrid oeuvres={ouvert.items} lectureSeule={lectureSeule} {...handlers} />
      </div>
    );
  }

  if (oeuvres.length === 0) {
    return <WorksGrid oeuvres={[]} lectureSeule={lectureSeule} />;
  }

  return (
    <div className="grille">
      {elements.map((el) =>
        el.genre === 'dossier' ? (
          <DossierCard key={el.cle} dossier={el} onOuvrir={() => setDossierOuvert(el.cle)} />
        ) : (
          <WorkCard key={el.oeuvre.malId} oeuvre={el.oeuvre} lectureSeule={lectureSeule} {...handlers} />
        ),
      )}
    </div>
  );
}
