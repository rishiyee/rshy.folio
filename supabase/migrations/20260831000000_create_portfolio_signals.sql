create table if not exists public.portfolio_signals (
  id bigint generated always as identity primary key,
  reaction text not null check (reaction in ('design', 'build', 'idea', 'talk')),
  visitor_name text not null check (char_length(visitor_name) between 1 and 40),
  page_path text not null default '/' check (char_length(page_path) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.portfolio_signals enable row level security;

-- Portfolio visitors may leave feedback, but cannot read, edit, or delete the log.
drop policy if exists "Anyone can leave a portfolio signal"
on public.portfolio_signals;

create policy "Anyone can leave a portfolio signal"
on public.portfolio_signals
for insert
to anon, authenticated
with check (
  reaction in ('design', 'build', 'idea', 'talk')
  and char_length(visitor_name) between 1 and 40
  and char_length(page_path) between 1 and 500
);

create index if not exists portfolio_signals_created_at_idx
on public.portfolio_signals (created_at desc);

create table if not exists public.portfolio_visits (
  session_id uuid primary key,
  visitor_name text not null check (char_length(visitor_name) between 1 and 40),
  page_path text not null default '/' check (char_length(page_path) between 1 and 500),
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.portfolio_visits enable row level security;

drop policy if exists "Anyone can start an anonymous portfolio visit"
on public.portfolio_visits;

create policy "Anyone can start an anonymous portfolio visit"
on public.portfolio_visits
for insert
to anon, authenticated
with check (
  char_length(visitor_name) between 1 and 40
  and char_length(page_path) between 1 and 500
);

drop policy if exists "Visitors can update an anonymous visit heartbeat"
on public.portfolio_visits;

create policy "Visitors can update an anonymous visit heartbeat"
on public.portfolio_visits
for update
to anon, authenticated
using (true)
with check (last_seen_at >= started_at);

create index if not exists portfolio_visits_started_at_idx
on public.portfolio_visits (started_at desc);

create or replace function public.get_portfolio_visit_stats()
returns table (total_visits bigint, average_seconds bigint)
language sql
security definer
set search_path = public
as $$
  select
    count(*)::bigint,
    coalesce(avg(extract(epoch from (last_seen_at - started_at))), 0)::bigint
  from public.portfolio_visits;
$$;

revoke all on function public.get_portfolio_visit_stats() from public;
grant execute on function public.get_portfolio_visit_stats() to anon, authenticated;
