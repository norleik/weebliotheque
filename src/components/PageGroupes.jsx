import { useCallback, useEffect, useRef, useState } from 'react';
import { tempsRelatif, messageActivite } from '../lib/activite';
import { useTierlists } from '../hooks/useTierlists';
import Avatar from './Avatar';
import TierlistEditor from './TierlistEditor';
import './PageGroupes.css';

function Pseudo({ pseudo, estMoi }) {
  return (
    <b>
      {pseudo ?? '?'}
      {estMoi && ' (toi)'}
    </b>
  );
}

function MiniJeux({ groupe, moi }) {
  const { tierlists, chargement, creerTierlist, supprimerTierlist } = useTierlists(groupe.id);
  const [tierlistOuverte, setTierlistOuverte] = useState(null);
  const [erreur, setErreur] = useState('');
  const [creation, setCreation] = useState(false);

  async function onCreer() {
    const nom = window.prompt('Nom de la tierlist :', 'Tierlist animés');
    if (!nom || !nom.trim()) return;
    setErreur('');
    setCreation(true);
    try {
      const id = await creerTierlist(nom.trim().slice(0, 60));
      setTierlistOuverte(id);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setCreation(false);
    }
  }

  const ouverte = tierlists.find((t) => t.id === tierlistOuverte);
  if (ouverte) {
    return <TierlistEditor tierlist={ouverte} onFermer={() => setTierlistOuverte(null)} />;
  }

  return (
    <section className="carte-sociale">
      <div className="minijeux-entete">
        <h2>🎮 Mini-jeux</h2>
        <button className="btn-social" onClick={onCreer} disabled={creation}>
          + Nouvelle tierlist
        </button>
      </div>
      <p className="import-tvtime-aide">
        Classe en direct avec les membres du groupe les œuvres vues en commun (au moins 2 membres)
        — S la meilleure, F la moins bonne. Chaque déplacement est visible par tout le monde en
        temps réel.
      </p>
      {erreur && <p className="import-tvtime-aide erreur">{erreur}</p>}
      {chargement && <p className="vide-social">Chargement…</p>}
      {!chargement && tierlists.length === 0 && (
        <p className="vide-social">Aucune tierlist pour l'instant — crée-en une !</p>
      )}
      {tierlists.length > 0 && (
        <ul className="liste-sociale">
          {tierlists.map((t) => (
            <li key={t.id}>
              <span className="pseudo-social">{t.titre}</span>
              <span className="etat-social">par {t.profiles?.pseudo ?? '?'}</span>
              <button className="btn-social" onClick={() => setTierlistOuverte(t.id)}>
                Ouvrir
              </button>
              {t.createur === moi && (
                <button className="btn-social secondaire" onClick={() => supprimerTierlist(t.id)}>
                  Supprimer
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DetailGroupe({ groupe, moi, chargerDetails, quitterGroupe, envoyerMessage, onQuitte }) {
  const [membres, setMembres] = useState([]);
  const [elements, setElements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [codeCopie, setCodeCopie] = useState(false);
  const [reponseA, setReponseA] = useState(null);
  const [brouillon, setBrouillon] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [vue, setVue] = useState('fil'); // 'fil' | 'minijeux'
  const filRef = useRef(null);

  const rafraichir = useCallback(async () => {
    const { membres, fil, messages } = await chargerDetails(groupe.id);
    setMembres(membres);
    // Activité et messages fusionnés en un seul fil chronologique (style chat).
    const fusion = [
      ...fil.map((a) => ({ genre: 'activite', cle: `a-${a.id}`, date: a.created_at, a })),
      ...messages.map((m) => ({ genre: 'message', cle: `m-${m.id}`, date: m.created_at, m })),
    ].sort((x, y) => new Date(x.date) - new Date(y.date));
    setElements(fusion);
    setChargement(false);
  }, [groupe.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setChargement(true);
    rafraichir();
  }, [rafraichir]);

  useEffect(() => {
    const el = filRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [elements]);

  function copierCode() {
    navigator.clipboard?.writeText(groupe.code_invitation);
    setCodeCopie(true);
    setTimeout(() => setCodeCopie(false), 1500);
  }

  async function onQuitter() {
    await quitterGroupe(groupe.id);
    onQuitte();
  }

  async function onEnvoyer(e) {
    e.preventDefault();
    const contenu = brouillon.trim();
    if (!contenu || envoi) return;
    setEnvoi(true);
    try {
      await envoyerMessage(groupe.id, contenu, reponseA?.id ?? null);
      setBrouillon('');
      setReponseA(null);
      await rafraichir();
    } catch (err) {
      console.error(err);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="detail-groupe">
      <div className="groupe-entete">
        <div>
          <h2>{groupe.nom}</h2>
          <button className="code-invitation" onClick={copierCode} title="Copier le code">
            {codeCopie ? 'Copié ✓' : `Code : ${groupe.code_invitation} ⧉`}
          </button>
        </div>
        <button className="btn-social secondaire" onClick={onQuitter}>
          Quitter le groupe
        </button>
      </div>

      <div className="groupe-vues">
        <button className={`onglet${vue === 'fil' ? ' actif' : ''}`} onClick={() => setVue('fil')}>
          Fil
        </button>
        <button className={`onglet${vue === 'minijeux' ? ' actif' : ''}`} onClick={() => setVue('minijeux')}>
          🎮 Mini-jeux
        </button>
      </div>

      {vue === 'minijeux' && <MiniJeux groupe={groupe} moi={moi} />}

      {vue === 'fil' && (
      <div className="groupe-colonnes">
        <section className="carte-sociale colonne-fil">
          <h2>
            Fil du groupe
            <button className="btn-rafraichir" onClick={rafraichir} title="Rafraîchir le fil">
              ↻
            </button>
          </h2>
          {chargement && <p className="vide-social">Chargement…</p>}
          {!chargement && elements.length === 0 && (
            <p className="vide-social">
              Rien pour l'instant — l'activité des membres et vos messages apparaîtront ici.
            </p>
          )}
          <ul className="fil-activite" ref={filRef}>
            {elements.map((el) =>
              el.genre === 'activite' ? (
                <li key={el.cle} className="fil-item">
                  <Avatar url={el.a.profiles?.avatar} pseudo={el.a.profiles?.pseudo} className="mini" />
                  <div className="fil-texte">
                    <span>
                      <Pseudo pseudo={el.a.profiles?.pseudo} estMoi={el.a.user_id === moi} /> {messageActivite(el.a)}
                    </span>
                    <span className="fil-temps">{tempsRelatif(el.a.created_at)}</span>
                  </div>
                  <button className="btn-repondre" onClick={() => setReponseA(el.a)}>
                    Répondre
                  </button>
                </li>
              ) : (
                <li key={el.cle} className="fil-item est-message">
                  <Avatar url={el.m.profiles?.avatar} pseudo={el.m.profiles?.pseudo} className="mini" />
                  <div className="fil-texte">
                    <span>
                      <Pseudo pseudo={el.m.profiles?.pseudo} estMoi={el.m.user_id === moi} />
                      <span className="fil-temps msg-temps">{tempsRelatif(el.m.created_at)}</span>
                    </span>
                    {el.m.activity && (
                      <span className="msg-citation">
                        ↪ {el.m.activity.profiles?.pseudo ?? '?'} {messageActivite(el.m.activity)}
                      </span>
                    )}
                    <span className="msg-contenu">{el.m.contenu}</span>
                  </div>
                </li>
              ),
            )}
          </ul>

          <form className="composeur" onSubmit={onEnvoyer}>
            {reponseA && (
              <div className="composeur-reponse">
                <span>
                  ↪ En réponse à : <b>{reponseA.profiles?.pseudo ?? '?'}</b> {messageActivite(reponseA)}
                </span>
                <button type="button" onClick={() => setReponseA(null)} title="Annuler la réponse">
                  ×
                </button>
              </div>
            )}
            <div className="composeur-ligne">
              <input
                type="text"
                className="champ-social"
                placeholder="Écrire un message…"
                maxLength={1000}
                value={brouillon}
                onChange={(e) => setBrouillon(e.target.value)}
              />
              <button className="btn-social" type="submit" disabled={envoi || !brouillon.trim()}>
                Envoyer
              </button>
            </div>
          </form>
        </section>

        <section className="carte-sociale colonne-membres">
          <h2>
            Membres <span className="compteur-social">{membres.length}</span>
          </h2>
          <ul className="liste-sociale">
            {membres.map((m) => (
              <li key={m.id}>
                <Avatar url={m.avatar} pseudo={m.pseudo} className="mini" />
                <span className="pseudo-social">
                  {m.pseudo}
                  {m.id === moi && ' (toi)'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      )}
    </div>
  );
}

export default function PageGroupes({ moi, groups }) {
  const { groupes, creerGroupe, rejoindreGroupe, quitterGroupe, chargerDetails, envoyerMessage } = groups;
  const [nomNouveau, setNomNouveau] = useState('');
  const [codeRejoindre, setCodeRejoindre] = useState('');
  const [erreur, setErreur] = useState(null);
  const [groupeSelectionne, setGroupeSelectionne] = useState(null);

  async function onCreer(e) {
    e.preventDefault();
    setErreur(null);
    if (!nomNouveau.trim()) return;
    try {
      await creerGroupe(nomNouveau.trim());
      setNomNouveau('');
    } catch (err) {
      setErreur(err.message);
    }
  }

  async function onRejoindre(e) {
    e.preventDefault();
    setErreur(null);
    if (!codeRejoindre.trim()) return;
    try {
      await rejoindreGroupe(codeRejoindre.trim());
      setCodeRejoindre('');
    } catch (err) {
      setErreur(err.message.includes('invalide') ? "Code d'invitation invalide." : err.message);
    }
  }

  if (groupeSelectionne) {
    const groupe = groupes.find((g) => g.id === groupeSelectionne);
    if (groupe) {
      return (
        <div>
          <button className="btn-retour" onClick={() => setGroupeSelectionne(null)}>
            ← Retour aux groupes
          </button>
          <DetailGroupe
            groupe={groupe}
            moi={moi}
            chargerDetails={chargerDetails}
            quitterGroupe={quitterGroupe}
            envoyerMessage={envoyerMessage}
            onQuitte={() => setGroupeSelectionne(null)}
          />
        </div>
      );
    }
  }

  return (
    <div className="page-groupes">
      <div className="groupe-formulaires">
        <section className="carte-sociale">
          <h2>Créer un groupe</h2>
          <form className="form-groupe" onSubmit={onCreer}>
            <input
              type="text"
              className="champ-social"
              placeholder="Nom du groupe…"
              value={nomNouveau}
              onChange={(e) => setNomNouveau(e.target.value)}
            />
            <button className="btn-social" type="submit">
              Créer
            </button>
          </form>
        </section>

        <section className="carte-sociale">
          <h2>Rejoindre un groupe</h2>
          <form className="form-groupe" onSubmit={onRejoindre}>
            <input
              type="text"
              className="champ-social code"
              placeholder="Code d'invitation (ex : A1B2C3)"
              value={codeRejoindre}
              onChange={(e) => setCodeRejoindre(e.target.value)}
            />
            <button className="btn-social" type="submit">
              Rejoindre
            </button>
          </form>
        </section>
      </div>

      {erreur && <p className="erreur-groupe">{erreur}</p>}

      <section className="carte-sociale">
        <h2>
          Mes groupes <span className="compteur-social">{groupes.length}</span>
        </h2>
        {groupes.length === 0 ? (
          <p className="vide-social">
            Pas encore de groupe — crée-en un et partage le code d'invitation avec tes amis.
          </p>
        ) : (
          <ul className="liste-sociale">
            {groupes.map((g) => (
              <li key={g.id}>
                <div className="avatar av-leo mini">{g.nom[0]?.toUpperCase() ?? '?'}</div>
                <span className="pseudo-social">{g.nom}</span>
                <button className="btn-social" onClick={() => setGroupeSelectionne(g.id)}>
                  Ouvrir
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
