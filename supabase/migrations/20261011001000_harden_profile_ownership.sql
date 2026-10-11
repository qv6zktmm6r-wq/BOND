-- Members can't choose a profile id or set another account as owner (which also stops the
-- 5-profile error from revealing another account's profile count), a profile can't be deleted
-- while its images remain (they would be left with no owner), and the old "<account id>/" image
-- folders are no longer reachable; none were in use.

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
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.owner_id::text, 0));
    if (select count(*) from public.company_profiles where owner_id = new.owner_id) >= 5 then
      raise exception 'Each account can have up to 5 company profiles.' using errcode = 'check_violation';
    end if;
    new.created_at := pg_catalog.now();
  else
    new.id := old.id;
    new.owner_id := old.owner_id;
    new.created_at := old.created_at;
  end if;
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

-- Deleting the whole account cascades from auth.users (a nested trigger) after
-- delete_my_account() has already checked that no images remain.
create or replace function private.company_profiles_keep_media()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if pg_catalog.pg_trigger_depth() = 1 and exists (
    select 1 from storage.objects
    where bucket_id = 'company-media' and (storage.foldername(objects.name))[1] = old.id::text
  ) then
    raise exception 'Remove this profile''s images before deleting it.' using errcode = 'object_not_in_prerequisite_state';
  end if;
  return old;
end;
$$;

create trigger company_profiles_keep_media
before delete on public.company_profiles
for each row execute function private.company_profiles_keep_media();

drop policy "Members read media for their own profiles" on storage.objects;
drop policy "Members delete media for their own profiles" on storage.objects;

create policy "Members read media for their own profiles"
on storage.objects for select
to authenticated
using (
  bucket_id = 'company-media'
  and exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id::text = (storage.foldername(objects.name))[1] and owner.owner_id = (select auth.uid())
  )
);

create policy "Members delete media for their own profiles"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'company-media'
  and exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id::text = (storage.foldername(objects.name))[1] and owner.owner_id = (select auth.uid())
  )
);

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  member uuid := (select auth.uid());
  claims jsonb := (select auth.jwt());
  signed_in_at bigint;
begin
  if member is null
    or coalesce((claims ->> 'is_anonymous')::boolean, false)
    or exists (select 1 from auth.users where id = member and is_anonymous) then
    raise exception 'Sign in to delete your account.' using errcode = 'insufficient_privilege';
  end if;
  select max((entry ->> 'timestamp')::bigint) into signed_in_at
  from pg_catalog.jsonb_array_elements(
    case when pg_catalog.jsonb_typeof(claims -> 'amr') = 'array' then claims -> 'amr' else '[]'::jsonb end
  ) as entry
  where entry ->> 'timestamp' ~ '^[0-9]+$';
  if signed_in_at is null or signed_in_at < extract(epoch from pg_catalog.now()) - 1800 then
    raise exception 'Sign in again to delete your account.' using errcode = 'invalid_authorization_specification';
  end if;
  if exists (
    select 1 from storage.objects
    where bucket_id = 'company-media'
      and (storage.foldername(objects.name))[1] in (
        select owner.profile_id::text from public.company_profile_owners as owner where owner.owner_id = member
      )
  ) then
    raise exception 'Remove your uploaded images before deleting your account.' using errcode = 'object_not_in_prerequisite_state';
  end if;
  delete from auth.users where id = member;
end;
$$;

revoke all on function public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;
