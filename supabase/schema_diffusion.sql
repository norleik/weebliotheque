-- Marque les œuvres pas encore diffusées (statut MAL "not_yet_aired"), pour
-- empêcher de marquer des épisodes vus sur un animé qui n'est pas encore sorti.
-- À exécuter une fois dans l'éditeur SQL Supabase. Réexécutable sans risque.

alter table public.library_entries
  add column if not exists pas_encore_sorti boolean not null default false;
