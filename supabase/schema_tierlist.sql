-- Tierlists collaboratives dans un groupe (mini-jeu communautaire).
-- À exécuter une fois dans l'éditeur SQL Supabase. Réexécutable sans risque.

create table if not exists public.tierlists (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  titre text not null check (char_length(titre) between 1 and 60),
  createur uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.tierlist_items (
  id uuid primary key default gen_random_uuid(),
  tierlist_id uuid not null references public.tierlists (id) on delete cascade,
  mal_id bigint not null,
  type text not null,
  titre text not null,
  image text,
  url text,
  tier text, -- null = pas encore classé ; sinon 'S','A','B','C','D','F'
  position int not null default 0,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (tierlist_id, mal_id)
);

alter table public.tierlists enable row level security;
alter table public.tierlist_items enable row level security;

drop policy if exists "Voir les tierlists de ses groupes" on public.tierlists;
drop policy if exists "Créer une tierlist dans ses groupes" on public.tierlists;
drop policy if exists "Supprimer une tierlist de ses groupes" on public.tierlists;

create policy "Voir les tierlists de ses groupes"
  on public.tierlists for select
  using (public.est_membre(group_id, auth.uid()));

create policy "Créer une tierlist dans ses groupes"
  on public.tierlists for insert
  with check (public.est_membre(group_id, auth.uid()) and auth.uid() = createur);

create policy "Supprimer une tierlist de ses groupes"
  on public.tierlists for delete
  using (public.est_membre(group_id, auth.uid()));

drop policy if exists "Voir les éléments des tierlists de ses groupes" on public.tierlist_items;
drop policy if exists "Insérer des éléments dans une tierlist de ses groupes" on public.tierlist_items;
drop policy if exists "Modifier les éléments des tierlists de ses groupes" on public.tierlist_items;

create policy "Voir les éléments des tierlists de ses groupes"
  on public.tierlist_items for select
  using (
    exists (
      select 1 from public.tierlists t
      where t.id = tierlist_id and public.est_membre(t.group_id, auth.uid())
    )
  );

create policy "Insérer des éléments dans une tierlist de ses groupes"
  on public.tierlist_items for insert
  with check (
    exists (
      select 1 from public.tierlists t
      where t.id = tierlist_id and public.est_membre(t.group_id, auth.uid())
    )
  );

create policy "Modifier les éléments des tierlists de ses groupes"
  on public.tierlist_items for update
  using (
    exists (
      select 1 from public.tierlists t
      where t.id = tierlist_id and public.est_membre(t.group_id, auth.uid())
    )
  );

-- Indispensable pour le côté "collaboratif en direct" : diffuse les
-- changements de tierlist_items à tous les membres connectés du groupe.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tierlist_items'
  ) then
    alter publication supabase_realtime add table public.tierlist_items;
  end if;
end $$;
