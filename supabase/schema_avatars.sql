-- Stockage des photos de profil.
-- À exécuter une fois dans l'éditeur SQL Supabase. Réexécutable sans risque.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatars publics en lecture" on storage.objects;
drop policy if exists "Uploader son propre avatar" on storage.objects;
drop policy if exists "Remplacer son propre avatar" on storage.objects;
drop policy if exists "Supprimer son propre avatar" on storage.objects;

create policy "Avatars publics en lecture"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Uploader son propre avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Remplacer son propre avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Supprimer son propre avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
