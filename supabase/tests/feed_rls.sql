-- Access-rule checks for public.company_updates and public.company_follows.
-- Runs in a transaction that is always rolled back.
-- Run: supabase db query --linked -f supabase/tests/feed_rls.sql
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-4000-8000-0000000000a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'feed-a@example.test'),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'feed-b@example.test');

create temporary table rls_results (check_name text, passed boolean) on commit drop;
grant all on rls_results to anon, authenticated;

do $$
declare
  user_a constant uuid := '00000000-0000-4000-8000-0000000000a2';
  user_b constant uuid := '00000000-0000-4000-8000-0000000000b2';
  profile_a uuid;
  profile_b uuid;
  update_a uuid;
  stamp timestamptz;
  affected integer;
  seen integer;
  i integer;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description) values ('Feed A', 'Energy', 'Shares updates')
  returning id into profile_a;
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description) values ('Feed B', 'Logistics', 'Follows companies')
  returning id into profile_b;

  -- Updates.
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.company_updates (profile_id, type, text) values (profile_a, 'project', 'Finished a rooftop install')
  returning id, created_at into update_a, stamp;
  insert into rls_results values ('member shares an update for their own company', update_a is not null and stamp > now() - interval '1 minute');

  begin
    insert into public.company_updates (profile_id, type, text, created_at) values (profile_a, 'project', 'Backdated', now() - interval '1 year');
    insert into rls_results values ('update time cannot be set by the member', false);
  exception when insufficient_privilege then
    insert into rls_results values ('update time cannot be set by the member', true);
  end;

  begin
    insert into public.company_updates (profile_id, type, text) values (profile_a, 'advert', 'Unknown type');
    insert into rls_results values ('unknown update type is rejected', false);
  exception when check_violation then
    insert into rls_results values ('unknown update type is rejected', true);
  end;

  begin
    insert into public.company_updates (profile_id, type, text) values (profile_a, 'project', '   ');
    insert into rls_results values ('blank update is rejected', false);
  exception when check_violation then
    insert into rls_results values ('blank update is rejected', true);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  begin
    insert into public.company_updates (profile_id, type, text) values (profile_a, 'project', 'Posting as A');
    insert into rls_results values ('member cannot post as another company', false);
  exception when insufficient_privilege then
    insert into rls_results values ('member cannot post as another company', true);
  end;
  delete from public.company_updates where id = update_a;
  get diagnostics affected = row_count;
  insert into rls_results values ('member cannot delete another company''s update', affected = 0);

  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  begin
    insert into public.company_updates (profile_id, type, text) values (profile_b, 'project', 'Anonymous');
    insert into rls_results values ('anonymous sessions cannot post updates', false);
  exception when insufficient_privilege then
    insert into rls_results values ('anonymous sessions cannot post updates', true);
  end;

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  insert into rls_results values ('visitors can read updates', exists (select 1 from public.company_updates where id = update_a));
  begin
    insert into public.company_updates (profile_id, type, text) values (profile_a, 'project', 'Visitor');
    insert into rls_results values ('visitors cannot post updates', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visitors cannot post updates', true);
  end;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  for i in 2..20 loop
    insert into public.company_updates (profile_id, type, text) values (profile_a, 'capability', 'Update ' || i);
  end loop;
  delete from public.company_updates where profile_id = profile_a and text = 'Update 20';
  begin
    insert into public.company_updates (profile_id, type, text) values (profile_a, 'capability', 'Update 21');
    insert into rls_results values ('a 21st update in a day is rejected, even after deleting one', false);
  exception when check_violation then
    insert into rls_results values ('a 21st update in a day is rejected, even after deleting one', true);
  end;

  delete from public.company_updates where id = update_a;
  get diagnostics affected = row_count;
  insert into rls_results values ('company deletes its own update', affected = 1);

  -- Follows.
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into public.company_follows (profile_id) values (profile_a);
  select count(*) into seen from public.company_follows where profile_id = profile_a;
  insert into rls_results values ('member follows a company and sees it', seen = 1);

  begin
    insert into public.company_follows (user_id, profile_id) values (user_a, profile_b);
    insert into rls_results values ('member cannot follow on someone else''s behalf', false);
  exception when insufficient_privilege then
    insert into rls_results values ('member cannot follow on someone else''s behalf', true);
  end;

  begin
    perform user_id from public.company_follows;
    insert into rls_results values ('follower account ids are not readable', false);
  exception when insufficient_privilege then
    insert into rls_results values ('follower account ids are not readable', true);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  select count(*) into seen from public.company_follows;
  insert into rls_results values ('the followed company cannot see who follows it', seen = 0);
  delete from public.company_follows where profile_id = profile_a;
  get diagnostics affected = row_count;
  insert into rls_results values ('members cannot remove someone else''s follow', affected = 0);

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    perform count(*) from public.company_follows;
    insert into rls_results values ('visitors cannot read follows', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visitors cannot read follows', true);
  end;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  delete from public.company_follows where profile_id = profile_a;
  get diagnostics affected = row_count;
  insert into rls_results values ('member unfollows a company', affected = 1);

  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  begin
    insert into public.company_follows (profile_id) values (profile_a);
    insert into rls_results values ('anonymous sessions cannot follow', false);
  exception when insufficient_privilege then
    insert into rls_results values ('anonymous sessions cannot follow', true);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  begin
    insert into public.company_updates (profile_id, type, text) values (profile_a, 'project', 'Call +1 555 0100' || chr(8238) || '0010');
    insert into rls_results values ('direction-changing characters are rejected in updates', false);
  exception when check_violation then
    insert into rls_results values ('direction-changing characters are rejected in updates', true);
  end;
  begin
    insert into public.company_updates (profile_id, type, text) values (profile_a, 'project', 'Hidden' || chr(8203) || 'text');
    insert into rls_results values ('zero-width characters are rejected in updates', false);
  exception when check_violation then
    insert into rls_results values ('zero-width characters are rejected in updates', true);
  end;

  perform set_config('role', 'postgres', true);
  delete from private.company_update_log;
  perform set_config('role', 'authenticated', true);
  insert into public.company_updates (profile_id, type, text) values (profile_a, 'project', 'Visible update for visitors');
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    delete from public.company_updates where profile_id = profile_a;
    insert into rls_results values ('visitors cannot delete updates', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visitors cannot delete updates', true);
  end;

  perform set_config('role', 'postgres', true);
  delete from private.company_update_log;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  select count(*) into seen from public.company_updates where profile_id = profile_a;
  for i in (seen + 1)..100 loop
    insert into public.company_updates (profile_id, type, text) values (profile_a, 'capability', 'Bulk ' || i);
    perform set_config('role', 'postgres', true);
    update private.company_update_log set created_at = now() - interval '3 days';
    perform set_config('role', 'authenticated', true);
  end loop;
  begin
    insert into public.company_updates (profile_id, type, text) values (profile_a, 'capability', 'Update 101');
    insert into rls_results values ('a company''s 101st update is rejected', false);
  exception when check_violation then
    insert into rls_results values ('a company''s 101st update is rejected', true);
  end;
  perform set_config('role', 'postgres', true);
  insert into rls_results values ('old update log rows are pruned', (select count(*) from private.company_update_log) <= 1);

  delete from private.company_follow_log;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  for i in 1..200 loop
    insert into public.company_follows (profile_id) values (profile_a);
    delete from public.company_follows where profile_id = profile_a;
  end loop;
  begin
    insert into public.company_follows (profile_id) values (profile_a);
    insert into rls_results values ('a 201st follow in a day is rejected, even after unfollowing', false);
  exception when check_violation then
    insert into rls_results values ('a 201st follow in a day is rejected, even after unfollowing', true);
  end;

  perform set_config('role', 'postgres', true);
  delete from private.company_follow_log;
  perform set_config('role', 'authenticated', true);
  insert into public.company_follows (profile_id) values (profile_a);
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    delete from public.company_follows where profile_id = profile_a;
    insert into rls_results values ('visitors cannot delete follows', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visitors cannot delete follows', true);
  end;

  perform set_config('role', 'postgres', true);
  delete from public.company_profiles where id = profile_a;
  insert into rls_results values ('updates and follows are deleted with the company',
    not exists (select 1 from public.company_updates where profile_id = profile_a)
    and not exists (select 1 from public.company_follows where profile_id = profile_a));
  delete from auth.users where id = user_b;
  insert into rls_results values ('follows are deleted with the account', not exists (select 1 from public.company_follows where user_id = user_b));
end;
$$;

select check_name, case when passed then 'PASS' else 'FAIL' end as result from rls_results;
rollback;
