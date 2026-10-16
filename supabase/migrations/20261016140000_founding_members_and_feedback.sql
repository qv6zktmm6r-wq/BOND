-- The first 100 published companies keep a gold Founding Member badge. The number is assigned
-- by the database, in order, and a deleted profile does not give its number to a later company.
-- The counter lives in a table rather than a sequence so a rolled-back test does not burn a number.
-- Visitors can send a short note. They cannot read notes, including their own.

create table private.founding_counter (
  id boolean primary key default true check (id),
  next_number integer not null check (next_number > 0)
);

alter table public.company_profiles
  add column founding_number integer check (founding_number > 0);

with ranked as (
  select id, row_number() over (order by created_at, id) as number
  from public.company_profiles
)
update public.company_profiles as profile
set founding_number = ranked.number
from ranked
where profile.id = ranked.id;

insert into private.founding_counter (next_number)
select coalesce(max(founding_number), 0) + 1 from public.company_profiles;

alter table public.company_profiles alter column founding_number set not null;

create function private.take_founding_number()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  assigned integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('bond-founding', 0));
  update private.founding_counter
  set next_number = next_number + 1
  where id
  returning next_number - 1 into assigned;
  if assigned is null then
    raise exception 'Founding numbers are not ready.' using errcode = 'object_not_in_prerequisite_state';
  end if;
  return assigned;
end;
$$;

revoke all on function private.take_founding_number() from public, anon, authenticated;

create or replace function private.company_profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (select auth.uid()) is not null and new.owner_id is distinct from (select auth.uid()) then
      raise exception 'Company profiles can only be added to your own account.' using errcode = 'insufficient_privilege';
    end if;
    new.id := pg_catalog.gen_random_uuid();
    new.founding_number := private.take_founding_number();
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
  end if;
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

grant select (founding_number) on public.company_profiles to anon, authenticated;

create function public.founding_spots_remaining()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when coalesce((select max(founding_number) from public.company_profiles), 0) >= 100 then 0
    else 100 - coalesce((select max(founding_number) from public.company_profiles), 0)
  end
$$;

revoke all on function public.founding_spots_remaining() from public;
grant execute on function public.founding_spots_remaining() to anon, authenticated;

create table public.site_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  body text not null check (
    char_length(body) <= 1000 and private.text_is_plain(body, true) and private.text_has_content(body)
  ),
  contact text not null default '' check (
    char_length(contact) <= 160 and private.text_is_plain(contact, false)
  ),
  created_at timestamptz not null default now()
);

alter table public.site_feedback enable row level security;

create function private.site_feedback_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.user_id := (select auth.uid());
  new.created_at := pg_catalog.now();
  if new.user_id is null then
    if (
      select count(*) from public.site_feedback
      where user_id is null and created_at > pg_catalog.now() - interval '1 day'
    ) >= 30 then
      raise exception 'Feedback is full for today. Try again tomorrow.' using errcode = 'check_violation';
    end if;
  elsif (
    select count(*) from public.site_feedback
    where user_id = new.user_id and created_at > pg_catalog.now() - interval '1 day'
  ) >= 3 then
    raise exception 'You can send 3 notes a day. Try again tomorrow.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke all on function private.site_feedback_guard() from public, anon, authenticated;

create trigger site_feedback_guard
before insert on public.site_feedback
for each row execute function private.site_feedback_guard();

create policy "Anyone can send feedback"
on public.site_feedback for insert
to anon, authenticated
with check (user_id is not distinct from (select auth.uid()));

revoke all on public.site_feedback from anon, authenticated;
grant insert (body, contact) on public.site_feedback to anon, authenticated;
