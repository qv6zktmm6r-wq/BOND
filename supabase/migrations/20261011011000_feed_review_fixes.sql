-- Security review follow-ups for the activity feed: reject invisible and direction-changing
-- characters in update text, cap follow writes per day, and keep the private limit logs small.

alter table public.company_updates
  add constraint company_updates_text_visible
  check (text !~ '[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]');

create table private.company_follow_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index company_follow_log_user_idx on private.company_follow_log (user_id, created_at desc);

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
  delete from private.company_follow_log where user_id = new.user_id and created_at < pg_catalog.now() - interval '2 days';
  if (select count(*) from private.company_follow_log
      where user_id = new.user_id and created_at > pg_catalog.now() - interval '1 day') >= 200 then
    raise exception 'You can follow up to 200 companies a day.' using errcode = 'check_violation';
  end if;
  insert into private.company_follow_log (user_id) values (new.user_id);
  new.created_at := pg_catalog.now();
  return new;
end;
$$;
