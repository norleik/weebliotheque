-- Étape 3 — Social : amis, groupes, activité.
-- À exécuter une fois dans l'éditeur SQL Supabase (après schema.sql).

-- ===== profiles : visibles par tous les connectés (recherche d'amis, feeds) =====
drop policy if exists "Voir son propre profil" on public.profiles;
drop policy if exists "Profils visibles par les connectés" on public.profiles;

create policy "Profils visibles par les connectés"
  on public.profiles for select
  to authenticated
  using (true);

-- ===== friendships =====
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  demandeur uuid not null references public.profiles (id) on delete cascade,
  destinataire uuid not null references public.profiles (id) on delete cascade,
  statut text not null default 'en_attente', -- en_attente | accepte
  created_at timestamptz not null default now(),
  unique (demandeur, destinataire),
  check (demandeur <> destinataire)
);

alter table public.friendships enable row level security;

drop policy if exists "Voir ses relations" on public.friendships;
drop policy if exists "Envoyer une demande" on public.friendships;
drop policy if exists "Accepter une demande" on public.friendships;
drop policy if exists "Retirer une relation" on public.friendships;

create policy "Voir ses relations"
  on public.friendships for select
  using (auth.uid() in (demandeur, destinataire));

create policy "Envoyer une demande"
  on public.friendships for insert
  with check (auth.uid() = demandeur);

create policy "Accepter une demande"
  on public.friendships for update
  using (auth.uid() = destinataire);

create policy "Retirer une relation"
  on public.friendships for delete
  using (auth.uid() in (demandeur, destinataire));

-- Vrai si a et b sont amis (statut accepté), dans un sens ou l'autre.
create or replace function public.sont_amis(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.friendships
    where statut = 'accepte'
      and ((demandeur = a and destinataire = b) or (demandeur = b and destinataire = a))
  );
$$;

-- ===== library_entries : lisibles par les amis =====
drop policy if exists "Voir sa propre bibliothèque" on public.library_entries;
drop policy if exists "Voir sa bibliothèque et celles de ses amis" on public.library_entries;

create policy "Voir sa bibliothèque et celles de ses amis"
  on public.library_entries for select
  using (auth.uid() = user_id or public.sont_amis(auth.uid(), user_id));

-- ===== groups =====
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  code_invitation text not null unique default upper(substr(md5(random()::text), 1, 6)),
  createur uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- security definer pour éviter la récursion RLS entre groups et group_members.
create or replace function public.est_membre(gid uuid, uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.group_members where group_id = gid and user_id = uid);
$$;

-- Vrai si a et b partagent au moins un groupe.
create or replace function public.partagent_groupe(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.group_members m1
    join public.group_members m2 on m1.group_id = m2.group_id
    where m1.user_id = a and m2.user_id = b
  );
$$;

drop policy if exists "Voir ses groupes" on public.groups;
drop policy if exists "Voir les membres de ses groupes" on public.group_members;
drop policy if exists "Quitter un groupe" on public.group_members;

create policy "Voir ses groupes"
  on public.groups for select
  using (public.est_membre(id, auth.uid()));

create policy "Voir les membres de ses groupes"
  on public.group_members for select
  using (public.est_membre(group_id, auth.uid()));

create policy "Quitter un groupe"
  on public.group_members for delete
  using (auth.uid() = user_id);

-- Création et adhésion passent par des fonctions (le code d'invitation ne doit
-- pas être découvrable en listant la table).
create or replace function public.creer_groupe(nom_groupe text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  gid uuid;
begin
  insert into public.groups (nom, createur) values (nom_groupe, auth.uid()) returning id into gid;
  insert into public.group_members (group_id, user_id) values (gid, auth.uid());
  return gid;
end;
$$;

create or replace function public.rejoindre_groupe(code text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  gid uuid;
begin
  select id into gid from public.groups where code_invitation = upper(trim(code));
  if gid is null then
    raise exception 'Code d''invitation invalide';
  end if;
  insert into public.group_members (group_id, user_id) values (gid, auth.uid())
  on conflict do nothing;
  return gid;
end;
$$;

-- ===== activity =====
create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  action text not null, -- ajout | progression | note | termine
  mal_id bigint,
  titre text,
  type text,
  detail text,
  created_at timestamptz not null default now()
);

alter table public.activity enable row level security;

drop policy if exists "Publier sa propre activité" on public.activity;
drop policy if exists "Voir l'activité de ses amis et groupes" on public.activity;

create policy "Publier sa propre activité"
  on public.activity for insert
  with check (auth.uid() = user_id);

create policy "Voir l'activité de ses amis et groupes"
  on public.activity for select
  using (
    auth.uid() = user_id
    or public.sont_amis(auth.uid(), user_id)
    or public.partagent_groupe(auth.uid(), user_id)
  );
