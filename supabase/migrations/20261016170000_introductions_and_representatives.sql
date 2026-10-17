-- Introduction requests are stored for signed-in members and emailed to the company founder.
-- The email does not include who asked or how to contact them.
-- A founder can add up to four more people who can manage that company. Only the founder can delete it.

alter table private.mail_outbox drop constraint mail_outbox_kind_check;

alter table private.mail_outbox
  add constraint mail_outbox_kind_check check (kind in (
    'message', 'meeting', 'response', 'update', 'invite', 'room', 'proposal', 'reminder',
    'introduction', 'representative'
  ));

-- One company can have several managers. Mail still goes to the person who created the profile.
create or replace function private.profile_owner(profile uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select owner_id from public.company_profiles where id = profile
$$;

revoke all on function private.profile_owner(uuid) from public, anon, authenticated;

alter table public.company_profile_owners drop constraint company_profile_owners_pkey;
alter table public.company_profile_owners add primary key (profile_id, owner_id);

drop policy "Members update their own company profiles" on public.company_profiles;

create policy "Members update their own company profiles"
on public.company_profiles for update
to authenticated
using (
  exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = company_profiles.id and owner.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = company_profiles.id and owner.owner_id = (select auth.uid())
  )
);

create or replace function private.company_updates_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  poster uuid;
begin
  poster := (select auth.uid());
  if poster is null then
    select owner_id into poster from public.company_profiles where id = new.profile_id;
  end if;
  if poster is null or not private.owns_profile(new.profile_id, poster) then
    raise exception 'Updates can only be shared for your own companies.' using errcode = 'insufficient_privilege';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('updates:' || poster::text, 0));
  if (select count(*) from public.company_updates where profile_id = new.profile_id) >= 100 then
    raise exception 'Each company can have up to 100 updates.' using errcode = 'check_violation';
  end if;
  delete from private.company_update_log where owner_id = poster and created_at < pg_catalog.now() - interval '2 days';
  if (select count(*) from private.company_update_log
      where owner_id = poster and created_at > pg_catalog.now() - interval '1 day') >= 20 then
    raise exception 'You can share up to 20 updates a day.' using errcode = 'check_violation';
  end if;
  insert into private.company_update_log (owner_id) values (poster);
  new.created_at := pg_catalog.now();
  return new;
end;
$$;

create or replace function private.opportunities_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  poster uuid;
begin
  poster := (select auth.uid());
  if poster is null then
    select owner_id into poster from public.company_profiles where id = new.profile_id;
  end if;
  if poster is null or not private.owns_profile(new.profile_id, poster) then
    raise exception 'Opportunities can only be posted for your own companies.' using errcode = 'insufficient_privilege';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('opportunities:' || poster::text, 0));
  if (select count(*) from public.opportunities where profile_id = new.profile_id) >= 20 then
    raise exception 'Each company can have up to 20 opportunity posts.' using errcode = 'check_violation';
  end if;
  if (select count(*) from private.opportunity_post_log
      where owner_id = poster and created_at > pg_catalog.now() - interval '1 day') >= 10 then
    raise exception 'You can post up to 10 opportunities a day.' using errcode = 'check_violation';
  end if;
  insert into private.opportunity_post_log (owner_id) values (poster);
  new.created_at := pg_catalog.now();
  return new;
end;
$$;

create or replace function private.company_events_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  host uuid;
begin
  host := (select auth.uid());
  if host is null then
    select owner_id into host from public.company_profiles where id = new.profile_id;
  end if;
  if host is null or not private.owns_profile(new.profile_id, host) then
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

create table public.introduction_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  company_id uuid not null references public.company_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint introduction_requests_once unique (requester_id, company_id)
);

alter table public.introduction_requests enable row level security;
revoke all on public.introduction_requests from anon, authenticated;
grant insert (requester_id, company_id) on public.introduction_requests to authenticated;

create policy "Members request introductions to other companies"
on public.introduction_requests for insert
to authenticated
with check (
  requester_id = (select auth.uid())
  and not exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = company_id and owner.owner_id = (select auth.uid())
  )
);

create function private.introduction_requests_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to request an introduction.' using errcode = 'insufficient_privilege';
  end if;
  new.requester_id := (select auth.uid());
  new.created_at := pg_catalog.now();
  if private.owns_profile(new.company_id, new.requester_id) then
    raise exception 'You already manage this company.' using errcode = 'check_violation';
  end if;
  if (select count(*) from public.introduction_requests
      where requester_id = new.requester_id and created_at > pg_catalog.now() - interval '1 day') >= 20 then
    raise exception 'You can request up to 20 introductions a day.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke all on function private.introduction_requests_guard() from public, anon, authenticated;

create trigger introduction_requests_guard
before insert on public.introduction_requests
for each row execute function private.introduction_requests_guard();

