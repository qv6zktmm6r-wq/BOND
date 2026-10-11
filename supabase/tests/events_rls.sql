-- Access-rule checks for public.company_events, company_event_links, and company_event_rsvps.
-- Runs in a transaction that is always rolled back.
-- Run: supabase db query --linked -f supabase/tests/events_rls.sql
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-4000-8000-0000000000a3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'events-a@example.test'),
  ('00000000-0000-4000-8000-0000000000b3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'events-b@example.test'),
  ('00000000-0000-4000-8000-0000000000c3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'events-c@example.test');

create temporary table rls_results (check_name text, passed boolean) on commit drop;
grant all on rls_results to anon, authenticated;

do $$
declare
  user_a constant uuid := '00000000-0000-4000-8000-0000000000a3';
  user_b constant uuid := '00000000-0000-4000-8000-0000000000b3';
  user_c constant uuid := '00000000-0000-4000-8000-0000000000c3';
  profile_a uuid;
  profile_b uuid;
  open_house uuid;
  webinar uuid;
  small uuid;
  stamp timestamptz;
  affected integer;
  seen integer;
  going_now integer;
  attendee uuid;
  i integer;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description) values ('Events A', 'Construction', 'Hosts events')
  returning id into profile_a;
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description) values ('Events B', 'Energy', 'Attends events')
  returning id into profile_b;

  -- Hosting.
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, location, description)
  values (profile_a, 'Open house', 'in-person', now() + interval '3 days', 90, 'San Diego, California', 'Walk the site.')
  returning id, created_at into open_house, stamp;
  insert into rls_results values ('member hosts an event for their own company', open_house is not null and stamp > now() - interval '1 minute');

  begin
    insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, description)
    values (profile_a, 'Yesterday', 'online', now() - interval '1 day', 60, 'Too late.');
    insert into rls_results values ('events must start in the future', false);
  exception when check_violation then
    insert into rls_results values ('events must start in the future', true);
  end;

  begin
    insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, location, description)
    values (profile_a, 'Online with address', 'online', now() + interval '1 day', 60, 'Somewhere', 'Mismatch.');
    insert into rls_results values ('online events cannot carry an address', false);
  exception when check_violation then
    insert into rls_results values ('online events cannot carry an address', true);
  end;

  begin
    insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, description)
    values (profile_a, 'Hidden' || chr(8238) || 'title', 'online', now() + interval '1 day', 60, 'Spoof.');
    insert into rls_results values ('direction-changing characters are rejected in events', false);
  exception when check_violation then
    insert into rls_results values ('direction-changing characters are rejected in events', true);
  end;

  begin
    insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, description, going)
    values (profile_a, 'Inflated', 'online', now() + interval '1 day', 60, 'Fake count.', 500);
    insert into rls_results values ('the going count cannot be set by the host', false);
  exception when insufficient_privilege then
    insert into rls_results values ('the going count cannot be set by the host', true);
  end;

  insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, description, capacity)
  values (profile_a, 'Webinar', 'online', now() + interval '5 days', 60, 'Online demo.', 0)
  returning id into webinar;
  insert into public.company_event_links (event_id, link) values (webinar, 'https://meet.example.com/abc-defg');
  insert into rls_results values ('host adds a join link to an online event',
    exists (select 1 from public.company_event_links where event_id = webinar));

  begin
    insert into public.company_event_links (event_id, link) values (open_house, 'https://meet.example.com/x');
    insert into rls_results values ('in-person events cannot get a join link', false);
  exception when insufficient_privilege then
    insert into rls_results values ('in-person events cannot get a join link', true);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  begin
    insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, description)
    values (profile_a, 'As A', 'online', now() + interval '1 day', 60, 'Spoofed host.');
    insert into rls_results values ('member cannot host as another company', false);
  exception when insufficient_privilege then
    insert into rls_results values ('member cannot host as another company', true);
  end;
  begin
    insert into public.company_event_links (event_id, link) values (open_house, 'https://evil.example.com/');
    insert into rls_results values ('member cannot add a join link to another company''s event', false);
  exception when insufficient_privilege then
    insert into rls_results values ('member cannot add a join link to another company''s event', true);
  end;
  select count(*) into seen from public.company_event_links where event_id = webinar;
  insert into rls_results values ('join links are hidden before you RSVP', seen = 0);
  delete from public.company_events where id = webinar;
  get diagnostics affected = row_count;
  insert into rls_results values ('member cannot cancel another company''s event', affected = 0);

  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  begin
    insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, description)
    values (profile_b, 'Anonymous', 'online', now() + interval '1 day', 60, 'Anonymous host.');
    insert into rls_results values ('anonymous sessions cannot host events', false);
  exception when insufficient_privilege then
    insert into rls_results values ('anonymous sessions cannot host events', true);
  end;
  begin
    insert into public.company_event_rsvps (event_id) values (webinar);
    insert into rls_results values ('anonymous sessions cannot RSVP', false);
  exception when insufficient_privilege then
    insert into rls_results values ('anonymous sessions cannot RSVP', true);
  end;

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  insert into rls_results values ('visitors can read events', exists (select 1 from public.company_events where id = open_house));
  begin
    perform count(*) from public.company_event_links;
    insert into rls_results values ('visitors cannot read join links', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visitors cannot read join links', true);
  end;
  begin
    perform count(*) from public.company_event_rsvps;
    insert into rls_results values ('visitors cannot read RSVPs', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visitors cannot read RSVPs', true);
  end;

  -- RSVPs.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into public.company_event_rsvps (event_id, profile_id) values (webinar, profile_b);
  select going into going_now from public.company_events where id = webinar;
  insert into rls_results values ('member RSVPs as their company and the going count rises', going_now = 1);
  select count(*) into seen from public.company_event_links where event_id = webinar;
  insert into rls_results values ('attendees see the join link', seen = 1);
  begin
    insert into public.company_event_rsvps (event_id) values (webinar);
    insert into rls_results values ('one RSVP per account per event', false);
  exception when unique_violation then
    insert into rls_results values ('one RSVP per account per event', true);
  end;
  begin
    perform user_id from public.company_event_rsvps;
    insert into rls_results values ('RSVP account ids are not readable', false);
  exception when insufficient_privilege then
    insert into rls_results values ('RSVP account ids are not readable', true);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', user_c, 'role', 'authenticated')::text, true);
  begin
    insert into public.company_event_rsvps (event_id, profile_id) values (webinar, profile_a);
    insert into rls_results values ('member cannot RSVP as another company', false);
  exception when insufficient_privilege then
    insert into rls_results values ('member cannot RSVP as another company', true);
  end;
  select count(*) into seen from public.company_event_rsvps;
  insert into rls_results values ('members cannot see other people''s RSVPs', seen = 0);
  insert into public.company_event_rsvps (event_id) values (webinar);
  select count(*) into seen from public.company_event_rsvps where event_id = webinar;
  insert into rls_results values ('member RSVPs as themselves and sees only their own RSVP', seen = 1);
  delete from public.company_event_rsvps where event_id = webinar and profile_id = profile_b;
  get diagnostics affected = row_count;
  insert into rls_results values ('members cannot cancel someone else''s RSVP', affected = 0);

  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  select count(*) filter (where profile_id = profile_b), count(*) filter (where profile_id is null)
  into seen, affected from public.company_event_rsvps where event_id = webinar;
  insert into rls_results values ('host sees the attending company and a member attending as themselves', seen = 1 and affected = 1);
  begin
    insert into public.company_event_rsvps (event_id) values (webinar);
    insert into rls_results values ('hosts cannot RSVP to their own event', false);
  exception when check_violation then
    insert into rls_results values ('hosts cannot RSVP to their own event', true);
  end;
  delete from public.company_event_rsvps where event_id = webinar;
  get diagnostics affected = row_count;
  insert into rls_results values ('hosts cannot remove attendees'' RSVPs', affected = 0);

  insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, description, capacity)
  values (profile_a, 'One seat', 'online', now() + interval '2 days', 30, 'Small session.', 1)
  returning id into small;
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into public.company_event_rsvps (event_id) values (small);
  perform set_config('request.jwt.claims', json_build_object('sub', user_c, 'role', 'authenticated')::text, true);
  begin
    insert into public.company_event_rsvps (event_id) values (small);
    insert into rls_results values ('full events reject more RSVPs', false);
  exception when check_violation then
    insert into rls_results values ('full events reject more RSVPs', true);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  delete from public.company_event_rsvps where event_id = small;
  select going into going_now from public.company_events where id = small;
  insert into rls_results values ('cancelling an RSVP lowers the going count', going_now = 0);
  delete from public.company_event_rsvps where event_id = webinar;
  select count(*) into seen from public.company_event_links where event_id = webinar;
  insert into rls_results values ('the join link disappears after cancelling', seen = 0);

  perform set_config('role', 'postgres', true);
  update public.company_events set starts_at = now() - interval '2 hours', duration_minutes = 60 where id = small;
  perform set_config('role', 'authenticated', true);
  begin
    insert into public.company_event_rsvps (event_id) values (small);
    insert into rls_results values ('ended events reject RSVPs', false);
  exception when check_violation then
    insert into rls_results values ('ended events reject RSVPs', true);
  end;

  perform set_config('role', 'postgres', true);
  delete from private.company_event_rsvp_log;
  perform set_config('role', 'authenticated', true);
  for i in 1..50 loop
    insert into public.company_event_rsvps (event_id) values (open_house);
    delete from public.company_event_rsvps where event_id = open_house;
  end loop;
  begin
    insert into public.company_event_rsvps (event_id) values (open_house);
    insert into rls_results values ('a 51st RSVP in a day is rejected, even after cancelling', false);
  exception when check_violation then
    insert into rls_results values ('a 51st RSVP in a day is rejected, even after cancelling', true);
  end;

  -- Hosting limits.
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'postgres', true);
  select count(*) into seen from private.company_event_log where owner_id = user_a;
  perform set_config('role', 'authenticated', true);
  for i in (seen + 1)..10 loop
    insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, description)
    values (profile_a, 'Daily ' || i, 'online', now() + interval '10 days', 60, 'Filler.');
  end loop;
  begin
    insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, description)
    values (profile_a, 'Daily 11', 'online', now() + interval '10 days', 60, 'Filler.');
    insert into rls_results values ('an 11th event in a day is rejected', false);
  exception when check_violation then
    insert into rls_results values ('an 11th event in a day is rejected', true);
  end;

  select count(*) into seen from public.company_events
  where profile_id = profile_a and starts_at + make_interval(mins => duration_minutes) > now();
  for i in (seen + 1)..20 loop
    perform set_config('role', 'postgres', true);
    delete from private.company_event_log;
    perform set_config('role', 'authenticated', true);
    insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, description)
    values (profile_a, 'Upcoming ' || i, 'online', now() + interval '20 days', 60, 'Filler.');
  end loop;
  perform set_config('role', 'postgres', true);
  delete from private.company_event_log;
  perform set_config('role', 'authenticated', true);
  begin
    insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, description)
    values (profile_a, 'Upcoming 21', 'online', now() + interval '20 days', 60, 'Filler.');
    insert into rls_results values ('a company''s 21st upcoming event is rejected', false);
  exception when check_violation then
    insert into rls_results values ('a company''s 21st upcoming event is rejected', true);
  end;

  -- Text rules.
  perform set_config('role', 'postgres', true);
  delete from private.company_event_log;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  begin
    insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, description)
    values (profile_b, 'Demo', 'online', now() + interval '1 day', 60, 'Notes' || chr(13) || 'URL:https://phish.example/');
    insert into rls_results values ('line breaks that could add calendar fields are rejected', false);
  exception when check_violation then
    insert into rls_results values ('line breaks that could add calendar fields are rejected', true);
  end;
  begin
    insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, description)
    values (profile_b, chr(12644) || chr(12644), 'online', now() + interval '1 day', 60, 'Blank-looking title.');
    insert into rls_results values ('invisible filler characters are rejected in events', false);
  exception when check_violation then
    insert into rls_results values ('invisible filler characters are rejected in events', true);
  end;
  begin
    insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, description)
    values (profile_b, chr(10) || chr(9), 'online', now() + interval '1 day', 60, 'Whitespace title.');
    insert into rls_results values ('whitespace-only titles are rejected', false);
  exception when check_violation then
    insert into rls_results values ('whitespace-only titles are rejected', true);
  end;
  begin
    insert into public.company_updates (profile_id, type, text) values (profile_b, 'project', 'Arabic mark' || chr(1564));
    insert into rls_results values ('direction marks are rejected in updates', false);
  exception when check_violation then
    insert into rls_results values ('direction marks are rejected in updates', true);
  end;
  insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, description)
  values (profile_b, 'Line one', 'online', now() + interval '1 day', 60, 'First line' || chr(10) || 'Second line')
  returning id into attendee;
  insert into rls_results values ('ordinary line breaks in descriptions are allowed', attendee is not null);

  perform set_config('role', 'postgres', true);
  delete from private.company_event_rsvp_log;
  select going into going_now from public.company_events where id = webinar;
  insert into public.company_event_rsvps (event_id, user_id) values (webinar, user_b);
  insert into public.company_event_rsvps (event_id, user_id) values (webinar, user_b) on conflict do nothing;
  insert into rls_results values ('a skipped duplicate RSVP does not change the going count',
    (select going from public.company_events where id = webinar) = going_now + 1);
  delete from public.company_event_rsvps where event_id = webinar and user_id = user_b;
  insert into rls_results values ('join links rely on RSVPs having a single read rule',
    (select count(*) from pg_policies
     where schemaname = 'public' and tablename = 'company_event_rsvps' and cmd in ('SELECT', 'ALL')) = 1);
  perform set_config('role', 'authenticated', true);

  -- Cascades.
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  perform set_config('role', 'postgres', true);
  delete from private.company_event_rsvp_log;
  perform set_config('role', 'authenticated', true);
  insert into public.company_event_rsvps (event_id, profile_id) values (webinar, profile_b);
  perform set_config('request.jwt.claims', json_build_object('sub', user_c, 'role', 'authenticated')::text, true);
  insert into public.company_event_rsvps (event_id) values (open_house);
  perform set_config('role', 'postgres', true);
  delete from public.company_profiles where id = profile_b;
  select going into going_now from public.company_events where id = webinar;
  insert into rls_results values ('deleting the attending company removes its RSVP and the count',
    going_now = 1 and going_now = (select count(*) from public.company_event_rsvps where event_id = webinar)
    and not exists (select 1 from public.company_event_rsvps where profile_id = profile_b));
  delete from auth.users where id = user_c;
  select going into going_now from public.company_events where id = open_house;
  insert into rls_results values ('deleting an account removes its RSVPs and the count', going_now = 0);
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into public.company_event_rsvps (event_id) values (open_house);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  delete from public.company_events where id = open_house;
  get diagnostics affected = row_count;
  perform set_config('role', 'postgres', true);
  insert into rls_results values ('host cancels an event that has RSVPs, and the RSVPs go with it',
    affected = 1 and not exists (select 1 from public.company_event_rsvps where event_id = open_house));
  insert into public.company_event_rsvps (event_id, user_id) values (webinar, user_b);
  delete from public.company_profiles where id = profile_a;
  insert into rls_results values ('events, links, and RSVPs are deleted with the hosting company',
    not exists (select 1 from public.company_events where profile_id = profile_a)
    and not exists (select 1 from public.company_event_links where event_id = webinar)
    and not exists (select 1 from public.company_event_rsvps where event_id = webinar));
end;
$$;

select check_name, case when passed then 'PASS' else 'FAIL' end as result from rls_results;
rollback;
