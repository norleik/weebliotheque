import { STATUTS } from './WorksGrid';
import './LibraryTabs.css';

export default function LibraryTabs({
  onglets,
  ongletActif,
  onChangeOnglet,
  filtreStatut,
  onChangeFiltre,
  recherche,
  onChangeRecherche,
  titre = 'Ma bibliothèque',
}) {
  return (
    <div className="biblio-tete">
      <h2>{titre}</h2>
      <div className="onglets">
        {onglets.map((onglet) => (
          <button
            key={onglet.id}
            className={`onglet${onglet.id === ongletActif ? ' actif' : ''}`}
            onClick={() => onChangeOnglet(onglet.id)}
          >
            {onglet.label} <span className="n">{onglet.total}</span>
          </button>
        ))}
      </div>
      <div className="filtres">
        <input
          type="text"
          className="filtre-recherche"
          placeholder="Rechercher un titre…"
          value={recherche}
          onChange={(e) => onChangeRecherche(e.target.value)}
        />
        {onChangeFiltre && (
          <select className="filtre" value={filtreStatut} onChange={(e) => onChangeFiltre(e.target.value)}>
            <option value="tous">Tous les statuts</option>
            {STATUTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
