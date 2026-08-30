-- =============================================================================
-- İzmir İş İlanları 35 — BOŞ Supabase projesi için TEK SEFERLİK KURULUM
-- Supabase Dashboard → SQL Editor → New query → Yapıştır → Run
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1) profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'candidate'
    check (role in ('candidate', 'employer', 'admin')),
  full_name text,
  company_name text,
  phone text,
  city text,
  avatar_url text,
  bio text,
  cv_url text,
  vergi_numarasi text,
  dogrulama_durumu text not null default 'unverified'
    check (dogrulama_durumu in ('unverified', 'pending', 'verified', 'rejected')),
  dogrulama_talebi_tarihi timestamptz,
  dogrulanma_tarihi timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles select own or public basic" on public.profiles;
create policy "Profiles select own or public basic"
on public.profiles for select to anon, authenticated
using (true);

drop policy if exists "Profiles insert own" on public.profiles;
create policy "Profiles insert own"
on public.profiles for insert to authenticated
with check (id = auth.uid());

drop policy if exists "Profiles update own or admin" on public.profiles;
create policy "Profiles update own or admin"
on public.profiles for update to authenticated
using (
  id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Auth kullanıcısı oluşunca profil (yedek; uygulama da insert eder)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone, city, company_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'candidate'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'company_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2) job_categories (+ seed)
-- ---------------------------------------------------------------------------
create table if not exists public.job_categories (
  id bigserial primary key,
  name text not null unique,
  icon text,
  sort_order integer not null default 0
);

alter table public.job_categories enable row level security;

drop policy if exists "Categories public read" on public.job_categories;
create policy "Categories public read"
on public.job_categories for select to anon, authenticated
using (true);

insert into public.job_categories (name, icon, sort_order) values
  ('Teknoloji', 'ri-code-s-slash-line', 1),
  ('Satış & Pazarlama', 'ri-megaphone-line', 2),
  ('Muhasebe & Finans', 'ri-money-dollar-circle-line', 3),
  ('İnsan Kaynakları', 'ri-team-line', 4),
  ('Üretim', 'ri-building-2-line', 5),
  ('Lojistik', 'ri-truck-line', 6),
  ('Sağlık', 'ri-heart-pulse-line', 7),
  ('Eğitim', 'ri-book-open-line', 8),
  ('Turizm & Otelcilik', 'ri-hotel-line', 9),
  ('Diğer', 'ri-briefcase-line', 99)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- 3) jobs
-- ---------------------------------------------------------------------------
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category_id bigint references public.job_categories(id) on delete set null,
  sector text,
  description text,
  company_name text,
  city text,
  job_type text,
  experience_level text,
  salary_min integer,
  salary_max integer,
  requirements text[],
  benefits text[],
  image_url text,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'rejected', 'closed', 'expired')),
  featured boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists jobs_employer_idx on public.jobs(employer_id);
create index if not exists jobs_featured_idx on public.jobs(featured) where featured = true;
create index if not exists jobs_created_idx on public.jobs(created_at desc);

alter table public.jobs enable row level security;

drop policy if exists "Jobs public read active" on public.jobs;
create policy "Jobs public read active"
on public.jobs for select to anon, authenticated
using (
  status = 'active'
  or employer_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "Employers insert jobs" on public.jobs;
create policy "Employers insert jobs"
on public.jobs for insert to authenticated
with check (
  employer_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('employer', 'admin'))
);

drop policy if exists "Employers update own jobs" on public.jobs;
create policy "Employers update own jobs"
on public.jobs for update to authenticated
using (
  employer_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ---------------------------------------------------------------------------
-- 4) applications
-- ---------------------------------------------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  cover_letter text,
  cv_url text,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);

create index if not exists applications_candidate_idx on public.applications(candidate_id);
create index if not exists applications_job_idx on public.applications(job_id);

alter table public.applications enable row level security;

drop policy if exists "Applications select own side" on public.applications;
create policy "Applications select own side"
on public.applications for select to authenticated
using (
  candidate_id = auth.uid()
  or exists (
    select 1 from public.jobs j
    where j.id = job_id and (j.employer_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  )
);

drop policy if exists "Candidates insert applications" on public.applications;
create policy "Candidates insert applications"
on public.applications for insert to authenticated
with check (candidate_id = auth.uid());

drop policy if exists "Employers update applications" on public.applications;
create policy "Employers update applications"
on public.applications for update to authenticated
using (
  exists (
    select 1 from public.jobs j
    where j.id = job_id and (j.employer_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  )
);

-- ---------------------------------------------------------------------------
-- 5) favorites
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create index if not exists favorites_user_idx on public.favorites(user_id);

alter table public.favorites enable row level security;

drop policy if exists "Favorites own all" on public.favorites;
create policy "Favorites own all"
on public.favorites for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6) contact_messages
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "Anyone can insert contact" on public.contact_messages;
create policy "Anyone can insert contact"
on public.contact_messages for insert to anon, authenticated
with check (true);

