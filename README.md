# Weebliothèque

Tracker d'animés, mangas, light novels et manhwas à partager entre amis — un remplaçant de TV Time fait maison.

## Fonctionnalités

- 🔍 **Recherche** via l'API officielle [MyAnimeList](https://myanimelist.net/apiconfig/references/api/v2) (proxy serverless dans `api/`)
- 🔗 **Liaison de compte MAL** : import de sa liste d'animés et mangas existante (OAuth2 PKCE)
- 📚 **Bibliothèque personnelle** : progression épisode par épisode, notes sur 10, statuts en cours/terminé
- 📊 **Stats de profil** calculées en direct : épisodes vus, temps de visionnage, chapitres lus, note moyenne
- 👥 **Amis** : demandes, profils consultables avec bibliothèque en lecture seule
- 🏠 **Groupes** : création/adhésion par code d'invitation, fil d'activité partagé, messages et réactions
- 🌸 **Découvrir** : les sorties animé de la saison en cours

## Stack

- [React](https://react.dev) + [Vite](https://vite.dev)
- [Supabase](https://supabase.com) — authentification et base de données (PostgreSQL + RLS)
- [API MyAnimeList v2](https://myanimelist.net/apiconfig/references/api/v2) — catalogue et import de listes, via un proxy serverless Vercel (`api/mal/`) car l'API MAL n'accepte pas les appels navigateur ; en dev, le même proxy est monté en middleware Vite

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

SPA Vite + fonctions serverless (`api/`) sur Vercel. Variables d'environnement à définir dans le dashboard :
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `MAL_CLIENT_ID`, `MAL_CLIENT_SECRET`, `VITE_MAL_CLIENT_ID`.
L'app MAL (myanimelist.net/apiconfig) doit déclarer les Redirect URLs `https://<domaine>/` et `http://localhost:5173/`.
