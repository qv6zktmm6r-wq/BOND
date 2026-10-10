-- Account deletion now needs a sign-in from the last 30 minutes, so a stolen or long-lived session can't
-- delete the account. The sign-in time comes from the token's "amr" claim, which survives token refreshes.
-- Anonymous accounts are also recognised from auth.users, not only from the token.

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
    where bucket_id = 'company-media' and (storage.foldername(objects.name))[1] = member::text
  ) then
    raise exception 'Remove your uploaded images before deleting your account.' using errcode = 'object_not_in_prerequisite_state';
  end if;
  delete from auth.users where id = member;
end;
$$;

revoke all on function public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;
