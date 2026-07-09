-- Listes personnalisées (ex : "Top 10 animé") affichées sur le profil,
-- consultables par les amis.
-- À exécuter une fois dans l'éditeur SQL Supabase. Réexécutable sans risque.

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  nom text not null check (char_length(nom) between 1 and 60),
  created_at timestamptz not null default now()
);

create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  mal_id bigint not null,
  type text not null,
  titre text not null,
  image text,
  url text,
  position int not null default 0,
  unique (list_id, mal_id)
);

alter table public.lists enable row level security;
alter table public.list_items enable row level security;

drop policy if exists "Voir ses listes et celles de ses amis" on public.lists;
drop policy if exists "Créer ses listes" on public.lists;
drop policy if exists "Modifier ses listes" on public.lists;
drop policy if exists "Supprimer ses listes" on public.lists;

create policy "Voir ses listes et celles de ses amis"
  on public.lists for select
  using (auth.uid() = user_id or public.sont_amis(auth.uid(), user_id));

create policy "Créer ses listes"
  on public.lists for insert
  with check (auth.uid() = user_id);

create policy "Modifier ses listes"
  on public.lists for update
  using (auth.uid() = user_id);

create policy "Supprimer ses listes"
  on public.lists for delete
  using (auth.uid() = user_id);

drop policy if exists "Voir les éléments des listes visibles" on public.list_items;
drop policy if exists "Ajouter dans ses listes" on public.list_items;
drop policy if exists "Modifier ses éléments de liste" on public.list_items;
drop policy if exists "Retirer de ses listes" on public.list_items;

create policy "Voir les éléments des listes visibles"
  on public.list_items for select
  using (
    exists (
      select 1 from public.lists l
      where l.id = list_id
        and (l.user_id = auth.uid() or public.sont_amis(auth.uid(), l.user_id))
    )
  );

create policy "Ajouter dans ses listes"
  on public.list_items for insert
  with check (
    exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid())
  );

create policy "Modifier ses éléments de liste"
  on public.list_items for update
  using (
    exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid())
  );

create policy "Retirer de ses listes"
  on public.list_items for delete
  using (
    exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid())
  );
