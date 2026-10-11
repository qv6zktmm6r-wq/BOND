-- Review fixes for profile views: prune visits older than 90 days across all companies on every
-- counted view, count the daily cap from the visit rows (dropping the timestamped log), reject
-- anonymous sessions up front, and show owners totals only through yesterday so a count can't be
-- watched change the moment one person opens the profile.

create or replace function private.company_profile_views_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (((select auth.jwt()) ->> 'is_anonymous')::boolean) is true then
    raise exception 'Sign in with your email to be counted.' using errcode = 'insufficient_privilege';
  end if;
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
  if (select count(*) from public.company_profile_views as seen
      where seen.viewer_id = new.viewer_id and seen.day = new.day) >= 300 then
    raise exception 'Too many profile views today.' using errcode = 'check_violation';
  end if;
  delete from public.company_profile_views where day < new.day - 90;
  return new;
end;
$$;

drop table private.company_profile_view_log;

drop index public.company_profile_views_viewer_id_idx;
create index company_profile_views_viewer_day_idx on public.company_profile_views (viewer_id, day);
create index company_profile_views_day_idx on public.company_profile_views (day);

drop policy "Owners see visits to their own companies" on public.company_profile_views;
create policy "Owners see past days' visits to their own companies"
on public.company_profile_views for select
to authenticated
using (
  day < (select (pg_catalog.now() at time zone 'utc')::date)
  and exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = company_profile_views.profile_id and owner.owner_id = (select auth.uid())
  )
);
