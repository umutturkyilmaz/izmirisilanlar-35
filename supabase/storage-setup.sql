-- İzmir İş İlanları 35 — Storage + profil alanları (Supabase SQL Editor)
-- iyzico bu aşamada bağlanmaz.

alter table public.profiles
  add column if not exists cv_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('job-images', 'job-images', true)
on conflict (id) do nothing;

drop policy if exists "Users upload own avatars" on storage.objects;
create policy "Users upload own avatars"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users upload own cvs" on storage.objects;
create policy "Users upload own cvs"
on storage.objects for insert to authenticated
with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users upload own job images" on storage.objects;
create policy "Users upload own job images"
on storage.objects for insert to authenticated
with check (bucket_id = 'job-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
on storage.objects for select to public
using (bucket_id = 'avatars');

drop policy if exists "Public read cvs" on storage.objects;
create policy "Public read cvs"
on storage.objects for select to public
using (bucket_id = 'cvs');

drop policy if exists "Public read job images" on storage.objects;
create policy "Public read job images"
on storage.objects for select to public
using (bucket_id = 'job-images');