create function private.notify_introduction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.enqueue_mail(
    private.profile_owner(new.company_id),
    'introduction',
    'Someone requested an introduction',
    'A business on BOND asked to be introduced to ' || private.profile_name(new.company_id) || '.',
    'https://joinbond.world/dashboard.html',
    'introduction:' || new.id::text,
    pg_catalog.now(),
    false,
    true
  );
  return null;
end;
$$;

revoke all on function private.notify_introduction() from public, anon, authenticated;

create trigger introduction_requests_notify
after insert on public.introduction_requests
for each row execute function private.notify_introduction();

create function public.my_introduction_requests()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select company_id from public.introduction_requests
  where requester_id = (select auth.uid())
$$;

revoke all on function public.my_introduction_requests() from public, anon;
grant execute on function public.my_introduction_requests() to authenticated;

create table public.company_representative_invites (
  profile_id uuid not null references public.company_profiles (id) on delete cascade,
  email text not null check (
    char_length(email) <= 160
    and email ~ '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,63}$'
  ),
  invited_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, email)
);

alter table public.company_representative_invites enable row level security;
revoke all on public.company_representative_invites from anon, authenticated;

create function public.invite_company_representative(profile uuid, representative_email text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text := pg_catalog.lower(pg_catalog.btrim(representative_email));
  founder uuid;
  existing uuid;
  seats integer;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('ok', false, 'reason', 'signin');
  end if;
  if normalized is null or char_length(normalized) > 160
     or normalized !~ '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,63}$' then
    return jsonb_build_object('ok', false, 'reason', 'email');
  end if;
  select owner_id into founder from public.company_profiles where id = profile;
  if founder is null or founder is distinct from (select auth.uid()) then
    return jsonb_build_object('ok', false, 'reason', 'founder');
  end if;
  if normalized = pg_catalog.lower((select email from auth.users where id = founder)) then
    return jsonb_build_object('ok', false, 'reason', 'self');
  end if;
  select id into existing from auth.users where pg_catalog.lower(email) = normalized limit 1;
  if existing is not null and exists (
    select 1 from public.company_profile_owners
    where profile_id = profile and owner_id = existing
  ) then
    return jsonb_build_object('ok', true, 'already', true, 'pending', false);
  end if;
  if exists (
    select 1 from public.company_representative_invites
    where profile_id = profile and email = normalized
  ) then
    return jsonb_build_object('ok', true, 'already', true, 'pending', true);
  end if;
  select (select count(*) from public.company_profile_owners where profile_id = profile)
       + (select count(*) from public.company_representative_invites where profile_id = profile)
    into seats;
  if seats >= 5 then
    return jsonb_build_object('ok', false, 'reason', 'limit');
  end if;
  if existing is not null then
    insert into public.company_profile_owners (profile_id, owner_id) values (profile, existing);
    perform private.enqueue_mail(
      existing,
      'representative',
      'You can manage a company on BOND',
      'The person who created ' || private.profile_name(profile) || ' added you so you can manage that company.',
      'https://joinbond.world/dashboard.html',
      'representative:' || profile::text || ':' || existing::text,
      pg_catalog.now(),
      false,
      true
    );
    return jsonb_build_object('ok', true, 'already', false, 'pending', false);
  end if;
  insert into public.company_representative_invites (profile_id, email, invited_by)
  values (profile, normalized, founder);
  return jsonb_build_object('ok', true, 'already', false, 'pending', true);
end;
$$;

revoke all on function public.invite_company_representative(uuid, text) from public, anon;
grant execute on function public.invite_company_representative(uuid, text) to authenticated;

create function public.accept_company_invites()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text;
  added integer := 0;
begin
  if (select auth.uid()) is null then
    return 0;
  end if;
  select pg_catalog.lower(email) into normalized from auth.users where id = (select auth.uid());
  if normalized is null then
    return 0;
  end if;
  insert into public.company_profile_owners (profile_id, owner_id)
  select invite.profile_id, (select auth.uid())
  from public.company_representative_invites as invite
  where invite.email = normalized
    and (select count(*) from public.company_profile_owners as owner where owner.profile_id = invite.profile_id) < 5
  on conflict do nothing;
  get diagnostics added = row_count;
  delete from public.company_representative_invites as invite
  where invite.email = normalized
    and exists (
      select 1 from public.company_profile_owners as owner
      where owner.profile_id = invite.profile_id and owner.owner_id = (select auth.uid())
    );
  return added;
end;
$$;

revoke all on function public.accept_company_invites() from public, anon;
grant execute on function public.accept_company_invites() to authenticated;

create function public.my_company_roles()
returns table (profile_id uuid, founder boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select owner.profile_id, profile.owner_id = (select auth.uid())
  from public.company_profile_owners as owner
  join public.company_profiles as profile on profile.id = owner.profile_id
  where owner.owner_id = (select auth.uid())
$$;

revoke all on function public.my_company_roles() from public, anon;
grant execute on function public.my_company_roles() to authenticated;
