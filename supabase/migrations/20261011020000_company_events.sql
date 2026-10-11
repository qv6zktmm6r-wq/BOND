-- Events hosted by member companies, readable by everyone, with RSVPs that reach the host. Join links
-- live in their own table so only the host and people who RSVP can read them. An RSVP shows the host
-- the attending company (or nothing, for members attending as themselves) and never an account id;
-- the public sees only the going count.

create table public.company_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.company_profiles (id) on delete cascade,
  title text not null check (char_length(title) <= 100 and btrim(title) <> ''),
  format text not null check (format in ('online', 'in-person', 'hybrid')),
  starts_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes in (30, 45, 60, 90, 120, 180, 240)),
  location text not null default '' check (char_length(location) <= 120),
  description text not null check (char_length(description) <= 800 and btrim(description) <> ''),
  capacity integer not null default 0 check (capacity between 0 and 5000),
  going integer not null default 0 check (going >= 0),
  created_at timestamptz not null default now(),
  constraint company_events_location_matches_format check (
    (format = 'online' and location = '') or (format <> 'online' and btrim(location) <> '')
  ),
  constraint company_events_text_visible check (
    title || location || description !~ '[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]'
  )
);

create index company_events_profile_id_idx on public.company_events (profile_id);
create index company_events_starts_at_idx on public.company_events (starts_at);

create table public.company_event_links (
  event_id uuid primary key references public.company_events (id) on delete cascade,
  link text not null check (
    char_length(link) <= 300 and link ~ '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
  )
);

create table public.company_event_rsvps (
  event_id uuid not null references public.company_events (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  profile_id uuid references public.company_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index company_event_rsvps_user_id_idx on public.company_event_rsvps (user_id);
create index company_event_rsvps_profile_id_idx on public.company_event_rsvps (profile_id);

create table private.company_event_log (
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index company_event_log_owner_idx on private.company_event_log (owner_id, created_at desc);

create table private.company_event_rsvp_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index company_event_rsvp_log_user_idx on private.company_event_rsvp_log (user_id, created_at desc);

create or replace function private.company_events_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  host uuid;
begin
  select owner.owner_id into host from public.company_profile_owners as owner where owner.profile_id = new.profile_id;
  if host is null or ((select auth.uid()) is not null and host <> (select auth.uid())) then
    raise exception 'Events can only be hosted by your own companies.' using errcode = 'insufficient_privilege';
  end if;
  if new.starts_at <= pg_catalog.now() or new.starts_at > pg_catalog.now() + interval '366 days' then
    raise exception 'Pick a start time in the future, within the next year.' using errcode = 'check_violation';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('events:' || host::text, 0));
  if (select count(*) from public.company_events as event
      where event.profile_id = new.profile_id
        and event.starts_at + pg_catalog.make_interval(mins => event.duration_minutes) > pg_catalog.now()) >= 20 then
    raise exception 'Each company can have up to 20 upcoming events.' using errcode = 'check_violation';
  end if;
  delete from private.company_event_log where owner_id = host and created_at < pg_catalog.now() - interval '2 days';
  if (select count(*) from private.company_event_log
      where owner_id = host and created_at > pg_catalog.now() - interval '1 day') >= 10 then
    raise exception 'You can schedule up to 10 events a day.' using errcode = 'check_violation';
  end if;
  insert into private.company_event_log (owner_id) values (host);
  new.going := 0;
  new.created_at := pg_catalog.now();
  return new;
end;
$$;

create trigger company_events_guard
before insert on public.company_events
for each row execute function private.company_events_guard();

-- Counts RSVPs into company_events.going and enforces capacity under a row lock on the event.
create or replace function private.company_event_rsvps_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event record;
begin
  if new.profile_id is not null and not exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = new.profile_id and owner.owner_id = new.user_id
  ) then
    raise exception 'You can only RSVP as one of your own companies.' using errcode = 'insufficient_privilege';
  end if;
  select e.profile_id, e.starts_at, e.duration_minutes, e.capacity, e.going into event
  from public.company_events as e where e.id = new.event_id for update;
  if not found then
    raise exception 'This event was cancelled.' using errcode = 'foreign_key_violation';
  end if;
  if exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = event.profile_id and owner.owner_id = new.user_id
  ) then
    raise exception 'You''re hosting this event.' using errcode = 'check_violation';
  end if;
  if event.starts_at + pg_catalog.make_interval(mins => event.duration_minutes) <= pg_catalog.now() then
    raise exception 'This event has ended.' using errcode = 'check_violation';
  end if;
  if event.capacity > 0 and event.going >= event.capacity then
    raise exception 'This event is full.' using errcode = 'check_violation';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('rsvps:' || new.user_id::text, 0));
  delete from private.company_event_rsvp_log where user_id = new.user_id and created_at < pg_catalog.now() - interval '2 days';
  if (select count(*) from private.company_event_rsvp_log
      where user_id = new.user_id and created_at > pg_catalog.now() - interval '1 day') >= 50 then
    raise exception 'You can RSVP to up to 50 events a day.' using errcode = 'check_violation';
  end if;
  insert into private.company_event_rsvp_log (user_id) values (new.user_id);
  update public.company_events set going = going + 1 where id = new.event_id;
  new.created_at := pg_catalog.now();
  return new;
