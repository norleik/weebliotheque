-- Mini-jeu "L'Anime du Jour" (façon Wordle) — ouvert à tous les
-- utilisateurs, indépendant du système de groupes. Une seule tentative
-- enregistrée par utilisateur et par jour (le déroulé des essais reste côté
-- client ; seul le résultat final est stocké, pour le classement).
-- À exécuter une fois dans l'éditeur SQL Supabase. Réexécutable sans risque.

create table if not exists public.anime_jour_parties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  jour date not null,
  mal_id bigint not null,
  titre text not null,
  image text,
  essais integer not null,
  gagne boolean not null,
  points integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, jour)
);

alter table public.anime_jour_parties enable row level security;

drop policy if exists "Voir toutes les parties" on public.anime_jour_parties;
drop policy if exists "Enregistrer sa partie" on public.anime_jour_parties;
drop policy if exists "Corriger sa partie" on public.anime_jour_parties;

-- Classement public : tout utilisateur connecté voit toutes les parties.
create policy "Voir toutes les parties"
  on public.anime_jour_parties for select
  to authenticated
  using (true);

create policy "Enregistrer sa partie"
  on public.anime_jour_parties for insert
  with check (auth.uid() = user_id);

create policy "Corriger sa partie"
  on public.anime_jour_parties for update
  using (auth.uid() = user_id);
