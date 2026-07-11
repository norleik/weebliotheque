import { useTierlistItems } from '../hooks/useTierlistItems';
import { TIERS } from '../hooks/useTierlists';
import './TierlistEditor.css';

const LABELS_TIER = {
  S: 'S',
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  F: 'F',
};

function Carte({ item }) {
  return (
    <div
      className="tierlist-carte"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      title={item.titre}
      style={item.image ? { backgroundImage: `url(${item.image})` } : undefined}
    >
      {!item.image && <span className="tierlist-carte-titre">{item.titre}</span>}
    </div>
  );
}

function Rangee({ tier, items, onDrop }) {
  return (
    <div
      className={`tierlist-rangee tier-${tier.toLowerCase()}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain');
        if (itemId) onDrop(itemId, tier);
      }}
    >
      <span className="tierlist-label">{LABELS_TIER[tier]}</span>
      <div className="tierlist-cartes">
        {items.map((item) => (
          <Carte key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function TierlistEditor({ tierlist, onFermer }) {
  const { items, chargement, deplacerItem } = useTierlistItems(tierlist.id);

  const pool = items.filter((i) => !i.tier);

  return (
    <div className="tierlist-editeur">
      <div className="tierlist-entete">
        <h3>{tierlist.titre}</h3>
        <button className="btn-retour" onClick={onFermer}>
          ← Retour aux tierlists
        </button>
      </div>

      {chargement && <p className="vide-social">Chargement…</p>}

      {!chargement && (
        <>
          {TIERS.map((tier) => (
            <Rangee key={tier} tier={tier} items={items.filter((i) => i.tier === tier)} onDrop={deplacerItem} />
          ))}

          <div
            className="tierlist-pool"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const itemId = e.dataTransfer.getData('text/plain');
              if (itemId) deplacerItem(itemId, null);
            }}
          >
            <span className="tierlist-label tierlist-label-pool">À classer</span>
            <div className="tierlist-cartes">
              {pool.map((item) => (
                <Carte key={item.id} item={item} />
              ))}
              {pool.length === 0 && <span className="tierlist-vide">Tout est classé !</span>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
