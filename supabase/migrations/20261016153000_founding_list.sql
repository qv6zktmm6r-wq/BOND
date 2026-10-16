-- Joining BOND before launch saves a place on the founding list. Places 1–100 reserve the
-- gold Founding Member badge. A deleted signup does not give its place to a later business.
-- The counter is a table so a rolled-back test does not burn a place.

create table private.founding_list_counter (
  id boolean primary key default true check (id),
  next_number integer not null check (next_number > 0)
);

insert into private.founding_list_counter (next_number) values (1);

create table public.founding_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null check (
    char_length(email) <= 160
    and email ~ '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,63}$'
  ),
  company_name text not null default '' check (
    char_length(company_name) <= 120 and private.text_is_plain(company_name, false)
  ),
  place integer not null check (place > 0),
  created_at timestamptz not null default now(),
  constraint founding_signups_email_unique unique (email),
  constraint founding_signups_place_unique unique (place)
);

alter table public.founding_signups enable row level security;
revoke all on public.founding_signups from anon, authenticated;

alter table public.company_profiles
  add column founding_place integer check (founding_place > 0);

grant select (founding_place) on public.company_profiles to anon, authenticated;

create or replace function public.founding_spots_remaining()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when coalesce((select next_number - 1 from private.founding_list_counter where id), 0) >= 100 then 0
    else 100 - coalesce((select next_number - 1 from private.founding_list_counter where id), 0)
  end
$$;

create or replace function private.company_profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  reserved integer;
begin
  if tg_op = 'INSERT' then
    if (select auth.uid()) is not null and new.owner_id is distinct from (select auth.uid()) then
      raise exception 'Company profiles can only be added to your own account.' using errcode = 'insufficient_privilege';
    end if;
    new.id := pg_catalog.gen_random_uuid();
    new.founding_number := private.take_founding_number();
    new.founding_place := null;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.owner_id::text, 0));
    if (select count(*) from public.company_profiles where owner_id = new.owner_id) >= 5 then
      raise exception 'Each account can have up to 5 company profiles.' using errcode = 'check_violation';
    end if;
    new.created_at := pg_catalog.now();
  else
    new.id := old.id;
    new.owner_id := old.owner_id;
    new.created_at := old.created_at;
    new.founding_number := old.founding_number;
    new.founding_place := old.founding_place;
  end if;
  if new.founding_place is null and new.owner_id is not null then
    select place into reserved
    from public.founding_signups
    where email = pg_catalog.lower((select email from auth.users where id = new.owner_id));
    if reserved is not null and reserved <= 100 then
      new.founding_place := reserved;
    end if;
  end if;
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create function public.join_founding_list(signup_email text, company_name text default '')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text := pg_catalog.lower(pg_catalog.btrim(coalesce(signup_email, '')));
  company text := pg_catalog.regexp_replace(pg_catalog.btrim(coalesce(company_name, '')), '\s+', ' ', 'g');
  assigned integer;
  already boolean := false;
begin
  if normalized !~ '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,63}$' or char_length(normalized) > 160 then
    raise exception 'Enter a valid email address.' using errcode = 'check_violation';
  end if;
  if char_length(company) > 120 or not private.text_is_plain(company, false) then
    raise exception 'Enter your company name in plain text.' using errcode = 'check_violation';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('bond-founding-list', 0));
  select place into assigned from public.founding_signups where email = normalized;
  if assigned is not null then
    already := true;
  else
    if (
      select count(*) from public.founding_signups
      where created_at > pg_catalog.now() - interval '1 day'
    ) >= 25 then
      raise exception 'The list is full for today. Try again tomorrow.' using errcode = 'check_violation';
    end if;
    update private.founding_list_counter
    set next_number = next_number + 1
    where id
    returning next_number - 1 into assigned;
    if assigned is null then
      raise exception 'The founding list is not ready.' using errcode = 'object_not_in_prerequisite_state';
    end if;
    insert into public.founding_signups (email, company_name, place)
    values (normalized, company, assigned);
    if assigned <= 100 then
      update public.company_profiles
      set name = name
      where owner_id in (select id from auth.users where pg_catalog.lower(email) = normalized)
        and founding_place is null;
    end if;
  end if;
  return pg_catalog.jsonb_build_object(
    'place', assigned,
    'founding', assigned <= 100,
    'already', already
  );
end;
$$;

revoke all on function public.join_founding_list(text, text) from public;
grant execute on function public.join_founding_list(text, text) to anon, authenticated;
