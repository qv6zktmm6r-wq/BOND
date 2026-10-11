-- Review fixes for events: reject control characters (they could add fields to the calendar file
-- attendees download), a wider set of invisible and direction-changing characters, and text that is
-- only whitespace. RSVPs are now counted after the insert, so an insert that is skipped can never
-- change the going count.

alter table public.company_events drop constraint company_events_text_visible;
alter table public.company_events add constraint company_events_text_visible check (
  title || location || description !~ '[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2069\u3164\uFEFF\uFFA0\uFFF9-\uFFFB\U000E0000-\U000E007F]'
);
alter table public.company_events add constraint company_events_text_plain check (
  title || location !~ '[\x01-\x1F\x7F\u0085\u2028\u2029]'
  and description !~ '[\x01-\x09\x0B-\x1F\x7F\u0085\u2028\u2029]'
);
alter table public.company_events add constraint company_events_text_not_blank check (
  title ~ '[^[:space:]]' and description ~ '[^[:space:]]' and (format = 'online' or location ~ '[^[:space:]]')
);

alter table public.company_updates drop constraint company_updates_text_visible;
alter table public.company_updates add constraint company_updates_text_visible check (
  text !~ '[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2069\u3164\uFEFF\uFFA0\uFFF9-\uFFFB\U000E0000-\U000E007F]'
);

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
  select e.profile_id, e.starts_at, e.duration_minutes into event
  from public.company_events as e where e.id = new.event_id;
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
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('rsvps:' || new.user_id::text, 0));
  delete from private.company_event_rsvp_log where user_id = new.user_id and created_at < pg_catalog.now() - interval '2 days';
  if (select count(*) from private.company_event_rsvp_log
      where user_id = new.user_id and created_at > pg_catalog.now() - interval '1 day') >= 50 then
    raise exception 'You can RSVP to up to 50 events a day.' using errcode = 'check_violation';
  end if;
  insert into private.company_event_rsvp_log (user_id) values (new.user_id);
  new.created_at := pg_catalog.now();
  return new;
end;
$$;

-- Runs after the row exists, so skipped inserts (ON CONFLICT DO NOTHING) never count. The lock is
-- FOR NO KEY UPDATE so it doesn't conflict with the foreign-key check's FOR KEY SHARE lock.
create or replace function private.company_event_rsvps_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event record;
begin
  select e.capacity, e.going into event
  from public.company_events as e where e.id = new.event_id for no key update;
  if not found then
    raise exception 'This event was cancelled.' using errcode = 'foreign_key_violation';
  end if;
  if event.capacity > 0 and event.going >= event.capacity then
    raise exception 'This event is full.' using errcode = 'check_violation';
  end if;
  update public.company_events set going = going + 1 where id = new.event_id;
  return null;
end;
$$;

create trigger company_event_rsvps_count
after insert on public.company_event_rsvps
for each row execute function private.company_event_rsvps_count();
