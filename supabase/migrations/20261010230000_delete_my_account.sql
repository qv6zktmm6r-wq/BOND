-- Lets a signed-in member delete their own account; their company profiles go with it (on delete cascade).
-- Stored files can only be removed through the Storage API, so the site removes them first and this
-- function refuses to run while any remain, so a deleted account never leaves images behind.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  member uuid := (select auth.uid());
begin
  if member is null or coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) then
    raise exception 'Sign in to delete your account.' using errcode = 'insufficient_privilege';
  end if;
  if exists (
    select 1 from storage.objects
    where bucket_id = 'company-media' and (storage.foldername(objects.name))[1] = member::text
  ) then
    raise exception 'Remove your uploaded images before deleting your account.' using errcode = 'object_not_in_prerequisite_state';
  end if;
  delete from auth.users where id = member;
end;
$$;

revoke all on function public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;
