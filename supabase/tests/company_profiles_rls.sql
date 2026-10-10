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
  insert into rls_results values ('member inserts own profile with default owner', (select owner_id = user_a from public.company_profiles where id = profile_a));

  begin
    insert into public.company_profiles (owner_id, name, industry, description) values (user_b, 'Spoof', 'Energy', 'Pretending to be B');
    insert into rls_results values ('member cannot insert for someone else', false);
  exception when insufficient_privilege then
    insert into rls_results values ('member cannot insert for someone else', true);
  end;

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
  select owner_id into owner_after from public.company_profiles where id = profile_a;
  insert into rls_results values ('owner can update but not hand the profile to someone else', owner_after = user_a);

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
    update public.company_profiles set logo_path = user_a::text || '/' || gen_random_uuid()::text || '/logo.png' where id = profile_a;
    insert into rls_results values ('image path for another profile is rejected', false);
  exception when check_violation then
    insert into rls_results values ('image path for another profile is rejected', true);
  end;

  update public.company_profiles set logo_path = user_a::text || '/' || profile_a::text || '/logo.webp' where id = profile_a;
  insert into rls_results values ('exact image path for own profile is accepted', (select logo_path <> '' from public.company_profiles where id = profile_a));

  insert into storage.objects (bucket_id, name) values ('company-media', user_a::text || '/' || profile_a::text || '/logo.webp');
  insert into rls_results values ('member uploads media for own profile', true);

  begin
    insert into storage.objects (bucket_id, name) values ('company-media', user_a::text || '/' || gen_random_uuid()::text || '/logo.png');
    insert into rls_results values ('upload for a profile that is not yours is rejected', false);
  exception when insufficient_privilege then
    insert into rls_results values ('upload for a profile that is not yours is rejected', true);
  end;

  begin
    insert into storage.objects (bucket_id, name) values ('company-media', user_a::text || '/' || profile_a::text || '/extra-file.png');
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

  -- Owner can delete their own.
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  delete from public.company_profiles where id = profile_a;
  get diagnostics affected = row_count;
  insert into rls_results values ('owner can delete', affected = 1);

  perform set_config('role', 'postgres', true);
end;
$$;

select check_name, case when passed then 'PASS' else 'FAIL' end as result from rls_results;
rollback;
