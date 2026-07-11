import './WorksGrid.css';

const UNITE = {
  ANIMÉ: { pluriel: 'Épisodes', singulier: 'Épisode', verbe: 'vu' },
  MANGA: { pluriel: 'Chapitres', singulier: 'Chapitre', verbe: 'lu' },
  MANHWA: { pluriel: 'Chapitres', singulier: 'Chapitre', verbe: 'lu' },
  'LIGHT NOVEL': { pluriel: 'Tomes', singulier: 'Tome', verbe: 'lu' },
};

const DEGRADES = ['cv-1', 'cv-2', 'cv-3', 'cv-4', 'cv-5', 'cv-6', 'cv-7', 'cv-8'];
const NOTES_POSSIBLES = Array.from({ length: 10 }, (_, i) => i + 1);

export const STATUTS = [
  { id: 'pas_commence', label: 'Pas commencé' },
  { id: 'en_cours', label: 'En cours' },
  { id: 'en_pause', label: 'En pause' },
  { id: 'termine', label: 'Terminé' },
  { id: 'arrete', label: 'Arrêté' },
];

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

export function WorkCard({
  oeuvre,
  lectureSeule,
  onIncrementer,
  onDecrementer,
  onToutMarquer,
  onDefinirNote,
  onDefinirStatut,
  onRetirer,
}) {
  const { malId, titre, type, note, image, total, progression, statut, url, pasEncoreSorti } = oeuvre;
  const unite = UNITE[type] ?? UNITE.MANGA;
  const fini = statut === 'termine';
  const arrete = statut === 'arrete';
  const enPause = statut === 'en_pause';
  const degrade = DEGRADES[malId % DEGRADES.length];

  const labelProgression = pasEncoreSorti
    ? 'Pas encore diffusé'
    : arrete
      ? 'Arrêté'
      : enPause
        ? 'En pause'
        : statut === 'pas_commence'
          ? 'Pas commencé'
          : unite.pluriel;

  return (
    <article className={`oeuvre${fini ? ' fini' : ''}${arrete ? ' arrete' : ''}${enPause ? ' pause' : ''}`}>
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
              <span>{labelProgression}</span>
              <b>{total ? `${progression} / ${total}` : progression}</b>
            </>
          )}
        </div>
        <div className="barre">
          <i style={{ width: `${total ? Math.min(100, Math.round((progression / total) * 100)) : fini ? 100 : 0}%` }} />
        </div>
        {lectureSeule ? (
          <a className="btn-suivi" href={url} target="_blank" rel="noreferrer">
            {fini ? 'Revoir la fiche' : 'Voir la fiche'}
          </a>
        ) : fini ? (
          <div className="ligne-progression">
            <button
              className="btn-mini"
              onClick={() => onDecrementer(malId)}
              disabled={progression === 0}
              title="Retirer un épisode vu"
            >
              −
            </button>
            <a className="btn-suivi" href={url} target="_blank" rel="noreferrer">
              Revoir la fiche
            </a>
          </div>
        ) : pasEncoreSorti ? (
          <button className="btn-suivi" disabled title="Pas encore diffusé sur MAL">
            Pas encore diffusé
          </button>
        ) : (
          <div className="ligne-progression">
            <button
              className="btn-mini"
              onClick={() => onDecrementer(malId)}
              disabled={progression === 0}
              title="Retirer un épisode vu"
            >
              −
            </button>
            <button className="btn-suivi" onClick={() => onIncrementer(malId)}>
              {unite.singulier} {progression + 1} {unite.verbe} ✓
            </button>
            {total > 0 && (
              <button
                className="btn-mini btn-tout"
                onClick={() => onToutMarquer(malId)}
                title={`Marquer tous les ${unite.pluriel.toLowerCase()} comme ${unite.verbe}s`}
              >
                Tout ✓
              </button>
            )}
          </div>
        )}
        {!lectureSeule && (
          <div className="liens-secondaires">
            <a className="lien-fiche" href={url} target="_blank" rel="noreferrer" title="Voir la fiche MAL">
              Fiche ↗
            </a>
            <select
              className="statut-select"
              value={statut}
              onChange={(e) => onDefinirStatut(malId, e.target.value)}
              title="Changer le statut"
            >
              {STATUTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <button className="btn-retirer" onClick={() => onRetirer(malId)}>
              Retirer
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function WorksGrid({
  oeuvres,
  lectureSeule = false,
  onIncrementer,
  onDecrementer,
  onToutMarquer,
  onDefinirNote,
  onDefinirStatut,
  onRetirer,
}) {
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
          onDecrementer={onDecrementer}
          onToutMarquer={onToutMarquer}
          onDefinirNote={onDefinirNote}
          onDefinirStatut={onDefinirStatut}
          onRetirer={onRetirer}
        />
      ))}
    </div>
  );
}
