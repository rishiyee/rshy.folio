create table if not exists public.contact_inquiries (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  project_type text not null check (project_type in ('Brand', 'Product', 'Website', 'Other')),
  message text not null check (char_length(message) between 1 and 1200),
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now()
);

alter table public.contact_inquiries enable row level security;

drop policy if exists "Anyone can submit a contact inquiry"
on public.contact_inquiries;

-- Public clients may submit inquiries but cannot read, update, or delete them.
create policy "Anyone can submit a contact inquiry"
on public.contact_inquiries
for insert
to anon, authenticated
with check (
  status = 'new'
  and char_length(name) between 1 and 100
  and char_length(email) between 3 and 254
  and project_type in ('Brand', 'Product', 'Website', 'Other')
  and char_length(message) between 1 and 1200
);

create index if not exists contact_inquiries_created_at_idx
on public.contact_inquiries (created_at desc);

create index if not exists contact_inquiries_status_idx
on public.contact_inquiries (status, created_at desc);

