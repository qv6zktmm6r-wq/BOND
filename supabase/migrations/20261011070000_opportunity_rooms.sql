-- Shared Opportunity Rooms. A signed-in member opens a room as one of their published companies
-- (the host) and invites other published companies. An invited company's owner sees the room's
-- name, project description, needs, and host, and accepts or declines; only the host and companies
-- that joined see the team, conversation, and meetings. Proposals are sealed: only the host and the
-- company that sent one can read it. Only the host changes needs, invites or removes companies,
-- schedules or cancels meetings, shortlists or declines proposals, and closes (deletes) the room.
-- Members post messages, send or withdraw their own proposals, and leave. Notes about joining,
-- leaving, and meetings are written by the database. No account id is readable by members.
-- Limits: 20 open rooms and 10 new rooms a day per account; 8 invited companies per room and 40
-- invitations a day; 300 room messages a day; 20 meetings per room; 3 proposals per company per
-- room and 20 proposals a day.

create table public.opportunity_rooms (
  id uuid primary key default gen_random_uuid(),
  host_profile_id uuid not null references public.company_profiles (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) <= 80),
  brief text not null default '' check (char_length(brief) <= 1500),
  needs text[] not null default '{}' check (
    cardinality(needs) <= 8
    and needs <@ array['software', 'logistics', 'construction', 'engineering', 'manufacturing', 'energy', 'aerospace', 'program']::text[]
  ),
  city text not null default '' check (char_length(city) <= 80),
  preference text not null default '' check (preference in ('', 'Veteran-owned', 'Woman-owned', 'Small business')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunity_rooms_text_plain check (
    private.text_is_plain(title, false) and private.text_has_content(title)
    and private.text_is_plain(brief, true) and private.text_is_plain(city, false)
  )
);

create index opportunity_rooms_user_idx on public.opportunity_rooms (user_id);
create index opportunity_rooms_host_idx on public.opportunity_rooms (host_profile_id);

create table public.opportunity_room_members (
  room_id uuid not null references public.opportunity_rooms (id) on delete cascade,
  profile_id uuid not null references public.company_profiles (id) on delete cascade,
  needs text[] not null default '{}' check (
    cardinality(needs) <= 8
    and needs <@ array['software', 'logistics', 'construction', 'engineering', 'manufacturing', 'energy', 'aerospace', 'program']::text[]
  ),
  status text not null default 'invited' check (status in ('invited', 'joined', 'declined')),
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (room_id, profile_id)
);

create index opportunity_room_members_profile_idx on public.opportunity_room_members (profile_id);

create table public.opportunity_room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.opportunity_rooms (id) on delete cascade,
  profile_id uuid references public.company_profiles (id) on delete set null,
  kind text not null default 'message' check (kind in ('message', 'note')),
  body text not null check (char_length(body) <= 1000),
  created_at timestamptz not null default now(),
  constraint opportunity_room_messages_text_plain check (private.text_is_plain(body, true) and private.text_has_content(body))
);

create index opportunity_room_messages_room_idx on public.opportunity_room_messages (room_id, created_at);
create index opportunity_room_messages_profile_idx on public.opportunity_room_messages (profile_id);

create table public.opportunity_room_meetings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.opportunity_rooms (id) on delete cascade,
  topic text not null check (char_length(topic) <= 100),
  starts_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes in (30, 45, 60, 90)),
  link text not null default '' check (
    char_length(link) <= 300 and (link = '' or link ~ '^https://[^[:space:]/?#@\\]+([/?#][^[:space:]]*)?$')
  ),
  created_at timestamptz not null default now(),
  constraint opportunity_room_meetings_text_plain check (
    private.text_is_plain(topic, false) and private.text_has_content(topic) and private.text_is_plain(link, false)
  )
);

create index opportunity_room_meetings_room_idx on public.opportunity_room_meetings (room_id, starts_at);

create table public.opportunity_room_proposals (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  profile_id uuid not null,
  title text not null check (char_length(title) <= 100),
  price text not null default '' check (char_length(price) <= 40),
  timeline text not null default '' check (char_length(timeline) <= 60),
  summary text not null check (char_length(summary) <= 800),
  status text not null default 'new' check (status in ('new', 'shortlisted', 'declined')),
  created_at timestamptz not null default now(),
  foreign key (room_id, profile_id) references public.opportunity_room_members (room_id, profile_id) on delete cascade,
  constraint opportunity_room_proposals_text_plain check (
    private.text_is_plain(title, false) and private.text_has_content(title)
    and private.text_is_plain(price, false) and private.text_is_plain(timeline, false)
    and private.text_is_plain(summary, true) and private.text_has_content(summary)
  )
);

