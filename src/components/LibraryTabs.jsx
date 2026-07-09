import './LibraryTabs.css';

export default function LibraryTabs({ onglets, ongletActif, onChangeOnglet }) {
  return (
    <div className="biblio-tete">
      <h2>Ma bibliothèque</h2>
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
        <span className="filtre">En cours ▾</span>
        <span className="filtre">Récents ▾</span>
      </div>
    </div>
  );
}
