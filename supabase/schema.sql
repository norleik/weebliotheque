-- À exécuter une fois dans l'éditeur SQL de ton projet Supabase (Étape 2).

create extension if not exists pgcrypto;

-- ===== profiles =====
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudo text not null,
  avatar text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Voir son propre profil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Modifier son propre profil"
  on public.profiles for update
  using (auth.uid() = id);

-- Crée automatiquement une ligne profiles à l'inscription (pseudo = début de l'email).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, pseudo)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ===== library_entries =====
create table if not exists public.library_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mal_id bigint not null,
  type text not null,
  titre text not null,
  image text,
  total int,
  url text,
  progression int not null default 0,
  note int,
  statut text not null default 'en_cours',
  date_ajout timestamptz not null default now(),
  unique (user_id, mal_id)
);

alter table public.library_entries enable row level security;

create policy "Voir sa propre bibliothèque"
  on public.library_entries for select
  using (auth.uid() = user_id);

create policy "Ajouter dans sa propre bibliothèque"
  on public.library_entries for insert
  with check (auth.uid() = user_id);

create policy "Modifier sa propre bibliothèque"
  on public.library_entries for update
  using (auth.uid() = user_id);

create policy "Supprimer dans sa propre bibliothèque"
  on public.library_entries for delete
  using (auth.uid() = user_id);
