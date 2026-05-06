create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'guidebook_landing',
  guidebook_slug text not null default 'transfer-english-input-roadmap-v1',
  referrer text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads enable row level security;

grant usage on schema public to service_role;
grant select, insert, update on public.leads to service_role;

create policy "No public lead reads"
on public.leads
for select
to anon, authenticated
using (false);

create policy "No public lead writes"
on public.leads
for insert
to anon, authenticated
with check (false);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_source_idx on public.leads (source);
