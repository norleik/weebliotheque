-- Vote public pour l'animé préféré de la saison — ouvert à tous les
-- utilisateurs, indépendant du système de groupes.
-- À exécuter une fois dans l'éditeur SQL Supabase. Réexécutable sans risque.

create table if not exists public.season_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  saison text not null, -- ex : "2026-summer"
  mal_id bigint not null,
  titre text not null,
  image text,
  url text,
  created_at timestamptz not null default now(),
  unique (user_id, saison)
);

alter table public.season_votes enable row level security;

drop policy if exists "Voir tous les votes de la saison" on public.season_votes;
drop policy if exists "Voter" on public.season_votes;
drop policy if exists "Changer son vote" on public.season_votes;
drop policy if exists "Retirer son vote" on public.season_votes;

-- Classement public : tout utilisateur connecté voit tous les votes (pas de
-- notion de groupe ici, contrairement au reste du volet communautaire).
create policy "Voir tous les votes de la saison"
  on public.season_votes for select
  to authenticated
  using (true);

create policy "Voter"
  on public.season_votes for insert
  with check (auth.uid() = user_id);

create policy "Changer son vote"
  on public.season_votes for update
  using (auth.uid() = user_id);

create policy "Retirer son vote"
  on public.season_votes for delete
  using (auth.uid() = user_id);