create index opportunity_room_proposals_room_idx on public.opportunity_room_proposals (room_id, created_at);
create index opportunity_room_proposals_member_idx on public.opportunity_room_proposals (room_id, profile_id);
create index opportunity_room_proposals_profile_idx on public.opportunity_room_proposals (profile_id);

create table private.opportunity_room_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

create index opportunity_room_log_user_idx on private.opportunity_room_log (user_id, action, created_at desc);

-- The caller's place in a room: 'host', 'member' (one of their companies joined), 'invited', or null.
create function private.room_role(room uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.opportunity_rooms as r where r.id = room and r.user_id = (select auth.uid())
    ) then 'host'
    when exists (
      select 1 from public.opportunity_room_members as m
      join public.company_profile_owners as o on o.profile_id = m.profile_id
      where m.room_id = room and m.status = 'joined' and o.owner_id = (select auth.uid())
    ) then 'member'
    when exists (
      select 1 from public.opportunity_room_members as m
      join public.company_profile_owners as o on o.profile_id = m.profile_id
      where m.room_id = room and m.status = 'invited' and o.owner_id = (select auth.uid())
    ) then 'invited'
  end
$$;

revoke all on function private.room_role(uuid) from public, anon;
grant execute on function private.room_role(uuid) to authenticated;

create function private.room_limit(member uuid, act text, most integer, message text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('room-log:' || act || ':' || member::text, 0));
  delete from private.opportunity_room_log
  where user_id = member and action = act and created_at < pg_catalog.now() - interval '2 days';
  if (select count(*) from private.opportunity_room_log
      where user_id = member and action = act and created_at > pg_catalog.now() - interval '1 day') >= most then
    raise exception '%', message using errcode = 'check_violation';
  end if;
  insert into private.opportunity_room_log (user_id, action) values (member, act);
end;
$$;

revoke all on function private.room_limit(uuid, text, integer, text) from public, anon, authenticated;

create function private.room_note(room uuid, author uuid, note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.opportunity_room_messages (room_id, profile_id, kind, body)
  values (room, author, 'note', pg_catalog.left(note, 1000));
end;
$$;

revoke all on function private.room_note(uuid, uuid, text) from public, anon, authenticated;

create function private.profile_name(profile uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select name from public.company_profiles where id = profile), 'A company')
$$;

revoke all on function private.profile_name(uuid) from public, anon, authenticated;

create function private.opportunity_rooms_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if tg_op = 'UPDATE' then
    if pg_catalog.pg_trigger_depth() > 1 then
      return new;
    end if;
    if caller is null or old.user_id <> caller then
      raise exception 'Only the room''s host can change it.' using errcode = 'insufficient_privilege';
    end if;
    new.updated_at := pg_catalog.now();
    return new;
  end if;
  if caller is null or new.user_id is distinct from caller then
    raise exception 'Sign in to open a room.' using errcode = 'insufficient_privilege';
  end if;
  if not private.owns_profile(new.host_profile_id, caller) then
    raise exception 'You can only open a room as one of your own published companies.' using errcode = 'insufficient_privilege';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('rooms:' || caller::text, 0));
  if (select count(*) from public.opportunity_rooms where user_id = caller) >= 20 then
    raise exception 'You can have up to 20 open rooms. Close one first.' using errcode = 'check_violation';
  end if;
  perform private.room_limit(caller, 'room', 10, 'You can open up to 10 rooms a day.');
  new.created_at := pg_catalog.now();
  new.updated_at := new.created_at;
  return new;
end;
$$;

create trigger opportunity_rooms_guard
before insert or update on public.opportunity_rooms
for each row execute function private.opportunity_rooms_guard();

create function private.opportunity_rooms_opened()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.room_note(new.id, new.host_profile_id, private.profile_name(new.host_profile_id) || ' opened the room.');
  return null;
end;
$$;

create trigger opportunity_rooms_opened
after insert on public.opportunity_rooms
for each row execute function private.opportunity_rooms_opened();

