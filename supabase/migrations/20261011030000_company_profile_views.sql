-- Profile views: a signed-in member opening a published company's profile counts once per member,
-- company, and day (UTC). The company's owner sees daily totals through company_profile_view_counts
-- and never who viewed; viewers can't read the rows back. Rows are kept for 90 days.

create table public.company_profile_views (
  profile_id uuid not null references public.company_profiles (id) on delete cascade,
  viewer_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null default (pg_catalog.now() at time zone 'utc')::date,
  primary key (profile_id, day, viewer_id)
);

create index company_profile_views_viewer_id_idx on public.company_profile_views (viewer_id);

create table private.company_profile_view_log (
  viewer_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index company_profile_view_log_viewer_idx on private.company_profile_view_log (viewer_id, created_at desc);

create or replace function private.company_profile_views_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = new.profile_id and owner.owner_id = new.viewer_id
  ) then
    raise exception 'Views of your own company aren''t counted.' using errcode = 'check_violation';
  end if;
  new.day := (pg_catalog.now() at time zone 'utc')::date;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('views:' || new.viewer_id::text, 0));
  if exists (
    select 1 from public.company_profile_views as seen
    where seen.profile_id = new.profile_id and seen.day = new.day and seen.viewer_id = new.viewer_id
  ) then
    return null;
  end if;
  delete from private.company_profile_view_log where viewer_id = new.viewer_id and created_at < pg_catalog.now() - interval '2 days';
  if (select count(*) from private.company_profile_view_log
      where viewer_id = new.viewer_id and created_at > pg_catalog.now() - interval '1 day') >= 300 then
    raise exception 'Too many profile views today.' using errcode = 'check_violation';
  end if;
  insert into private.company_profile_view_log (viewer_id) values (new.viewer_id);
  delete from public.company_profile_views where profile_id = new.profile_id and day < new.day - 90;
  return new;
end;
$$;

create trigger company_profile_views_guard
before insert on public.company_profile_views
for each row execute function private.company_profile_views_guard();

alter table public.company_profile_views enable row level security;

create policy "Members' profile visits are counted"
on public.company_profile_views for insert
to authenticated
with check (
  viewer_id = (select auth.uid())
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

create policy "Owners see visits to their own companies"
on public.company_profile_views for select
to authenticated
using (
  exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = company_profile_views.profile_id and owner.owner_id = (select auth.uid())
  )
);

revoke all on public.company_profile_views from anon, authenticated;
grant select (profile_id, day) on public.company_profile_views to authenticated;
grant insert (profile_id) on public.company_profile_views to authenticated;

create view public.company_profile_view_counts with (security_invoker = true) as
select profile_id, day, count(*)::integer as views
from public.company_profile_views
group by profile_id, day;

revoke all on public.company_profile_view_counts from anon, authenticated;
grant select on public.company_profile_view_counts to authenticated;
