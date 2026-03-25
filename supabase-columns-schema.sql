create extension if not exists pgcrypto;

create table if not exists public.columns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author_user_id uuid not null default auth.uid(),
  section text not null check (section in ('blog', 'media')),
  title text not null,
  excerpt text not null default '',
  link text not null,
  tag text not null default '기타',
  date_text text not null default '',
  image_url text not null default '',
  published boolean not null default true
);

alter table public.columns enable row level security;

drop policy if exists "public read published columns" on public.columns;
create policy "public read published columns"
on public.columns for select
using (published = true);

drop policy if exists "authenticated read all columns" on public.columns;
create policy "authenticated read all columns"
on public.columns for select
to authenticated
using (true);

drop policy if exists "authenticated insert own columns" on public.columns;
create policy "authenticated insert own columns"
on public.columns for insert
to authenticated
with check (auth.uid() = author_user_id);

drop policy if exists "authenticated update own columns" on public.columns;
create policy "authenticated update own columns"
on public.columns for update
to authenticated
using (auth.uid() = author_user_id)
with check (auth.uid() = author_user_id);

drop policy if exists "authenticated delete own columns" on public.columns;
create policy "authenticated delete own columns"
on public.columns for delete
to authenticated
using (auth.uid() = author_user_id);
