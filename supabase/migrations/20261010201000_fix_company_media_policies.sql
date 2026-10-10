-- Inside the profile lookup, a bare "name" resolves to company_profiles.name; qualify the object's name.

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
  and (select (auth.jwt() ->> 'is_anonymous')::boolean) is not true
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
  and (select (auth.jwt() ->> 'is_anonymous')::boolean) is not true
);
