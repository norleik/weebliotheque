import { useCalendrier } from '../hooks/useCalendrier';
import { grouperParJour, joursRestants } from '../lib/calendrier';
import './PageCalendrier.css';

function Diffusion({ ev }) {
  const { oeuvre, date, episode, premiere } = ev;
  const jours = joursRestants(date);
  const plusTard = jours >= 7;
  const heureLocale = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <li className="diffusion">
      {oeuvre.image && <img src={oeuvre.image} alt="" />}
      <div className="diffusion-info">
        <a className="diffusion-pill" href={oeuvre.url} target="_blank" rel="noreferrer">
          {oeuvre.titre} ›
        </a>
        <span className="diffusion-episode">
          {premiere ? 'Premier épisode' : `Épisode ${episode ?? '?'}`}
          {oeuvre.total ? <em> / {oeuvre.total}</em> : null}
        </span>
        <span className="diffusion-progression">
          {oeuvre.progression > 0 ? `Tu en es à l'épisode ${oeuvre.progression}` : 'Pas encore commencé'}
        </span>
      </div>
      <div className="diffusion-quand">
        {plusTard ? (
          <>
            <b>{jours}</b>
            <span>jours</span>
          </>
        ) : (
          <>
            <b>{heureLocale}</b>
            <span>heure locale</span>
          </>
        )}
      </div>
    </li>
  );
}

export default function PageCalendrier({ library }) {
  const { evenements, chargement } = useCalendrier(library);
  const groupes = grouperParJour(evenements);

  return (
    <div className="page-calendrier">
      <div className="calendrier-tete">
        <h2>À venir</h2>
        <span className="calendrier-sous">Les prochains épisodes de tes animés suivis</span>
      </div>

      {groupes.map((groupe) => (
        <section key={groupe.libelle} className="calendrier-groupe">
          <div className="jour-titre">
            <span>{groupe.libelle}</span>
          </div>
          <ul className="diffusions">
            {groupe.evenements.map((ev) => (
              <Diffusion key={`${ev.oeuvre.malId}-${ev.date.getTime()}`} ev={ev} />
            ))}
          </ul>
        </section>
      ))}

      {chargement && <p className="calendrier-etat">Vérification des diffusions…</p>}

      {!chargement && evenements.length === 0 && (
        <p className="calendrier-vide">
          Aucune diffusion à venir pour tes animés — ajoute des animés de la saison depuis l'onglet
          Découvrir pour remplir ton calendrier.
        </p>
      )}
    </div>
  );
}
