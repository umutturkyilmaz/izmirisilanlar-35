-- İletişim formu (bağımsız Supabase)
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
