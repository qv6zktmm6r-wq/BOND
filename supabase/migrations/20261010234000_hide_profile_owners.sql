-- Visitors can no longer tell which company profiles share an account.
-- company_profiles.owner_id stays for the access rules but can't be read through the API; each member
-- learns which profiles are theirs from company_profile_owners, which only shows their own rows.
-- Logos and covers move from "<owner id>/<profile id>/<kind>" to "<profile id>/<kind>" so image
-- addresses don't reveal the owner either.

create table public.company_profile_owners (
  profile_id uuid primary key references public.company_profiles (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade
);

create index company_profile_owners_owner_id_idx on public.company_profile_owners (owner_id);

alter table public.company_profile_owners enable row level security;

create policy "Members see which company profiles are theirs"
on public.company_profile_owners for select
to authenticated
using ((select auth.uid()) = owner_id);

revoke all on public.company_profile_owners from anon, authenticated;
grant select on public.company_profile_owners to authenticated;

insert into public.company_profile_owners (profile_id, owner_id)
select id, owner_id from public.company_profiles;

create or replace function private.record_company_profile_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.company_profile_owners (profile_id, owner_id) values (new.id, new.owner_id);
  return null;
end;
$$;

create trigger company_profiles_record_owner
after insert on public.company_profiles
for each row execute function private.record_company_profile_owner();

-- The profile-limit trigger counts rows by owner_id, which members can no longer read.
alter function private.company_profiles_guard() security definer;

revoke select on public.company_profiles from anon, authenticated;
grant select (
  id, name, industry, description, location, tagline, story, services, certifications, projects,
  service_area, company_size, ownership, representative, website, publish_contact, public_email,
  public_phone, logo_path, cover_path, created_at, updated_at
) on public.company_profiles to anon, authenticated;

-- Images saved under the old layout are dropped from their profiles (the files stay for the owner's
-- account deletion to remove).
update public.company_profiles set logo_path = '' where logo_path <> '' and logo_path !~ ('^' || id::text || '/logo\.(png|jpg|webp)$');
update public.company_profiles set cover_path = '' where cover_path <> '' and cover_path !~ ('^' || id::text || '/cover\.(png|jpg|webp)$');

alter table public.company_profiles
  drop constraint company_profiles_logo_path_check,
  drop constraint company_profiles_cover_path_check;

alter table public.company_profiles
  add constraint company_profiles_logo_path_check check (logo_path = '' or logo_path ~ ('^' || id::text || '/logo\.(png|jpg|webp)$')),
  add constraint company_profiles_cover_path_check check (cover_path = '' or cover_path ~ ('^' || id::text || '/cover\.(png|jpg|webp)$'));

drop policy "Members read their own company media" on storage.objects;
drop policy "Members upload media for their own profiles" on storage.objects;
drop policy "Members replace media for their own profiles" on storage.objects;
drop policy "Members delete their own company media" on storage.objects;

create policy "Members read media for their own profiles"
on storage.objects for select
to authenticated
using (
  bucket_id = 'company-media'
  and (
    (storage.foldername(objects.name))[1] = (select auth.uid())::text
    or exists (
      select 1 from public.company_profile_owners as owner
      where owner.profile_id::text = (storage.foldername(objects.name))[1] and owner.owner_id = (select auth.uid())
    )
  )
);

create policy "Members upload media for their own profiles"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'company-media'
  and objects.name ~ '^[0-9a-f-]{36}/(logo|cover)\.(png|jpg|webp)$'
  and exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id::text = (storage.foldername(objects.name))[1] and owner.owner_id = (select auth.uid())
  )
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

create policy "Members replace media for their own profiles"
on storage.objects for update
to authenticated
using (
  bucket_id = 'company-media'
  and exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id::text = (storage.foldername(objects.name))[1] and owner.owner_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'company-media'
  and objects.name ~ '^[0-9a-f-]{36}/(logo|cover)\.(png|jpg|webp)$'
  and exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id::text = (storage.foldername(objects.name))[1] and owner.owner_id = (select auth.uid())
  )
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

-- Old-layout folders ("<owner id>/...") stay deletable by their owner so account deletion can clear them.
create policy "Members delete media for their own profiles"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'company-media'
  and (
    (storage.foldername(objects.name))[1] = (select auth.uid())::text
    or exists (
      select 1 from public.company_profile_owners as owner
      where owner.profile_id::text = (storage.foldername(objects.name))[1] and owner.owner_id = (select auth.uid())
    )
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
      and (
        (storage.foldername(objects.name))[1] = member::text
        or (storage.foldername(objects.name))[1] in (
          select owner.profile_id::text from public.company_profile_owners as owner where owner.owner_id = member
        )
      )
  ) then
    raise exception 'Remove your uploaded images before deleting your account.' using errcode = 'object_not_in_prerequisite_state';
  end if;
  delete from auth.users where id = member;
end;
$$;

revoke all on function public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;