create function private.opportunity_room_members_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  host uuid;
begin
  if tg_op = 'UPDATE' then
    if new.status is not distinct from old.status then
      return new;
    end if;
    if caller is null or not private.owns_profile(old.profile_id, caller) then
      raise exception 'Only the invited company can answer an invitation.' using errcode = 'insufficient_privilege';
    end if;
    if old.status <> 'invited' or new.status not in ('joined', 'declined') then
      raise exception 'This invitation was already answered.' using errcode = 'check_violation';
    end if;
    new.responded_at := pg_catalog.now();
    return new;
  end if;
  select r.user_id into host from public.opportunity_rooms as r where r.id = new.room_id;
  if caller is null or host is distinct from caller then
    raise exception 'Only the room''s host can invite companies.' using errcode = 'insufficient_privilege';
  end if;
  if private.owns_profile(new.profile_id, caller) then
    raise exception 'You can''t invite your own company.' using errcode = 'check_violation';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('room:' || new.room_id::text, 0));
  if exists (
    select 1 from public.opportunity_room_members as m where m.room_id = new.room_id and m.profile_id = new.profile_id
  ) then
    return null;
  end if;
  if (select count(*) from public.opportunity_room_members as m where m.room_id = new.room_id) >= 8 then
    raise exception 'A room holds up to 8 invited companies.' using errcode = 'check_violation';
  end if;
  perform private.room_limit(caller, 'invite', 40, 'You can send up to 40 room invitations a day.');
  new.status := 'invited';
  new.invited_at := pg_catalog.now();
  new.responded_at := null;
  return new;
end;
$$;

create trigger opportunity_room_members_guard
before insert or update on public.opportunity_room_members
for each row execute function private.opportunity_room_members_guard();

create function private.opportunity_room_members_notes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  host_profile uuid;
begin
  if tg_op = 'DELETE' then
    select r.host_profile_id into host_profile from public.opportunity_rooms as r where r.id = old.room_id;
    if not found or not exists (select 1 from public.company_profiles where id = old.profile_id) then
      return null;
    end if;
    if private.owns_profile(old.profile_id, (select auth.uid())) then
      if old.status <> 'declined' then
        perform private.room_note(old.room_id, old.profile_id, private.profile_name(old.profile_id)
          || case when old.status = 'joined' then ' left the room.' else ' declined the invitation.' end);
      end if;
    else
      perform private.room_note(old.room_id, host_profile, private.profile_name(old.profile_id) || ' was removed from the room.');
    end if;
    return null;
  end if;
  if tg_op = 'INSERT' then
    select r.host_profile_id into host_profile from public.opportunity_rooms as r where r.id = new.room_id;
    perform private.room_note(new.room_id, host_profile,
      private.profile_name(host_profile) || ' invited ' || private.profile_name(new.profile_id) || '.');
  elsif new.status is distinct from old.status then
    perform private.room_note(new.room_id, new.profile_id, private.profile_name(new.profile_id)
      || case when new.status = 'joined' then ' joined the room.' else ' declined the invitation.' end);
  end if;
  return null;
end;
$$;

create trigger opportunity_room_members_notes
after insert or update or delete on public.opportunity_room_members
for each row execute function private.opportunity_room_members_notes();

create function private.opportunity_room_messages_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if pg_catalog.pg_trigger_depth() > 1 then
    new.created_at := pg_catalog.now();
    return new;
  end if;
  new.kind := 'message';
  if caller is null or new.profile_id is null or not private.owns_profile(new.profile_id, caller) or not (
    exists (
      select 1 from public.opportunity_rooms as r
      where r.id = new.room_id and r.host_profile_id = new.profile_id and r.user_id = caller
    )
    or exists (
      select 1 from public.opportunity_room_members as m
      where m.room_id = new.room_id and m.profile_id = new.profile_id and m.status = 'joined'
    )
  ) then
    raise exception 'Post as one of your companies in this room.' using errcode = 'insufficient_privilege';
  end if;
  perform private.room_limit(caller, 'message', 300, 'You can send up to 300 room messages a day.');
  new.created_at := pg_catalog.now();
  return new;
end;
$$;

create trigger opportunity_room_messages_guard
before insert on public.opportunity_room_messages
for each row execute function private.opportunity_room_messages_guard();

create function private.opportunity_room_touch()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.opportunity_rooms set updated_at = pg_catalog.now() where id = new.room_id;
  return null;
end;
$$;

