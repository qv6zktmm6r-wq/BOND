-- Access-rule checks for public.company_profiles. Runs in a transaction that is always rolled back.
-- Run: supabase db query --linked -f supabase/tests/company_profiles_rls.sql
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-4000-8000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@example.test'),
  ('00000000-0000-4000-8000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@example.test');

create temporary table rls_results (check_name text, passed boolean) on commit drop;
grant all on rls_results to anon, authenticated;

do $$
declare
  user_a constant uuid := '00000000-0000-4000-8000-00000000000a';
  user_b constant uuid := '00000000-0000-4000-8000-00000000000b';
  profile_a uuid;
  affected integer;
  owner_after uuid;
  i integer;
begin
  -- Visitors (anon) can read but not write.
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform count(*) from public.company_profiles;
  insert into rls_results values ('anon can read', true);
  begin
    insert into public.company_profiles (owner_id, name, industry, description) values (user_a, 'X', 'Energy', 'X');
    insert into rls_results values ('anon cannot insert', false);
  exception when insufficient_privilege then
    insert into rls_results values ('anon cannot insert', true);
  end;

  -- Member A creates a profile for themselves.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description) values ('A Co', 'Energy', 'Member A company')
  returning id into profile_a;
  perform set_config('role', 'postgres', true);
  insert into rls_results values ('member inserts own profile with default owner', (select owner_id = user_a from public.company_profiles where id = profile_a));
  insert into rls_results values ('the owners list records the new profile', (select owner_id = user_a from public.company_profile_owners where profile_id = profile_a));
  perform set_config('role', 'authenticated', true);

  begin
    insert into public.company_profiles (owner_id, name, industry, description) values (user_b, 'Spoof', 'Energy', 'Pretending to be B');
    insert into rls_results values ('member cannot insert for someone else', false);
  exception when insufficient_privilege then
    insert into rls_results values ('member cannot insert for someone else', true);
  end;

  insert into public.company_profiles (id, name, industry, description) values (user_b, 'Chosen id', 'Energy', 'Picks its own id')
  returning id into owner_after;
  insert into rls_results values ('member cannot choose a profile id', owner_after <> user_b);
  delete from public.company_profiles where id = owner_after;

  begin
    insert into public.company_profiles (name, industry, description, public_email) values ('Hidden', 'Energy', 'Hidden contact', 'a@example.test');
    insert into rls_results values ('unpublished contact details are rejected', false);
  exception when check_violation then
    insert into rls_results values ('unpublished contact details are rejected', true);
  end;

  begin
    insert into public.company_profiles (name, industry, description) values ('Bad', 'Space pirates', 'Bad industry');
    insert into rls_results values ('unknown industry is rejected', false);
  exception when check_violation then
    insert into rls_results values ('unknown industry is rejected', true);
  end;

  begin
    insert into public.company_profiles (name, industry, description, logo_path) values ('Path', 'Energy', 'Path trick', user_b::text || '/logo.png');
    insert into rls_results values ('image path outside own folder is rejected', false);
  exception when check_violation then
    insert into rls_results values ('image path outside own folder is rejected', true);
  end;

  update public.company_profiles set tagline = 'Updated', owner_id = user_b where id = profile_a;
  perform set_config('role', 'postgres', true);
  select owner_id into owner_after from public.company_profiles where id = profile_a;
  perform set_config('role', 'authenticated', true);
  insert into rls_results values ('owner can update but not hand the profile to someone else', owner_after = user_a and (select tagline = 'Updated' from public.company_profiles where id = profile_a));

  update public.company_profiles set id = gen_random_uuid() where id = profile_a;
  insert into rls_results values ('profile id cannot be changed', exists (select 1 from public.company_profiles where id = profile_a));

  begin
    insert into public.company_profiles (name, industry, description) values ('A' || repeat(' ', 200), 'Energy', 'Padded name');
    insert into rls_results values ('whitespace-padded name is rejected', false);
  exception when check_violation then
    insert into rls_results values ('whitespace-padded name is rejected', true);
  end;

  begin
    insert into public.company_profiles (name, industry, description, publish_contact, public_phone) values ('Phone', 'Energy', 'Bad phone', true, 'call me maybe');
    insert into rls_results values ('malformed phone is rejected', false);
  exception when check_violation then
    insert into rls_results values ('malformed phone is rejected', true);
  end;

  begin
    update public.company_profiles set logo_path = gen_random_uuid()::text || '/logo.png' where id = profile_a;
    insert into rls_results values ('image path for another profile is rejected', false);
  exception when check_violation then
    insert into rls_results values ('image path for another profile is rejected', true);
  end;

  begin
    update public.company_profiles set logo_path = user_a::text || '/' || profile_a::text || '/logo.png' where id = profile_a;
    insert into rls_results values ('image path containing the owner id is rejected', false);
  exception when check_violation then
    insert into rls_results values ('image path containing the owner id is rejected', true);
  end;

  update public.company_profiles set logo_path = profile_a::text || '/logo.webp' where id = profile_a;
  insert into rls_results values ('exact image path for own profile is accepted', (select logo_path <> '' from public.company_profiles where id = profile_a));

  insert into rls_results values ('member sees their own profile in the owners list', exists (select 1 from public.company_profile_owners where profile_id = profile_a));
  begin
    perform owner_id from public.company_profiles limit 1;
    insert into rls_results values ('members cannot read profile owners', false);
  exception when insufficient_privilege then
    insert into rls_results values ('members cannot read profile owners', true);
  end;

  insert into storage.objects (bucket_id, name) values ('company-media', profile_a::text || '/logo.webp');
  insert into rls_results values ('member uploads media for own profile', true);

  begin
    insert into storage.objects (bucket_id, name) values ('company-media', gen_random_uuid()::text || '/logo.png');
    insert into rls_results values ('upload for a profile that is not yours is rejected', false);
  exception when insufficient_privilege then
    insert into rls_results values ('upload for a profile that is not yours is rejected', true);
  end;

  begin
    insert into storage.objects (bucket_id, name) values ('company-media', profile_a::text || '/extra-file.png');
    insert into rls_results values ('upload with an unexpected file name is rejected', false);
  exception when insufficient_privilege then
    insert into rls_results values ('upload with an unexpected file name is rejected', true);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  begin
    insert into public.company_profiles (name, industry, description) values ('Anon', 'Energy', 'Anonymous session');
    insert into rls_results values ('anonymous sessions cannot write', false);
  exception when insufficient_privilege then
    insert into rls_results values ('anonymous sessions cannot write', true);
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);

  -- Member B cannot change or delete A's profile.
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  update public.company_profiles set name = 'Hijacked' where id = profile_a;
  get diagnostics affected = row_count;
  insert into rls_results values ('other member cannot update', affected = 0);
  delete from public.company_profiles where id = profile_a;
  get diagnostics affected = row_count;
  insert into rls_results values ('other member cannot delete', affected = 0);
  insert into rls_results values ('other member can still read it', exists (select 1 from public.company_profiles where id = profile_a));
  insert into rls_results values ('other member cannot see who owns it', not exists (select 1 from public.company_profile_owners where profile_id = profile_a));
  begin
    insert into storage.objects (bucket_id, name) values ('company-media', profile_a::text || '/cover.png');
    insert into rls_results values ('other member cannot upload images to it', false);
  exception when insufficient_privilege then
    insert into rls_results values ('other member cannot upload images to it', true);
  end;

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  insert into rls_results values ('visitors can read published profile details', exists (select name, logo_path from public.company_profiles where id = profile_a));
  begin
    perform owner_id from public.company_profiles limit 1;
    insert into rls_results values ('visitors cannot read profile owners', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visitors cannot read profile owners', true);
  end;
  begin
    perform 1 from public.company_profile_owners limit 1;
    insert into rls_results values ('visitors cannot read the owners list', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visitors cannot read the owners list', true);
  end;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);

  -- Per-account limit of 5 profiles.
  for i in 1..5 loop
    insert into public.company_profiles (name, industry, description) values ('B ' || i, 'Construction', 'Member B company');
  end loop;
  begin
    insert into public.company_profiles (name, industry, description) values ('B 6', 'Construction', 'One too many');
    insert into rls_results values ('sixth profile is rejected', false);
  exception when check_violation then
    insert into rls_results values ('sixth profile is rejected', true);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  begin
    insert into public.company_profiles (owner_id, name, industry, description) values (user_b, 'Probe', 'Energy', 'Probing B''s count');
    insert into rls_results values ('another account''s profile count cannot be probed', false);
  exception when insufficient_privilege then
    insert into rls_results values ('another account''s profile count cannot be probed', true);
  when check_violation then
    insert into rls_results values ('another account''s profile count cannot be probed', false);
  end;

  -- Owner can delete their own, once its images are removed.
  begin
    delete from public.company_profiles where id = profile_a;
    insert into rls_results values ('a profile cannot be deleted while its images remain', false);
  exception when object_not_in_prerequisite_state then
    insert into rls_results values ('a profile cannot be deleted while its images remain', true);
  end;
  perform set_config('storage.allow_delete_query', 'true', true);
  delete from storage.objects where bucket_id = 'company-media' and name like profile_a::text || '/%';
  perform set_config('storage.allow_delete_query', 'false', true);
  delete from public.company_profiles where id = profile_a;
  get diagnostics affected = row_count;
  insert into rls_results values ('owner can delete', affected = 1);

  -- Deleting an account.
  insert into rls_results values ('visitors have no permission to run account deletion', not has_function_privilege('anon', 'public.delete_my_account()', 'execute'));
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    perform public.delete_my_account();
    insert into rls_results values ('visitors cannot delete accounts', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visitors cannot delete accounts', true);
  end;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  begin
    perform public.delete_my_account();
    insert into rls_results values ('anonymous sessions cannot delete an account', false);
  exception when insufficient_privilege then
    insert into rls_results values ('anonymous sessions cannot delete an account', true);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  begin
    perform public.delete_my_account();
    insert into rls_results values ('account deletion needs a sign-in time', false);
  exception when invalid_authorization_specification then
    insert into rls_results values ('account deletion needs a sign-in time', true);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated',
    'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint - 3600)))::text, true);
  begin
    perform public.delete_my_account();
    insert into rls_results values ('account deletion needs a sign-in from the last 30 minutes', false);
  exception when invalid_authorization_specification then
    insert into rls_results values ('account deletion needs a sign-in from the last 30 minutes', true);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated',
    'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint - 60)))::text, true);
  insert into public.company_profiles (name, industry, description) values ('A Again', 'Energy', 'Member A company')
  returning id into profile_a;
  insert into storage.objects (bucket_id, name) values ('company-media', profile_a::text || '/cover.png');
  begin
    perform public.delete_my_account();
    insert into rls_results values ('account deletion waits until uploaded images are removed', false);
  exception when object_not_in_prerequisite_state then
    insert into rls_results values ('account deletion waits until uploaded images are removed', true);
  end;
  perform set_config('role', 'postgres', true);
  insert into rls_results values ('a refused deletion keeps the account', exists (select 1 from auth.users where id = user_a));
  perform set_config('role', 'authenticated', true);

  perform set_config('storage.allow_delete_query', 'true', true);
  delete from storage.objects where bucket_id = 'company-media' and name like profile_a::text || '/%';
  perform set_config('storage.allow_delete_query', 'false', true);
  perform public.delete_my_account();
  perform set_config('role', 'postgres', true);
  insert into rls_results values ('member deletes their own account', not exists (select 1 from auth.users where id = user_a));
  insert into rls_results values ('their company profiles are deleted with it', not exists (select 1 from public.company_profiles where owner_id = user_a));
  insert into rls_results values ('other accounts are untouched', exists (select 1 from auth.users where id = user_b) and (select count(*) from public.company_profiles where owner_id = user_b) = 5);
end;
$$;

select check_name, case when passed then 'PASS' else 'FAIL' end as result from rls_results;
rollback;
