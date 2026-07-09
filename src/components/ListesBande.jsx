import { useState } from 'react';
import { useLists } from '../hooks/useLists';
import './ListesBande.css';

function ListeDetail({ liste, proprietaire, library, onAjouter, onRetirer, onDeplacer, onSupprimer, onFermer }) {
  const [choix, setChoix] = useState('');

  const dejaDansListe = new Set(liste.items.map((i) => i.mal_id));
  const candidates = library.filter((o) => !dejaDansListe.has(o.malId));

  function onAjouterChoix(e) {
    e.preventDefault();
    const oeuvre = candidates.find((o) => String(o.malId) === choix);
    if (oeuvre) {
      onAjouter(liste.id, oeuvre);
      setChoix('');
    }
  }

  return (
    <div className="liste-detail carte-sociale">
      <div className="liste-detail-tete">
        <h3>{liste.nom}</h3>
        <div className="liste-detail-actions">
          {proprietaire && (
            <button className="btn-social secondaire" onClick={() => onSupprimer(liste.id)}>
              Supprimer la liste
            </button>
          )}
          <button className="btn-fermer" onClick={onFermer} title="Fermer">
            ×
          </button>
        </div>
      </div>

      {liste.items.length === 0 && (
        <p className="vide-social">
          {proprietaire ? 'Liste vide — ajoute des œuvres de ta bibliothèque ci-dessous.' : 'Liste vide.'}
        </p>
      )}

      <ol className="liste-items">
        {liste.items.map((item, index) => (
          <li key={item.id}>
            <span className="liste-rang">{index + 1}</span>
            {item.image && <img src={item.image} alt="" />}
            <div className="liste-item-info">
              <span className="liste-item-type">{item.type}</span>
              <a className="liste-item-titre" href={item.url} target="_blank" rel="noreferrer">
                {item.titre}
              </a>
            </div>
            {proprietaire && (
              <div className="liste-item-actions">
                <button
                  disabled={index === 0}
                  onClick={() => onDeplacer(liste.id, index, -1)}
                  title="Monter"
                >
                  ↑
                </button>
                <button
                  disabled={index === liste.items.length - 1}
                  onClick={() => onDeplacer(liste.id, index, 1)}
                  title="Descendre"
                >
                  ↓
                </button>
                <button onClick={() => onRetirer(item.id)} title="Retirer de la liste">
                  ×
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>

      {proprietaire && candidates.length > 0 && (
        <form className="liste-ajout" onSubmit={onAjouterChoix}>
          <select className="champ-social" value={choix} onChange={(e) => setChoix(e.target.value)}>
            <option value="" disabled>
              Ajouter une œuvre de ma bibliothèque…
            </option>
            {candidates.map((o) => (
              <option key={o.malId} value={o.malId}>
                {o.titre} ({o.type})
              </option>
            ))}
          </select>
          <button className="btn-social" type="submit" disabled={!choix}>
            Ajouter
          </button>
        </form>
      )}
    </div>
  );
}

export default function ListesBande({ userId, proprietaire = false, library = [] }) {
  const { listes, chargement, creerListe, supprimerListe, ajouterItem, retirerItem, deplacerItem } =
    useLists(userId);
  const [listeOuverte, setListeOuverte] = useState(null);

  async function onCreer() {
    const nom = window.prompt('Nom de la liste :', 'Top 10 animé');
    if (!nom || !nom.trim()) return;
    try {
      await creerListe(nom.trim().slice(0, 60));
    } catch (err) {
      console.error(err);
    }
  }

  async function onSupprimer(listId) {
    await supprimerListe(listId);
    setListeOuverte(null);
  }

  // Chez un ami sans listes, on n'affiche pas la section du tout.
  if (!proprietaire && !chargement && listes.length === 0) return null;

  const ouverte = listes.find((l) => l.id === listeOuverte);

  return (
    <section className="listes-section">
      <div className="listes-tete">
        <h2>Listes</h2>
        {proprietaire && (
          <button className="btn-nouvelle-liste" onClick={onCreer}>
            + Nouvelle liste
          </button>
        )}
      </div>

      {proprietaire && !chargement && listes.length === 0 && (
        <p className="listes-vide">Crée ta première liste — par exemple ton top 10 animé.</p>
      )}

      {listes.length > 0 && (
        <div className="listes-bande">
          {listes.map((liste) => (
            <button
              key={liste.id}
              className={`liste-carte${liste.id === listeOuverte ? ' active' : ''}`}
              style={
                liste.items[0]?.image ? { backgroundImage: `url(${liste.items[0].image})` } : undefined
              }
              onClick={() => setListeOuverte(liste.id === listeOuverte ? null : liste.id)}
            >
              <span className="liste-carte-nom">{liste.nom}</span>
              <span className="liste-carte-n">{liste.items.length}</span>
            </button>
          ))}
        </div>
      )}

      {ouverte && (
        <ListeDetail
          liste={ouverte}
          proprietaire={proprietaire}
          library={library}
          onAjouter={ajouterItem}
          onRetirer={retirerItem}
          onDeplacer={deplacerItem}
          onSupprimer={onSupprimer}
          onFermer={() => setListeOuverte(null)}
        />
      )}
    </section>
  );
}