create trigger opportunity_room_messages_touch
after insert on public.opportunity_room_messages
for each row execute function private.opportunity_room_touch();

create function private.opportunity_room_meetings_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null or not exists (
    select 1 from public.opportunity_rooms as r where r.id = new.room_id and r.user_id = caller
  ) then
    raise exception 'Only the room''s host can schedule meetings.' using errcode = 'insufficient_privilege';
  end if;
  if new.starts_at <= pg_catalog.now() then
    raise exception 'Pick a date and start time in the future.' using errcode = 'check_violation';
  end if;
  if new.starts_at > pg_catalog.now() + interval '366 days' then
    raise exception 'Pick a date within the next year.' using errcode = 'check_violation';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('room:' || new.room_id::text, 0));
  if (select count(*) from public.opportunity_room_meetings as m where m.room_id = new.room_id) >= 20 then
    raise exception 'A room holds up to 20 meetings. Remove an old one first.' using errcode = 'check_violation';
  end if;
  new.created_at := pg_catalog.now();
  return new;
end;
$$;

create trigger opportunity_room_meetings_guard
before insert on public.opportunity_room_meetings
for each row execute function private.opportunity_room_meetings_guard();

create function private.opportunity_room_meetings_notes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  host_profile uuid;
begin
  if tg_op = 'INSERT' then
    select r.host_profile_id into host_profile from public.opportunity_rooms as r where r.id = new.room_id;
    perform private.room_note(new.room_id, host_profile, private.profile_name(host_profile) || ' scheduled "' || new.topic || '".');
    return null;
  end if;
  select r.host_profile_id into host_profile from public.opportunity_rooms as r where r.id = old.room_id;
  if found and old.starts_at > pg_catalog.now() then
    perform private.room_note(old.room_id, host_profile, private.profile_name(host_profile) || ' canceled "' || old.topic || '".');
  end if;
  return null;
end;
$$;

create trigger opportunity_room_meetings_notes
after insert or delete on public.opportunity_room_meetings
for each row execute function private.opportunity_room_meetings_notes();

create function private.opportunity_room_proposals_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if tg_op = 'UPDATE' then
    if new.status is not distinct from old.status then
      return new;
    end if;
    if caller is null or not exists (
      select 1 from public.opportunity_rooms as r where r.id = old.room_id and r.user_id = caller
    ) then
      raise exception 'Only the room''s host can shortlist or decline proposals.' using errcode = 'insufficient_privilege';
    end if;
    return new;
  end if;
  if caller is null or not private.owns_profile(new.profile_id, caller) or not exists (
    select 1 from public.opportunity_room_members as m
    where m.room_id = new.room_id and m.profile_id = new.profile_id and m.status = 'joined'
  ) then
    raise exception 'Only companies that joined this room can send proposals.' using errcode = 'insufficient_privilege';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('room:' || new.room_id::text || ':' || new.profile_id::text, 0));
  if (select count(*) from public.opportunity_room_proposals as p
      where p.room_id = new.room_id and p.profile_id = new.profile_id) >= 3 then
    raise exception 'A company can send up to 3 proposals per room. Withdraw one first.' using errcode = 'check_violation';
  end if;
  perform private.room_limit(caller, 'proposal', 20, 'You can send up to 20 proposals a day.');
  new.status := 'new';
  new.created_at := pg_catalog.now();
  return new;
end;
$$;

create trigger opportunity_room_proposals_guard
before insert or update on public.opportunity_room_proposals
for each row execute function private.opportunity_room_proposals_guard();

alter table public.opportunity_rooms enable row level security;
alter table public.opportunity_room_members enable row level security;
alter table public.opportunity_room_messages enable row level security;
alter table public.opportunity_room_meetings enable row level security;
alter table public.opportunity_room_proposals enable row level security;

create policy "The host, members, and invited companies see a room"
on public.opportunity_rooms for select
to authenticated
using (private.room_role(id) is not null);

create policy "Members open rooms as their companies"
on public.opportunity_rooms for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

create policy "The host changes a room"
on public.opportunity_rooms for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "The host closes a room"
on public.opportunity_rooms for delete
to authenticated
using (user_id = (select auth.uid()));

create policy "The host and members see the team; companies see their own invitations"
on public.opportunity_room_members for select
to authenticated
using (
  private.room_role(room_id) in ('host', 'member')
  or exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = opportunity_room_members.profile_id and owner.owner_id = (select auth.uid())
  )
);