end;
$$;

create trigger company_event_rsvps_guard
before insert on public.company_event_rsvps
for each row execute function private.company_event_rsvps_guard();

create or replace function private.company_event_rsvps_uncount()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.company_events set going = greatest(going - 1, 0) where id = old.event_id;
  return old;
end;
$$;

create trigger company_event_rsvps_uncount
after delete on public.company_event_rsvps
for each row execute function private.company_event_rsvps_uncount();

alter table public.company_events enable row level security;
alter table public.company_event_links enable row level security;
alter table public.company_event_rsvps enable row level security;

create policy "Anyone can read company events"
on public.company_events for select
to anon, authenticated
using (true);

create policy "Members host events for their own companies"
on public.company_events for insert
to authenticated
with check (
  exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = company_events.profile_id and owner.owner_id = (select auth.uid())
  )
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

create policy "Members cancel their own companies' events"
on public.company_events for delete
to authenticated
using (
  exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = company_events.profile_id and owner.owner_id = (select auth.uid())
  )
);

create policy "Attendees see their own RSVPs and hosts see RSVPs to their events"
on public.company_event_rsvps for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.company_events as event
    join public.company_profile_owners as owner on owner.profile_id = event.profile_id
    where event.id = company_event_rsvps.event_id and owner.owner_id = (select auth.uid())
  )
);

create policy "Members RSVP to events"
on public.company_event_rsvps for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

create policy "Attendees cancel their own RSVPs"
on public.company_event_rsvps for delete
to authenticated
using (user_id = (select auth.uid()));

-- The RSVP subquery is filtered by the RSVP table's own policy, so it matches only the caller's RSVP
-- (or, for the host, any RSVP to their event).
create policy "Hosts and attendees see join links"
on public.company_event_links for select
to authenticated
using (
  exists (
    select 1
    from public.company_events as event
    join public.company_profile_owners as owner on owner.profile_id = event.profile_id
    where event.id = company_event_links.event_id and owner.owner_id = (select auth.uid())
  )
  or exists (select 1 from public.company_event_rsvps as rsvp where rsvp.event_id = company_event_links.event_id)
);

create policy "Hosts add join links to their online and hybrid events"
on public.company_event_links for insert
to authenticated
with check (
  exists (
    select 1
    from public.company_events as event
    join public.company_profile_owners as owner on owner.profile_id = event.profile_id
    where event.id = company_event_links.event_id and event.format <> 'in-person'
      and owner.owner_id = (select auth.uid())
  )
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

revoke all on public.company_events from anon, authenticated;
grant select on public.company_events to anon, authenticated;
grant insert (profile_id, title, format, starts_at, duration_minutes, location, description, capacity)
  on public.company_events to authenticated;
grant delete on public.company_events to authenticated;

revoke all on public.company_event_links from anon, authenticated;
grant select (event_id, link) on public.company_event_links to authenticated;
grant insert (event_id, link) on public.company_event_links to authenticated;

revoke all on public.company_event_rsvps from anon, authenticated;
grant select (event_id, profile_id, created_at) on public.company_event_rsvps to authenticated;
grant insert (event_id, profile_id) on public.company_event_rsvps to authenticated;
grant delete on public.company_event_rsvps to authenticated;
