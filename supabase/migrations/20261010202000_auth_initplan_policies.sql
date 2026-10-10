-- Evaluate auth.jwt() once per statement in the anonymous-session checks.

drop policy "No writes from anonymous sessions" on public.company_profiles;

create policy "No writes from anonymous sessions"
on public.company_profiles as restrictive for all
to authenticated
using ((((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true)
with check ((((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true);

drop policy "Members upload media for their own profiles" on storage.objects;
drop policy "Members replace media for their own profiles" on storage.objects;

create policy "Members upload media for their own profiles"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'company-media'
  and objects.name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/(logo|cover)\.(png|jpg|webp)$'
  and (storage.foldername(objects.name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.company_profiles as profile
    where profile.id::text = (storage.foldername(objects.name))[2] and profile.owner_id = (select auth.uid())
  )
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

create policy "Members replace media for their own profiles"
on storage.objects for update
to authenticated
using (
  bucket_id = 'company-media'
  and (storage.foldername(objects.name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'company-media'
  and objects.name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/(logo|cover)\.(png|jpg|webp)$'
  and (storage.foldername(objects.name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.company_profiles as profile
    where profile.id::text = (storage.foldername(objects.name))[2] and profile.owner_id = (select auth.uid())
  )
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);