create policy "The host invites companies"
on public.opportunity_room_members for insert
to authenticated
with check (
  private.room_role(room_id) = 'host'
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

create policy "Invited companies answer their invitations"
on public.opportunity_room_members for update
to authenticated
using (exists (
  select 1 from public.company_profile_owners as owner
  where owner.profile_id = opportunity_room_members.profile_id and owner.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.company_profile_owners as owner
  where owner.profile_id = opportunity_room_members.profile_id and owner.owner_id = (select auth.uid())
));

create policy "The host removes companies and companies leave"
on public.opportunity_room_members for delete
to authenticated
using (
  private.room_role(room_id) = 'host'
  or exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = opportunity_room_members.profile_id and owner.owner_id = (select auth.uid())
  )
);

create policy "The host and members read the conversation"
on public.opportunity_room_messages for select
to authenticated
using (private.room_role(room_id) in ('host', 'member'));

create policy "The host and members post in the conversation"
on public.opportunity_room_messages for insert
to authenticated
with check (
  private.room_role(room_id) in ('host', 'member')
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

create policy "The host and members see meetings"
on public.opportunity_room_meetings for select
to authenticated
using (private.room_role(room_id) in ('host', 'member'));

create policy "The host schedules meetings"
on public.opportunity_room_meetings for insert
to authenticated
with check (
  private.room_role(room_id) = 'host'
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

create policy "The host cancels meetings"
on public.opportunity_room_meetings for delete
to authenticated
using (private.room_role(room_id) = 'host');

create policy "The host and the sending company see a proposal"
on public.opportunity_room_proposals for select
to authenticated
using (
  private.room_role(room_id) = 'host'
  or exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = opportunity_room_proposals.profile_id and owner.owner_id = (select auth.uid())
  )
);

create policy "Members send proposals as their companies"
on public.opportunity_room_proposals for insert
to authenticated
with check (
  exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = opportunity_room_proposals.profile_id and owner.owner_id = (select auth.uid())
  )
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

create policy "The host shortlists or declines proposals"
on public.opportunity_room_proposals for update
to authenticated
using (private.room_role(room_id) = 'host')
with check (private.room_role(room_id) = 'host');

create policy "The sending company withdraws its proposals"
on public.opportunity_room_proposals for delete
to authenticated
using (exists (
  select 1 from public.company_profile_owners as owner
  where owner.profile_id = opportunity_room_proposals.profile_id and owner.owner_id = (select auth.uid())
));

revoke all on public.opportunity_rooms from anon, authenticated;
grant select (id, host_profile_id, title, brief, needs, city, preference, created_at, updated_at) on public.opportunity_rooms to authenticated;
grant insert (id, host_profile_id, title, brief, needs, city, preference) on public.opportunity_rooms to authenticated;
grant update (needs) on public.opportunity_rooms to authenticated;
grant delete on public.opportunity_rooms to authenticated;

revoke all on public.opportunity_room_members from anon, authenticated;
grant select (room_id, profile_id, needs, status, invited_at, responded_at) on public.opportunity_room_members to authenticated;
grant insert (room_id, profile_id, needs) on public.opportunity_room_members to authenticated;
grant update (status) on public.opportunity_room_members to authenticated;
grant delete on public.opportunity_room_members to authenticated;

revoke all on public.opportunity_room_messages from anon, authenticated;
grant select (id, room_id, profile_id, kind, body, created_at) on public.opportunity_room_messages to authenticated;
grant insert (room_id, profile_id, body) on public.opportunity_room_messages to authenticated;

revoke all on public.opportunity_room_meetings from anon, authenticated;
grant select (id, room_id, topic, starts_at, duration_minutes, link, created_at) on public.opportunity_room_meetings to authenticated;
grant insert (room_id, topic, starts_at, duration_minutes, link) on public.opportunity_room_meetings to authenticated;
grant delete on public.opportunity_room_meetings to authenticated;

revoke all on public.opportunity_room_proposals from anon, authenticated;
grant select (id, room_id, profile_id, title, price, timeline, summary, status, created_at) on public.opportunity_room_proposals to authenticated;
grant insert (room_id, profile_id, title, price, timeline, summary) on public.opportunity_room_proposals to authenticated;
grant update (status) on public.opportunity_room_proposals to authenticated;
grant delete on public.opportunity_room_proposals to authenticated;
