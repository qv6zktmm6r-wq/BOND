-- Text-rule checks for company profiles, Opportunity Board posts and responses, events, and updates.
-- Each rejection must come from the table's text-rule constraint, not an unrelated one.
-- Runs in a transaction that is always rolled back.
-- Run: supabase db query --linked -f supabase/tests/text_rules.sql
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-4000-8000-0000000000a5', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'text-a@example.test'),
  ('00000000-0000-4000-8000-0000000000b5', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'text-b@example.test');

create temporary table rls_results (check_name text, passed boolean) on commit drop;
grant all on rls_results to anon, authenticated;

create function pg_temp.violated(statement text)
returns text
language plpgsql
as $$
declare
  name text;
begin
  execute statement;
  return 'accepted';
exception when check_violation then
  get stacked diagnostics name = constraint_name;
  return name;
end;
$$;

do $$
declare
  user_a constant uuid := '00000000-0000-4000-8000-0000000000a5';
  user_b constant uuid := '00000000-0000-4000-8000-0000000000b5';
  profile_a uuid;
  profile_b uuid;
  opportunity_a uuid;
  response_b uuid;
  event_a uuid;
  update_a uuid;
  profiles constant text := 'insert into public.company_profiles (name, industry, description, location, tagline, services) values (%L, ''Construction'', %L, %L, %L, %L)';
  opportunities text;
  responses text;
  events text;
  updates text;
  expect record;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description, story, services)
  values ('Plain Co', 'Construction', 'First line' || chr(10) || 'Second line', 'Founded in 2010.' || chr(10) || 'Still here.', array['Framing', 'Roofing'])
  returning id into profile_a;
  insert into rls_results values ('ordinary profile text with line breaks is allowed', profile_a is not null);
  insert into rls_results values ('Arabic, Hebrew, CJK, and emoji names are allowed',
    pg_temp.violated(format(profiles, 'مطبعة עברית 東京 🚀 Co', 'Multilingual', '', '', '{}')) = 'accepted');

  for expect in select * from (values
    ('direction-changing characters are rejected in company names', 'Mirror' || chr(8238) || 'oC', 'Spoofed', '', '', '{}'),
    ('invisible filler names are rejected', chr(12644) || chr(12644), 'Filler', '', '', '{}'),
    ('names made of no-break and wide spaces are rejected', chr(160) || chr(12288), 'Spaces', '', '', '{}'),
    ('names made of blank Braille patterns are rejected', chr(10240) || chr(10240), 'Braille', '', '', '{}'),
    ('descriptions made only of line breaks are rejected', 'Blank Description Co', chr(10) || chr(10), '', '', '{}'),
    ('line breaks are rejected in company names', 'Two' || chr(10) || 'lines', 'Multi-line', '', '', '{}'),
    ('control characters are rejected in locations', 'Bell Co', 'Bell', 'Austin' || chr(7), '', '{}'),
    ('C1 control characters are rejected in taglines', 'C1 Co', 'C1', '', 'Fast' || chr(150), '{}'),
    ('invisible musical formatting is rejected in taglines', 'Music Co', 'Music', '', 'Fast' || chr(119155), '{}'),
    ('hidden tag characters are rejected in services', 'Tagged Co', 'Tags', '', '', array['Framing' || chr(917537)]::text)
  ) as t(check_name, name, description, location, tagline, services) loop
    insert into rls_results values (expect.check_name,
      pg_temp.violated(format(profiles, expect.name, expect.description, expect.location, expect.tagline, expect.services)) = 'company_profiles_text_plain');
  end loop;
  insert into rls_results values ('bare carriage returns are rejected when editing a story', pg_temp.violated(format(
    'update public.company_profiles set story = %L where id = %L', 'Story' || chr(13) || 'URL:https://phish.example/', profile_a)) = 'company_profiles_text_plain');
  insert into rls_results values ('direction-changing characters are rejected when editing projects', pg_temp.violated(format(
    'update public.company_profiles set projects = %L where id = %L', array['Bridge' || chr(8207)]::text, profile_a)) = 'company_profiles_text_plain');

  insert into public.opportunities (profile_id, type, title, summary, scope)
  values (profile_a, 'Service', 'Need an engineer', 'Structural review.' || chr(10) || 'Two days.', array['Licensed'])
  returning id into opportunity_a;
  insert into rls_results values ('ordinary opportunity text is allowed', opportunity_a is not null);
  opportunities := 'insert into public.opportunities (profile_id, type, title, summary, scope) values (' || quote_literal(profile_a) || ', ''Service'', %L, %L, %L)';
  for expect in select * from (values
    ('direction marks are rejected in opportunity titles', 'Need' || chr(1564) || ' help', 'Mark', '{}'),
    ('whitespace-only opportunity summaries are rejected', 'Blank summary', chr(10) || chr(12288), '{}'),
    ('tabs are rejected in opportunity scope', 'Tabbed', 'Scope', array['Two' || chr(9) || 'days']::text),
    ('line separators are rejected in opportunity summaries', 'Separated', 'One' || chr(8232) || 'two', '{}')
  ) as t(check_name, title, summary, scope) loop
    insert into rls_results values (expect.check_name,
      pg_temp.violated(format(opportunities, expect.title, expect.summary, expect.scope)) = 'opportunities_text_plain');
  end loop;

  insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, location, description)
  values (profile_a, 'Open house', 'in-person', now() + interval '7 days', 60, 'Austin, TX', 'Tour the shop.' || chr(10) || 'Coffee provided.')
  returning id into event_a;
  insert into rls_results values ('ordinary event text is allowed', event_a is not null);
  events := 'insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, location, description) values ('
    || quote_literal(profile_a) || ', %L, %L, now() + interval ''7 days'', 60, %L, %L)';
  for expect in select * from (values
    ('in-person events need a visible location', 'Blank place', 'in-person', chr(12288), 'Details'),
    ('C1 control characters are rejected in event titles', 'Open' || chr(155) || 'house', 'online', '', 'Details'),
    ('direction-changing characters are rejected in event descriptions', 'Spoof', 'online', '', 'Join' || chr(8237) || ' now')
  ) as t(check_name, title, format, location, description) loop
    insert into rls_results values (expect.check_name,
      pg_temp.violated(format(events, expect.title, expect.format, expect.location, expect.description)) = 'company_events_text_plain');
  end loop;

  insert into public.company_updates (profile_id, type, text) values (profile_a, 'project', 'Finished a bridge.' || chr(10) || 'Photos soon.')
  returning id into update_a;
  insert into rls_results values ('ordinary update text with line breaks is allowed', update_a is not null);
  updates := 'insert into public.company_updates (profile_id, type, text) values (' || quote_literal(profile_a) || ', ''project'', %L)';
  insert into rls_results values ('control characters are rejected in updates',
    pg_temp.violated(format(updates, 'Done' || chr(7))) = 'company_updates_text_plain');
  insert into rls_results values ('updates made of wide spaces are rejected',
    pg_temp.violated(format(updates, chr(12288) || chr(10) || chr(12288))) = 'company_updates_text_plain');

  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description) values ('Reply Co', 'Engineering', 'Responds')
  returning id into profile_b;
  insert into public.opportunity_responses (opportunity_id, profile_id, message)
  values (opportunity_a, profile_b, 'We can help.' || chr(10) || 'Call us.')
  returning id into response_b;
  insert into rls_results values ('ordinary response text is allowed', response_b is not null);
  responses := 'insert into public.opportunity_responses (opportunity_id, profile_id, message) values ('
    || quote_literal(opportunity_a) || ', ' || quote_literal(profile_b) || ', %L)';
  insert into rls_results values ('invisible characters are rejected in responses',
    pg_temp.violated(format(responses, 'Hidden' || chr(8203) || 'text')) = 'opportunity_responses_text_plain');
  insert into rls_results values ('bare carriage returns are rejected in responses',
    pg_temp.violated(format(responses, 'Reply' || chr(13) || 'here')) = 'opportunity_responses_text_plain');
end;
$$;

select check_name, case when passed then 'PASS' else 'FAIL' end as result from rls_results;
rollback;
