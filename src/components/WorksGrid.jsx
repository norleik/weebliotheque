import './WorksGrid.css';

const UNITE = {
  ANIMÉ: { pluriel: 'Épisodes', singulier: 'Épisode', verbe: 'vu' },
  MANGA: { pluriel: 'Chapitres', singulier: 'Chapitre', verbe: 'lu' },
  MANHWA: { pluriel: 'Chapitres', singulier: 'Chapitre', verbe: 'lu' },
  'LIGHT NOVEL': { pluriel: 'Tomes', singulier: 'Tome', verbe: 'lu' },
};

const DEGRADES = ['cv-1', 'cv-2', 'cv-3', 'cv-4', 'cv-5', 'cv-6', 'cv-7', 'cv-8'];
const NOTES_POSSIBLES = Array.from({ length: 10 }, (_, i) => i + 1);

function Etoiles({ n }) {
  return (
    <span className="etoiles">
      {'★'.repeat(n)}
      <span className="off">{'★'.repeat(5 - n)}</span>
    </span>
  );
}

function NoteSelect({ note, onDefinirNote }) {
  return (
    <select
      className={`note-c${note ? '' : ' vide'}`}
      value={note ?? ''}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onDefinirNote(Number(e.target.value))}
    >
      <option value="" disabled>
        Noter
      </option>
      {NOTES_POSSIBLES.map((valeur) => (
        <option key={valeur} value={valeur}>
          ★ {valeur}
        </option>
      ))}
    </select>
  );
}

function WorkCard({ oeuvre, lectureSeule, onIncrementer, onDefinirNote, onRetirer }) {
  const { malId, titre, type, note, image, total, progression, statut, url } = oeuvre;
  const unite = UNITE[type] ?? UNITE.MANGA;
  const fini = statut === 'termine';
  const degrade = DEGRADES[malId % DEGRADES.length];

  return (
    <article className={`oeuvre${fini ? ' fini' : ''}`}>
      <div
        className={`cover${!image ? ` ${degrade}` : ''}`}
        style={image ? { backgroundImage: `url(${image})` } : undefined}
      >
        <span className="type">{type}</span>
        {lectureSeule ? (
          note != null && <span className="note-c statique">★ {note}</span>
        ) : (
          <NoteSelect note={note} onDefinirNote={(v) => onDefinirNote(malId, v)} />
        )}
        <h3>{titre}</h3>
      </div>
      <div className="oeuvre-corps">
        <div className="prog-lab">
          {fini ? (
            <>
              <span>Terminé</span>
              <Etoiles n={note ? Math.round(note / 2) : 0} />
            </>
          ) : (
            <>
              <span>{unite.pluriel}</span>
              <b>{total ? `${progression} / ${total}` : progression}</b>
            </>
          )}
        </div>
        <div className="barre">
          <i style={{ width: `${total ? Math.min(100, Math.round((progression / total) * 100)) : fini ? 100 : 0}%` }} />
        </div>
        {lectureSeule || fini ? (
          <a className="btn-suivi" href={url} target="_blank" rel="noreferrer">
            {fini ? 'Revoir la fiche' : 'Voir la fiche'}
          </a>
        ) : (
          <button className="btn-suivi" onClick={() => onIncrementer(malId)}>
            {unite.singulier} {progression + 1} {unite.verbe} ✓
          </button>
        )}
        {!lectureSeule && (
          <div className="liens-secondaires">
            {!fini && (
              <a className="lien-fiche" href={url} target="_blank" rel="noreferrer">
                Voir la fiche ↗
              </a>
            )}
            <button className="btn-retirer" onClick={() => onRetirer(malId)}>
              Retirer
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function WorksGrid({ oeuvres, lectureSeule = false, onIncrementer, onDefinirNote, onRetirer }) {
  if (oeuvres.length === 0) {
    return (
      <div className="grille-vide">
        {lectureSeule ? 'Aucune œuvre ici.' : 'Aucune œuvre ici — utilise la recherche pour en ajouter.'}
      </div>
    );
  }

  return (
    <div className="grille">
      {oeuvres.map((oeuvre) => (
        <WorkCard
          key={oeuvre.malId}
          oeuvre={oeuvre}
          lectureSeule={lectureSeule}
          onIncrementer={onIncrementer}
          onDefinirNote={onDefinirNote}
          onRetirer={onRetirer}
        />
      ))}
    </div>
  );
}