drop policy if exists "Admin read contact" on public.contact_messages;
create policy "Admin read contact"
on public.contact_messages for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ---------------------------------------------------------------------------
-- 7) job_payments
-- ---------------------------------------------------------------------------
create table if not exists public.job_payments (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  package_id text not null,
  package_name text not null,
  amount integer not null,
  currency text not null default 'TRY',
  status text not null default 'pending',
  iyzico_payment_id text,
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  company_name text,
  tax_id text,
  billing_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_payments_employer_idx on public.job_payments(employer_id);

alter table public.job_payments enable row level security;

drop policy if exists "Employers read own payments" on public.job_payments;
create policy "Employers read own payments"
on public.job_payments for select to authenticated
using (
  employer_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "Employers insert own payments" on public.job_payments;
create policy "Employers insert own payments"
on public.job_payments for insert to authenticated
with check (employer_id = auth.uid());

drop policy if exists "Employers update own payments" on public.job_payments;
create policy "Employers update own payments"
on public.job_payments for update to authenticated
using (
  employer_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ---------------------------------------------------------------------------
-- 8) employer_credits
-- ---------------------------------------------------------------------------
create table if not exists public.employer_credits (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  payment_id uuid references public.job_payments(id) on delete set null,
  package_id text not null,
  package_name text not null,
  duration_days integer not null,
  featured boolean not null default false,
  remaining integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists employer_credits_employer_idx on public.employer_credits(employer_id);

alter table public.employer_credits enable row level security;

drop policy if exists "Employers manage own credits" on public.employer_credits;
create policy "Employers manage own credits"
on public.employer_credits for all to authenticated
using (
  employer_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  employer_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ---------------------------------------------------------------------------
-- 9) notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id);

alter table public.notifications enable row level security;

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
on public.notifications for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
on public.notifications for update to authenticated
using (user_id = auth.uid());

drop policy if exists "Authenticated insert notifications" on public.notifications;
create policy "Authenticated insert notifications"
on public.notifications for insert to authenticated
with check (true);

-- ---------------------------------------------------------------------------
-- 10) email_queue
-- ---------------------------------------------------------------------------
create table if not exists public.email_queue (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text not null,
  body text not null,
  kind text not null default 'generic',
  meta jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists email_queue_status_idx on public.email_queue(status, created_at);

alter table public.email_queue enable row level security;

drop policy if exists "Users enqueue own emails" on public.email_queue;
create policy "Users enqueue own emails"
on public.email_queue for insert to authenticated
with check (true);

drop policy if exists "Anon enqueue contact emails" on public.email_queue;
create policy "Anon enqueue contact emails"
on public.email_queue for insert to anon
with check (kind in ('contact_ack', 'generic'));

-- ---------------------------------------------------------------------------
-- 11) expire RPC
-- ---------------------------------------------------------------------------
create or replace function public.expire_outdated_jobs()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.jobs
  set status = 'expired', updated_at = now()
  where status = 'active'
    and expires_at is not null
    and expires_at < now();
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- 12) Storage buckets + policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('cvs', 'cvs', true),
  ('job-images', 'job-images', true)
on conflict (id) do nothing;

drop policy if exists "Users upload own avatars" on storage.objects;
create policy "Users upload own avatars"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update own avatars" on storage.objects;
create policy "Users update own avatars"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users upload own cvs" on storage.objects;
create policy "Users upload own cvs"
on storage.objects for insert to authenticated
with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update own cvs" on storage.objects;
create policy "Users update own cvs"
on storage.objects for update to authenticated
using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users upload own job images" on storage.objects;
create policy "Users upload own job images"
on storage.objects for insert to authenticated
with check (bucket_id = 'job-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update own job images" on storage.objects;
create policy "Users update own job images"
on storage.objects for update to authenticated
using (bucket_id = 'job-images' and (storage.foldername(name))[1] = auth.uid()::text);

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

-- =============================================================================
-- BİTTİ. Sonraki: Auth → URL Configuration → Site URL = https://izmirisilanlari35.com
-- Railway Variables → VITE_PUBLIC_SUPABASE_URL + VITE_PUBLIC_SUPABASE_ANON_KEY → Redeploy
-- =============================================================================
