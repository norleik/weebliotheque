-- Étape 4 — Durée d'un épisode (minutes), renseignée à l'ajout depuis Jikan.
-- Les entrées existantes restent à null (l'appli retombe sur 24 min par défaut).
-- À exécuter une fois dans l'éditeur SQL Supabase. Réexécutable sans risque.

alter table public.library_entries
  add column if not exists duree_episode int;
