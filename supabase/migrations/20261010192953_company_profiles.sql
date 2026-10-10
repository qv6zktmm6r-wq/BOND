-- Company profiles published by signed-in BOND members, plus their logo and cover images.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.longest_item(items text[])
returns integer
language sql
immutable
set search_path = ''
as $$
  select coalesce(max(pg_catalog.char_length(item)), 0) from pg_catalog.unnest(items) as item
$$;

create table public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  industry text not null check (industry in (
    'Aerospace & Defense', 'Construction', 'Engineering', 'Manufacturing', 'Technology',
    'Logistics', 'Energy', 'Professional services', 'Other industry'
  )),
  description text not null check (char_length(btrim(description)) between 1 and 500),
  location text not null default '' check (char_length(location) <= 100),
  tagline text not null default '' check (char_length(tagline) <= 100),
  story text not null default '' check (char_length(story) <= 1200),
  services text[] not null default '{}' check (cardinality(services) <= 6 and private.longest_item(services) <= 60),
  certifications text[] not null default '{}' check (cardinality(certifications) <= 6 and private.longest_item(certifications) <= 80),
  projects text[] not null default '{}' check (cardinality(projects) <= 3 and private.longest_item(projects) <= 100),
  service_area text not null default '' check (char_length(service_area) <= 150),
  company_size text not null default '' check (company_size in ('', '1–10 people', '11–50 people', '51–200 people', 'More than 200 people')),
  ownership text not null default 'Not specified' check (ownership in ('Not specified', 'Veteran-owned', 'Woman-owned', 'Small business')),
  representative text not null default '' check (char_length(representative) <= 80),
  website text not null default '' check (website = '' or (char_length(website) <= 2048 and website ~ '^https?://[^\s@/]+')),
  publish_contact boolean not null default false,
  public_email text not null default '' check (char_length(public_email) <= 160),
  public_phone text not null default '' check (char_length(public_phone) <= 40),
  logo_path text not null default '' check (logo_path = '' or (logo_path like owner_id::text || '/%' and logo_path !~ '\.\.' and char_length(logo_path) <= 200)),
  cover_path text not null default '' check (cover_path = '' or (cover_path like owner_id::text || '/%' and cover_path !~ '\.\.' and char_length(cover_path) <= 200)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Contact details are only stored when the company chose to show them, so nothing hidden is publicly readable.
  constraint contact_only_when_published check (publish_contact or (public_email = '' and public_phone = ''))
);

create index company_profiles_owner_id_idx on public.company_profiles (owner_id);
create index company_profiles_created_at_idx on public.company_profiles (created_at desc);

create or replace function private.company_profiles_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (select count(*) from public.company_profiles where owner_id = new.owner_id) >= 5 then
      raise exception 'Each account can have up to 5 company profiles.' using errcode = 'check_violation';
    end if;
    new.created_at := now();
  else
    new.owner_id := old.owner_id;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger company_profiles_guard
before insert or update on public.company_profiles
for each row execute function private.company_profiles_guard();

alter table public.company_profiles enable row level security;

create policy "Anyone can read company profiles"
on public.company_profiles for select
to anon, authenticated
using (true);

create policy "Members add their own company profiles"
on public.company_profiles for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Members update their own company profiles"
on public.company_profiles for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "Members delete their own company profiles"
on public.company_profiles for delete
to authenticated
using ((select auth.uid()) = owner_id);

revoke all on public.company_profiles from anon, authenticated;
grant select on public.company_profiles to anon, authenticated;
grant insert, update, delete on public.company_profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('company-media', 'company-media', true, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Members read their own company media"
on storage.objects for select
to authenticated
using (bucket_id = 'company-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Members upload their own company media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'company-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Members replace their own company media"
on storage.objects for update
to authenticated
using (bucket_id = 'company-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'company-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Members delete their own company media"
on storage.objects for delete
to authenticated
using (bucket_id = 'company-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
