import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { detailsAnimeJeu } from '../api/mal';
import { idAnimeDuJour, cléJour } from '../data/animeDuJourPool';

export const ESSAIS_MAX = 6;

function comparerValeur(cible, valeur, écartProche) {
  if (valeur == null || cible == null) return { etat: 'inconnu' };
  if (valeur === cible) return { etat: 'exact' };
  const ecart = Math.abs(valeur - cible);
  return { etat: ecart <= écartProche ? 'proche' : 'loin', direction: cible > valeur ? 'haut' : 'bas' };
}

function comparerListes(cible, valeur) {
  const communs = valeur.filter((v) => cible.includes(v));
  if (communs.length === 0) return { etat: 'loin', communs: 0, total: cible.length };
  if (communs.length === cible.length && cible.length === valeur.length) {
    return { etat: 'exact', communs: communs.length, total: cible.length };
  }
  return { etat: 'proche', communs: communs.length, total: cible.length };
}

export function useAnimeDuJour(userId) {
  const jour = cléJour();
  const cléStockage = `weebliotheque:anime-jour:${jour}`;

  const [cible, setCible] = useState(null);
  const [partie, setPartie] = useState(null);
  const [essais, setEssais] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [classementGlobal, setClassementGlobal] = useState([]);
  const [classementJour, setClassementJour] = useState([]);

  const chargerClassements = useCallback(async () => {
    const { data: toutes } = await supabase
      .from('anime_jour_parties')
      .select('user_id, points, profiles(pseudo, avatar)');
    const totaux = new Map();
    for (const p of toutes ?? []) {
      const cur = totaux.get(p.user_id) ?? {
        userId: p.user_id,
        pseudo: p.profiles?.pseudo ?? '?',
        avatar: p.profiles?.avatar,
        points: 0,
      };
      cur.points += p.points;
      totaux.set(p.user_id, cur);
    }
    setClassementGlobal([...totaux.values()].sort((a, b) => b.points - a.points).slice(0, 5));

    const { data: aujourdhui } = await supabase
      .from('anime_jour_parties')
      .select('user_id, essais, created_at, profiles(pseudo, avatar)')
      .eq('jour', jour)
      .eq('gagne', true)
      .order('essais', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(3);
    setClassementJour(aujourdhui ?? []);
  }, [jour]);

  useEffect(() => {
    if (!userId) return;
    let annule = false;

    async function init() {
      setChargement(true);
      const id = idAnimeDuJour();
      const [detailsCible, { data: partieExistante }] = await Promise.all([
        detailsAnimeJeu(id),
        supabase.from('anime_jour_parties').select('*').eq('user_id', userId).eq('jour', jour).maybeSingle(),
      ]);
      if (annule) return;
      setCible(detailsCible);
      setPartie(partieExistante ?? null);
      if (!partieExistante) {
        try {
          setEssais(JSON.parse(localStorage.getItem(cléStockage)) ?? []);
        } catch {
          setEssais([]);
        }
      } else {
        setEssais([]);
      }
      await chargerClassements();
      setChargement(false);
    }

    init();
    return () => {
      annule = true;
    };
  }, [userId, jour, cléStockage, chargerClassements]);

  const terminee = Boolean(partie) || essais.some((e) => e.gagne) || essais.length >= ESSAIS_MAX;

  async function tenter(oeuvre) {
    if (terminee || !cible) return null;
    if (essais.some((e) => e.malId === oeuvre.malId)) return null;

    const details = await detailsAnimeJeu(oeuvre.malId);
    const indice = {
      malId: oeuvre.malId,
      titre: oeuvre.titre,
      image: oeuvre.image,
      gagne: oeuvre.malId === cible.malId,
      studio: { ...comparerListes(cible.studios, details.studios), valeur: details.studios.join(', ') || '?' },
      annee: { ...comparerValeur(cible.annee, details.annee, 2), valeur: details.annee ?? '?' },
      episodes: { ...comparerValeur(cible.episodes, details.episodes, 3), valeur: details.episodes ?? '?' },
      genres: { ...comparerListes(cible.genres, details.genres), valeur: details.genres.join(', ') || '?' },
    };

    const nouveaux = [...essais, indice];
    setEssais(nouveaux);

    const finie = indice.gagne || nouveaux.length >= ESSAIS_MAX;
    if (!finie) {
      localStorage.setItem(cléStockage, JSON.stringify(nouveaux));
      return indice;
    }

    const points = indice.gagne ? ESSAIS_MAX + 1 - nouveaux.length : 0;
    const ligne = {
      user_id: userId,
      jour,
      mal_id: cible.malId,
      titre: cible.titre,
      image: cible.image,
      essais: nouveaux.length,
      gagne: indice.gagne,
      points,
    };
    const { data, error } = await supabase
      .from('anime_jour_parties')
      .upsert(ligne, { onConflict: 'user_id,jour' })
      .select()
      .single();

    if (!error) {
      setPartie(data);
      localStorage.removeItem(cléStockage);
      await chargerClassements();
    }
    return indice;
  }

  return {
    chargement,
    cible,
    partie,
    essais,
    terminee,
    essaisMax: ESSAIS_MAX,
    tenter,
    classementGlobal,
    classementJour,
  };
}
