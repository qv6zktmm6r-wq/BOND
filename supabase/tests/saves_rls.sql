-- Access-rule checks for public.company_saves.
-- Runs in a transaction that is always rolled back.
-- Run: supabase db query --linked -f supabase/tests/saves_rls.sql
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-4000-8000-0000000000a6', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'saves-a@example.test'),
  ('00000000-0000-4000-8000-0000000000b6', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'saves-b@example.test');

create temporary table rls_results (check_name text, passed boolean) on commit drop;
grant all on rls_results to anon, authenticated;

do $$
declare
  user_a constant uuid := '00000000-0000-4000-8000-0000000000a6';
  user_b constant uuid := '00000000-0000-4000-8000-0000000000b6';
  profile_a uuid;
  profile_b uuid;
  affected integer;
  seen integer;
  i integer;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description) values ('Saved A', 'Energy', 'Gets saved')
  returning id into profile_a;
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description) values ('Saver B', 'Logistics', 'Saves companies')
  returning id into profile_b;

  insert into public.company_saves (profile_id) values (profile_a);
  select count(*) into seen from public.company_saves where profile_id = profile_a;
  insert into rls_results values ('member saves a company and sees it', seen = 1);

  insert into public.company_saves (profile_id) values (profile_a);
  get diagnostics affected = row_count;
  select count(*) into seen from public.company_saves;
  insert into rls_results values ('saving the same company again is skipped without an error', affected = 0 and seen = 1);
  perform set_config('role', 'postgres', true);
  insert into rls_results values ('a skipped save does not count toward the daily limit',
    (select count(*) from private.company_save_log where user_id = user_b) = 1);
  perform set_config('role', 'authenticated', true);

  begin
    insert into public.company_saves (user_id, profile_id) values (user_a, profile_b);
    insert into rls_results values ('member cannot save on someone else''s behalf', false);
  exception when insufficient_privilege then
    insert into rls_results values ('member cannot save on someone else''s behalf', true);
  end;

  begin
    perform user_id from public.company_saves;
    insert into rls_results values ('saver account ids are not readable', false);
  exception when insufficient_privilege then
    insert into rls_results values ('saver account ids are not readable', true);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  select count(*) into seen from public.company_saves;
  insert into rls_results values ('the saved company cannot see who saved it', seen = 0);
  delete from public.company_saves where profile_id = profile_a;
  get diagnostics affected = row_count;
  insert into rls_results values ('members cannot remove someone else''s save', affected = 0);
  insert into public.company_saves (profile_id) values (profile_a);
  get diagnostics affected = row_count;
  insert into rls_results values ('another member''s save of the same company is not skipped', affected = 1);
  begin
    update public.company_saves set created_at = now() - interval '1 year';
    insert into rls_results values ('members cannot edit saves', false);
  exception when insufficient_privilege then
    insert into rls_results values ('members cannot edit saves', true);
  end;
  begin
    perform count(*) from private.company_save_log;
    insert into rls_results values ('members cannot read the save log', false);
  exception when insufficient_privilege then
    insert into rls_results values ('members cannot read the save log', true);
  end;

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    perform count(*) from public.company_saves;
    insert into rls_results values ('visitors cannot read saves', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visitors cannot read saves', true);
  end;
  begin
    delete from public.company_saves where profile_id = profile_a;
    insert into rls_results values ('visitors cannot delete saves', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visitors cannot delete saves', true);
  end;
  begin
    insert into public.company_saves (profile_id) values (profile_a);
    insert into rls_results values ('visitors cannot save companies', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visitors cannot save companies', true);
  end;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  delete from public.company_saves where profile_id = profile_a;
  get diagnostics affected = row_count;
  insert into rls_results values ('member unsaves a company', affected = 1);

  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  begin
    insert into public.company_saves (profile_id) values (profile_a);
    insert into rls_results values ('anonymous sessions cannot save', false);
  exception when insufficient_privilege then
    insert into rls_results values ('anonymous sessions cannot save', true);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  perform set_config('role', 'postgres', true);
  delete from private.company_save_log;
  perform set_config('role', 'authenticated', true);
  for i in 1..200 loop
    insert into public.company_saves (profile_id) values (profile_a);
    delete from public.company_saves where profile_id = profile_a;
  end loop;
  begin
    insert into public.company_saves (profile_id) values (profile_a);
    insert into rls_results values ('a 201st save in a day is rejected, even after unsaving', false);
  exception when check_violation then
    insert into rls_results values ('a 201st save in a day is rejected, even after unsaving', true);
  end;

  perform set_config('role', 'postgres', true);
  update private.company_save_log set created_at = now() - interval '3 days';
  set local session_replication_role = replica;
  insert into public.company_saves (user_id, profile_id) select user_b, gen_random_uuid() from generate_series(1, 500);
  set local session_replication_role = origin;
  perform set_config('role', 'authenticated', true);
  begin
    insert into public.company_saves (profile_id) values (profile_a);
    insert into rls_results values ('a 501st saved company is rejected', false);
  exception when check_violation then
    insert into rls_results values ('a 501st saved company is rejected', true);
  end;
  perform set_config('role', 'postgres', true);
  set local session_replication_role = replica;
  delete from public.company_saves where profile_id <> profile_a;
  set local session_replication_role = origin;

  perform set_config('role', 'authenticated', true);
  insert into public.company_saves (profile_id) values (profile_a);
  perform set_config('role', 'postgres', true);
  insert into rls_results values ('old save log rows are pruned', (select count(*) from private.company_save_log) = 1);
  delete from public.company_profiles where id = profile_a;
  insert into rls_results values ('saves are deleted with the company', not exists (select 1 from public.company_saves where profile_id = profile_a));
  insert into public.company_saves (user_id, profile_id) values (user_b, profile_b);
  delete from auth.users where id = user_b;
  insert into rls_results values ('saves are deleted with the account', not exists (select 1 from public.company_saves where user_id = user_b));
end;
$$;

select check_name, case when passed then 'PASS' else 'FAIL' end as result from rls_results;
rollback;
