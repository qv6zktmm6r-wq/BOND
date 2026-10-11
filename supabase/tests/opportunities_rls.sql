-- Access-rule checks for public.opportunities and public.opportunity_responses.
-- Runs in a transaction that is always rolled back.
-- Run: supabase db query --linked -f supabase/tests/opportunities_rls.sql
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'opp-a@example.test'),
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'opp-b@example.test'),
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'opp-c@example.test');

create temporary table rls_results (check_name text, passed boolean) on commit drop;
grant all on rls_results to anon, authenticated;

do $$
declare
  user_a constant uuid := '00000000-0000-4000-8000-0000000000a1';
  user_b constant uuid := '00000000-0000-4000-8000-0000000000b1';
  user_c constant uuid := '00000000-0000-4000-8000-0000000000c1';
  profile_a uuid;
  profile_b uuid;
  opportunity_a uuid;
  response_b uuid;
  stamp timestamptz;
  affected integer;
  seen integer;
  i integer;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description) values ('Poster Co', 'Construction', 'Posts requests')
  returning id into profile_a;
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description) values ('Responder Co', 'Engineering', 'Responds to requests')
  returning id into profile_b;

  -- Posting.
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.opportunities (profile_id, type, title, summary, scope, seeking, location)
  values (profile_a, 'Service', 'Need an engineer', 'Structural review for a small build', array['Licensed in California'], 'Engineering', 'San Diego')
  returning id, created_at into opportunity_a, stamp;
  insert into rls_results values ('member posts an opportunity for their own company', opportunity_a is not null and stamp > now() - interval '1 minute');

  begin
    insert into public.opportunities (profile_id, type, title, summary, created_at) values (profile_a, 'Service', 'Backdated', 'Backdated', now() - interval '1 year');
    insert into rls_results values ('post time cannot be set by the member', false);
  exception when insufficient_privilege then
    insert into rls_results values ('post time cannot be set by the member', true);
  end;

  begin
    insert into public.opportunities (profile_id, type, title, summary) values (profile_a, 'Giveaway', 'Bad type', 'Bad type');
    insert into rls_results values ('unknown opportunity type is rejected', false);
  exception when check_violation then
    insert into rls_results values ('unknown opportunity type is rejected', true);
  end;

  begin
    insert into public.opportunities (profile_id, type, title, summary) values (profile_a, 'Service', '   ', 'Blank title');
    insert into rls_results values ('blank headline is rejected', false);
  exception when check_violation then
    insert into rls_results values ('blank headline is rejected', true);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  begin
    insert into public.opportunities (profile_id, type, title, summary) values (profile_a, 'Service', 'Spoof', 'Posting as someone else');
    insert into rls_results values ('member cannot post as another company', false);
  exception when insufficient_privilege then
    insert into rls_results values ('member cannot post as another company', true);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  begin
    insert into public.opportunities (profile_id, type, title, summary) values (profile_b, 'Service', 'Anon', 'Anonymous session');
    insert into rls_results values ('anonymous sessions cannot post', false);
  exception when insufficient_privilege then
    insert into rls_results values ('anonymous sessions cannot post', true);
  end;

  -- Visitors.
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  insert into rls_results values ('visitors can read opportunities', exists (select 1 from public.opportunities where id = opportunity_a));
  begin
    insert into public.opportunities (profile_id, type, title, summary) values (profile_a, 'Service', 'Anon', 'Visitor post');
    insert into rls_results values ('visitors cannot post', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visitors cannot post', true);
  end;

  -- Responding.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into public.opportunity_responses (opportunity_id, profile_id, message, contact)
  values (opportunity_a, profile_b, 'We can help', 'b@example.test')
  returning id into response_b;
  insert into rls_results values ('member responds as their own company', response_b is not null);

  begin
    insert into public.opportunity_responses (opportunity_id, profile_id, message) values (opportunity_a, profile_a, 'Pretending to be the poster');
    insert into rls_results values ('member cannot respond as another company', false);
  exception when insufficient_privilege then
    insert into rls_results values ('member cannot respond as another company', true);
  end;

  begin
    insert into public.opportunity_responses (opportunity_id, responder_id, profile_id, message) values (opportunity_a, user_c, profile_b, 'Spoofed sender');
    insert into rls_results values ('responder account cannot be set by the member', false);
  exception when insufficient_privilege then
    insert into rls_results values ('responder account cannot be set by the member', true);
  end;

  begin
    perform responder_id from public.opportunity_responses;
    insert into rls_results values ('responder account ids are not readable', false);
  exception when insufficient_privilege then
    insert into rls_results values ('responder account ids are not readable', true);
  end;

  insert into public.opportunity_responses (opportunity_id, profile_id) values (opportunity_a, profile_b);
  insert into public.opportunity_responses (opportunity_id, profile_id) values (opportunity_a, profile_b);
  begin
    insert into public.opportunity_responses (opportunity_id, profile_id) values (opportunity_a, profile_b);
    insert into rls_results values ('a fourth response to one opportunity is rejected', false);
  exception when check_violation then
    insert into rls_results values ('a fourth response to one opportunity is rejected', true);
  end;

  delete from public.opportunities where id = opportunity_a;
  get diagnostics affected = row_count;
  insert into rls_results values ('member cannot delete another company''s opportunity', affected = 0);

  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  begin
    insert into public.opportunity_responses (opportunity_id, profile_id, message) values (opportunity_a, profile_a, 'Responding to myself');
    insert into rls_results values ('company cannot respond to its own opportunity', false);
  exception when insufficient_privilege then
    insert into rls_results values ('company cannot respond to its own opportunity', true);
  end;

  select count(*) into seen from public.opportunity_responses where opportunity_id = opportunity_a;
  insert into rls_results values ('posting company sees the responses it received', seen = 3);
  insert into rls_results values ('posting company sees the reply contact', exists (select 1 from public.opportunity_responses where id = response_b and contact = 'b@example.test'));

  perform set_config('request.jwt.claims', json_build_object('sub', user_c, 'role', 'authenticated')::text, true);
  select count(*) into seen from public.opportunity_responses;
  insert into rls_results values ('other members cannot see responses', seen = 0);

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    perform count(*) from public.opportunity_responses;
    insert into rls_results values ('visitors cannot read responses', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visitors cannot read responses', true);
  end;

  -- Limits and cleanup.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  for i in 2..20 loop
    insert into public.opportunities (profile_id, type, title, summary) values (profile_a, 'Partner', 'Post ' || i, 'Filler post');
  end loop;
  begin
    insert into public.opportunities (profile_id, type, title, summary) values (profile_a, 'Partner', 'Post 21', 'One too many');
    insert into rls_results values ('a 21st post for one company is rejected', false);
  exception when check_violation then
    insert into rls_results values ('a 21st post for one company is rejected', true);
  end;

  delete from public.opportunities where id = opportunity_a;
  get diagnostics affected = row_count;
  perform set_config('role', 'postgres', true);
  insert into rls_results values ('posting company deletes its opportunity', affected = 1);
  insert into rls_results values ('responses are deleted with the opportunity', not exists (select 1 from public.opportunity_responses where opportunity_id = opportunity_a));

  delete from public.company_profiles where id = profile_a;
  insert into rls_results values ('a company''s posts are deleted with its profile', not exists (select 1 from public.opportunities where profile_id = profile_a));
end;
$$;

select check_name, case when passed then 'PASS' else 'FAIL' end as result from rls_results;
rollback;
