-- Nombre de fois qu'une œuvre a été revue en entier (ex : "j'ai vu SNK 4
-- fois") — purement informatif côté Weebliothèque, jamais poussé vers MAL.
-- À exécuter une fois dans l'éditeur SQL Supabase. Réexécutable sans risque.

alter table public.library_entries
  add column if not exists revisionnages int not null default 0;
