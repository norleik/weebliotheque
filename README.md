# Weebliothèque

Tracker d'animés, mangas, light novels et manhwas à partager entre amis — un remplaçant de TV Time fait maison.

## Fonctionnalités

- 🔍 **Recherche** via l'API [Jikan](https://jikan.moe) (données MyAnimeList, sans clé d'API)
- 📚 **Bibliothèque personnelle** : progression épisode par épisode, notes sur 10, statuts en cours/terminé
- 📊 **Stats de profil** calculées en direct : épisodes vus, temps de visionnage, chapitres lus, note moyenne
- 👥 **Amis** : demandes, profils consultables avec bibliothèque en lecture seule
- 🏠 **Groupes** : création/adhésion par code d'invitation, fil d'activité partagé, messages et réactions
- 🌸 **Découvrir** : les sorties animé de la saison en cours

## Stack

- [React](https://react.dev) + [Vite](https://vite.dev)
- [Supabase](https://supabase.com) — authentification et base de données (PostgreSQL + RLS)
- [Jikan v4](https://docs.api.jikan.moe) — catalogue MyAnimeList

## Lancer en local

```bash
npm install
cp .env.example .env.local   # puis renseigner tes clés Supabase
npm run dev
```

### Configuration Supabase

1. Crée un projet sur [supabase.com](https://supabase.com)
2. Exécute les scripts SQL de `supabase/` dans l'ordre : `schema.sql`, `schema_etape3.sql`, `schema_messages.sql`, `schema_etape4.sql`
3. Dans Authentication → Providers → Email, désactive "Confirm email" (ou configure un domaine d'envoi)
4. Renseigne `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env.local` (Project Settings → API)

## Déploiement

Build statique classique (`npm run build` → `dist/`). Sur Vercel/Netlify, définir les deux variables d'environnement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans le dashboard.
