-- =============================================================================
-- İzmir İş İlanları 35 — Tek seferlik şema (Supabase SQL Editor)
-- Manuel: Bu dosyayı kendi supabase.co projenizde çalıştırın.
-- =============================================================================

-- Profiller
alter table public.profiles
  add column if not exists cv_url text;

alter table public.profiles
  add column if not exists vergi_numarasi text;

alter table public.profiles
  add column if not exists dogrulama_durumu text default 'unverified';

alter table public.profiles
  add column if not exists dogrulama_talebi_tarihi timestamptz;

alter table public.profiles
  add column if not exists dogrulanma_tarihi timestamptz;

-- İletişim
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "Anyone can insert contact" on public.contact_messages;
create policy "Anyone can insert contact"
on public.contact_messages for insert
to anon, authenticated
with check (true);

-- Ödemeler (iyzico sonrası payment_id dolar)
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists job_payments_employer_idx on public.job_payments(employer_id);
create index if not exists job_payments_status_idx on public.job_payments(status);

alter table public.job_payments enable row level security;

drop policy if exists "Employers read own payments" on public.job_payments;
create policy "Employers read own payments"
on public.job_payments for select to authenticated
using (employer_id = auth.uid() or exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

drop policy if exists "Employers insert own payments" on public.job_payments;
create policy "Employers insert own payments"
on public.job_payments for insert to authenticated
with check (employer_id = auth.uid());

drop policy if exists "Employers update own payments" on public.job_payments;
create policy "Employers update own payments"
on public.job_payments for update to authenticated
using (employer_id = auth.uid() or exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

-- İlan yayınlama hakları
create table if not exists public.employer_credits (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  payment_id uuid references public.job_payments(id) on delete set null,
  package_id text not null,
  package_name text not null,
  duration_days integer not null,
  featured boolean not null default false,
  remaining integer not null default 1,
  created_at timestamptz default now()
);

create index if not exists employer_credits_employer_idx on public.employer_credits(employer_id);

alter table public.employer_credits enable row level security;

drop policy if exists "Employers manage own credits" on public.employer_credits;
create policy "Employers manage own credits"
on public.employer_credits for all to authenticated
using (employer_id = auth.uid() or exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
))
with check (employer_id = auth.uid() or exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

-- Süresi dolan ilanları kapat
create or replace function public.expire_outdated_jobs()
returns integer
language plpgsql
security definer
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

-- Storage bucket'ları
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

-- Bildirimler (uygulama içi)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz default now()
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

-- İşveren kendi ilanını güncelleyebilir (RLS örnekleri — mevcut politikalarla çakışırsa düzenleyin)
drop policy if exists "Employers update own jobs" on public.jobs;
create policy "Employers update own jobs"
on public.jobs for update to authenticated
using (employer_id = auth.uid() or exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

-- E-posta kuyruğu (Resend/SendGrid worker ile işlenecek)
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
  created_at timestamptz default now(),
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

-- pg_cron varsa günlük expire (extension yoksa bu blok atlanabilir)
-- select cron.schedule('expire-jobs-daily', '0 3 * * *', $$select public.expire_outdated_jobs();$$);
