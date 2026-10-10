-- Tighter limits for company profiles and their media: raw text length, field formats,
-- exact media paths tied to the owner's own profile, no writes from anonymous sessions,
-- a race-free profile limit, and an immutable profile id.

alter table public.company_profiles
  drop constraint company_profiles_name_check,
  drop constraint company_profiles_description_check,
  drop constraint company_profiles_website_check,
  drop constraint company_profiles_public_email_check,
  drop constraint company_profiles_public_phone_check,
  drop constraint company_profiles_check,
  drop constraint company_profiles_check1;

alter table public.company_profiles
  add constraint company_profiles_name_check check (char_length(name) <= 80 and btrim(name) <> ''),
  add constraint company_profiles_description_check check (char_length(description) <= 500 and btrim(description) <> ''),
  add constraint company_profiles_website_check check (website = '' or (char_length(website) <= 2048 and website ~ '^https?://[^\s@/?#]+([/?#]\S*)?$')),
  add constraint company_profiles_public_email_check check (public_email = '' or (char_length(public_email) <= 160 and public_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$')),
  add constraint company_profiles_public_phone_check check (public_phone = '' or public_phone ~ '^\+?[0-9]{7,15}$'),
  add constraint company_profiles_logo_path_check check (logo_path = '' or logo_path ~ ('^' || owner_id::text || '/' || id::text || '/logo\.(png|jpg|webp)$')),
  add constraint company_profiles_cover_path_check check (cover_path = '' or cover_path ~ ('^' || owner_id::text || '/' || id::text || '/cover\.(png|jpg|webp)$'));

create or replace function private.company_profiles_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.owner_id::text, 0));
    if (select count(*) from public.company_profiles where owner_id = new.owner_id) >= 5 then
      raise exception 'Each account can have up to 5 company profiles.' using errcode = 'check_violation';
    end if;
    new.created_at := now();
  else
    new.id := old.id;
    new.owner_id := old.owner_id;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create policy "No writes from anonymous sessions"
on public.company_profiles as restrictive for all
to authenticated
using ((select (auth.jwt() ->> 'is_anonymous')::boolean) is not true)
with check ((select (auth.jwt() ->> 'is_anonymous')::boolean) is not true);

drop policy "Members upload their own company media" on storage.objects;
drop policy "Members replace their own company media" on storage.objects;

create policy "Members upload media for their own profiles"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'company-media'
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/(logo|cover)\.(png|jpg|webp)$'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.company_profiles as profile
    where profile.id::text = (storage.foldername(name))[2] and profile.owner_id = (select auth.uid())
  )
  and (select (auth.jwt() ->> 'is_anonymous')::boolean) is not true
);

create policy "Members replace media for their own profiles"
on storage.objects for update
to authenticated
using (
  bucket_id = 'company-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'company-media'
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/(logo|cover)\.(png|jpg|webp)$'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.company_profiles as profile
    where profile.id::text = (storage.foldername(name))[2] and profile.owner_id = (select auth.uid())
  )
  and (select (auth.jwt() ->> 'is_anonymous')::boolean) is not true
);
