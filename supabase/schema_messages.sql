-- Messages de groupe (avec réponse optionnelle à un événement d'activité).
-- À exécuter une fois dans l'éditeur SQL Supabase (après schema_etape3.sql).
-- Réexécutable sans risque.

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  contenu text not null check (char_length(contenu) between 1 and 1000),
  activity_id uuid references public.activity (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.group_messages enable row level security;

drop policy if exists "Lire les messages de ses groupes" on public.group_messages;
drop policy if exists "Écrire dans ses groupes" on public.group_messages;
drop policy if exists "Supprimer ses messages" on public.group_messages;

create policy "Lire les messages de ses groupes"
  on public.group_messages for select
  using (public.est_membre(group_id, auth.uid()));

create policy "Écrire dans ses groupes"
  on public.group_messages for insert
  with check (auth.uid() = user_id and public.est_membre(group_id, auth.uid()));

create policy "Supprimer ses messages"
  on public.group_messages for delete
  using (auth.uid() = user_id);
