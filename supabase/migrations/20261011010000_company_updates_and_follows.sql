-- Activity feed: updates posted by member companies, readable by everyone, plus each member's
-- private list of followed companies. Neither table exposes who owns a company, and follows are
-- visible only to the member who made them.

create table public.company_updates (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.company_profiles (id) on delete cascade,
  type text not null check (type in ('project', 'capability', 'partnership', 'hiring', 'event')),
  text text not null check (char_length(text) <= 500 and btrim(text) <> ''),
  created_at timestamptz not null default now()
);

create index company_updates_profile_id_idx on public.company_updates (profile_id);
create index company_updates_created_at_idx on public.company_updates (created_at desc);

create table private.company_update_log (
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index company_update_log_owner_idx on private.company_update_log (owner_id, created_at desc);

create or replace function private.company_updates_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  poster uuid;
begin
  select owner.owner_id into poster from public.company_profile_owners as owner where owner.profile_id = new.profile_id;
  if poster is null or ((select auth.uid()) is not null and poster <> (select auth.uid())) then
    raise exception 'Updates can only be shared for your own companies.' using errcode = 'insufficient_privilege';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('updates:' || poster::text, 0));
  if (select count(*) from public.company_updates where profile_id = new.profile_id) >= 100 then
    raise exception 'Each company can have up to 100 updates.' using errcode = 'check_violation';
  end if;
  if (select count(*) from private.company_update_log
      where owner_id = poster and created_at > pg_catalog.now() - interval '1 day') >= 20 then
    raise exception 'You can share up to 20 updates a day.' using errcode = 'check_violation';
  end if;
  insert into private.company_update_log (owner_id) values (poster);
  new.created_at := pg_catalog.now();
  return new;
end;
$$;

create trigger company_updates_guard
before insert on public.company_updates
for each row execute function private.company_updates_guard();

alter table public.company_updates enable row level security;

create policy "Anyone can read company updates"
on public.company_updates for select
to anon, authenticated
using (true);

create policy "Members share updates for their own companies"
on public.company_updates for insert
to authenticated
with check (
  exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = company_updates.profile_id and owner.owner_id = (select auth.uid())
  )
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

create policy "Members delete their own companies' updates"
on public.company_updates for delete
to authenticated
using (
  exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = company_updates.profile_id and owner.owner_id = (select auth.uid())
  )
);

revoke all on public.company_updates from anon, authenticated;
grant select on public.company_updates to anon, authenticated;
grant insert (profile_id, type, text) on public.company_updates to authenticated;
grant delete on public.company_updates to authenticated;

create table public.company_follows (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  profile_id uuid not null references public.company_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, profile_id)
);

create index company_follows_profile_id_idx on public.company_follows (profile_id);

create or replace function private.company_follows_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('follows:' || new.user_id::text, 0));
  if (select count(*) from public.company_follows where user_id = new.user_id) >= 500 then
    raise exception 'You can follow up to 500 companies.' using errcode = 'check_violation';
  end if;
  new.created_at := pg_catalog.now();
  return new;
end;
$$;

create trigger company_follows_guard
before insert on public.company_follows
for each row execute function private.company_follows_guard();

alter table public.company_follows enable row level security;

create policy "Members see the companies they follow"
on public.company_follows for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Members follow companies"
on public.company_follows for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

create policy "Members unfollow companies"
on public.company_follows for delete
to authenticated
using (user_id = (select auth.uid()));

revoke all on public.company_follows from anon, authenticated;
grant select (profile_id, created_at) on public.company_follows to authenticated;
grant insert (profile_id) on public.company_follows to authenticated;
grant delete on public.company_follows to authenticated;
