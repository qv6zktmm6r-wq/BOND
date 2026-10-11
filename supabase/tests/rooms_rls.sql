-- Access-rule checks for shared Opportunity Rooms: rooms, invitations, conversation, meetings, and proposals.
-- Runs in a transaction that is always rolled back.
-- Run: supabase db query --linked -f supabase/tests/rooms_rls.sql
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-4000-8000-0000000000a8', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rooms-host@example.test'),
  ('00000000-0000-4000-8000-0000000000b8', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rooms-b@example.test'),
  ('00000000-0000-4000-8000-0000000000c8', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rooms-c@example.test'),
  ('00000000-0000-4000-8000-0000000000d8', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rooms-d@example.test');

create temporary table rls_results (check_name text, passed boolean) on commit drop;
grant all on rls_results to anon, authenticated;

-- Runs a statement and returns 'ok' or the SQLSTATE it failed with.
create function pg_temp.attempt(statement text)
returns text
language plpgsql
as $$
begin
  execute statement;
  return 'ok';
exception when others then
  return sqlstate;
end;
$$;

create function pg_temp.act_as(member uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims', json_build_object('sub', member, 'role', 'authenticated')::text, true);
$$;

do $$
declare
  user_h constant uuid := '00000000-0000-4000-8000-0000000000a8';
  user_b constant uuid := '00000000-0000-4000-8000-0000000000b8';
  user_c constant uuid := '00000000-0000-4000-8000-0000000000c8';
  user_d constant uuid := '00000000-0000-4000-8000-0000000000d8';
  profile_h uuid;
  profile_h2 uuid;
  profile_b uuid;
  profile_c uuid;
  profile_d uuid;
  extras uuid[] := '{}';
  extra uuid;
  room uuid := gen_random_uuid();
  room_full uuid := gen_random_uuid();
  meeting uuid;
  proposal uuid;
  affected integer;
  seen integer;
  i integer;
begin
  perform set_config('role', 'authenticated', true);
  perform pg_temp.act_as(user_h);
  insert into public.company_profiles (name, industry, description) values ('Host Co', 'Technology', 'Opens rooms') returning id into profile_h;
  insert into public.company_profiles (name, industry, description) values ('Host Second', 'Technology', 'Also the host''s') returning id into profile_h2;
  perform pg_temp.act_as(user_b);
  insert into public.company_profiles (name, industry, description) values ('Builder B', 'Construction', 'Invited first') returning id into profile_b;
  perform pg_temp.act_as(user_c);
  insert into public.company_profiles (name, industry, description) values ('Crafter C', 'Manufacturing', 'Invited second') returning id into profile_c;
  for i in 1..4 loop
    insert into public.company_profiles (name, industry, description) values ('Extra C' || i, 'Energy', 'Spare') returning id into extra;
    extras := extras || extra;
  end loop;
  perform pg_temp.act_as(user_d);
  insert into public.company_profiles (name, industry, description) values ('Designer D', 'Engineering', 'Outsider at first') returning id into profile_d;
  for i in 1..3 loop
    insert into public.company_profiles (name, industry, description) values ('Extra D' || i, 'Energy', 'Spare') returning id into extra;
    extras := extras || extra;
  end loop;

  -- Opening a room.
  perform pg_temp.act_as(user_h);
  insert into public.opportunity_rooms (id, host_profile_id, title, brief, needs, city)
  values (room, profile_h, 'Fleet platform', 'A dashboard for 40 trucks.' || chr(10) || 'Phase one.', array['software', 'logistics'], 'Riverside');
  insert into rls_results values ('the host opens a room as their company and sees it', exists (select 1 from public.opportunity_rooms where id = room));
  insert into rls_results values ('opening a room posts an "opened" note',
    exists (select 1 from public.opportunity_room_messages where room_id = room and kind = 'note' and body = 'Host Co opened the room.' and profile_id = profile_h));
  insert into rls_results values ('a room cannot be opened as someone else''s company',
    pg_temp.attempt(format('insert into public.opportunity_rooms (host_profile_id, title) values (%L, %L)', profile_b, 'Not mine')) = '42501');
  insert into rls_results values ('a room cannot be opened for another account',
    pg_temp.attempt(format('insert into public.opportunity_rooms (host_profile_id, title, user_id) values (%L, %L, %L)', profile_h, 'Theirs', user_b)) = '42501');
  insert into rls_results values ('room account ids are not readable', pg_temp.attempt('select user_id from public.opportunity_rooms') = '42501');
  insert into rls_results values ('blank room names are rejected',
    pg_temp.attempt(format('insert into public.opportunity_rooms (host_profile_id, title) values (%L, %L)', profile_h, chr(12288))) = '23514');
  insert into rls_results values ('hidden characters in room text are rejected',
    pg_temp.attempt(format('insert into public.opportunity_rooms (host_profile_id, title, brief) values (%L, %L, %L)', profile_h, 'Room', 'Brief' || chr(8238))) = '23514');
  insert into rls_results values ('unknown project needs are rejected',
    pg_temp.attempt(format('insert into public.opportunity_rooms (host_profile_id, title, needs) values (%L, %L, %L)', profile_h, 'Room', '{farming}')) = '23514');

  -- Invitations.
  insert into public.opportunity_room_members (room_id, profile_id, needs) values (room, profile_b, array['logistics']);
  insert into public.opportunity_room_members (room_id, profile_id) values (room, profile_c);
  insert into public.opportunity_room_members (room_id, profile_id) values (room, profile_c);
  get diagnostics affected = row_count;
  select count(*) into seen from public.opportunity_room_members where room_id = room;
  insert into rls_results values ('the host invites companies; inviting one twice is skipped', affected = 0 and seen = 2);
  insert into rls_results values ('invitations start as invited, whatever the host sends',
    pg_temp.attempt(format('insert into public.opportunity_room_members (room_id, profile_id, status) values (%L, %L, %L)', room, profile_d, 'joined')) = '42501'
    and (select status from public.opportunity_room_members where room_id = room and profile_id = profile_b) = 'invited');
  insert into rls_results values ('the host cannot invite their own company',
    pg_temp.attempt(format('insert into public.opportunity_room_members (room_id, profile_id) values (%L, %L)', room, profile_h2)) = '23514');
  insert into rls_results values ('inviting posts a note',
    exists (select 1 from public.opportunity_room_messages where room_id = room and body = 'Host Co invited Builder B.'));

  perform pg_temp.act_as(user_d);
  insert into rls_results values ('outsiders cannot invite companies to a room',
    pg_temp.attempt(format('insert into public.opportunity_room_members (room_id, profile_id) values (%L, %L)', room, profile_d)) = '42501');
  insert into rls_results values ('outsiders see no rooms, team, conversation, meetings, or proposals',
    not exists (select 1 from public.opportunity_rooms) and not exists (select 1 from public.opportunity_room_members)
    and not exists (select 1 from public.opportunity_room_messages) and not exists (select 1 from public.opportunity_room_meetings)
    and not exists (select 1 from public.opportunity_room_proposals));
  insert into rls_results values ('outsiders cannot post in a room',
    pg_temp.attempt(format('insert into public.opportunity_room_messages (room_id, profile_id, body) values (%L, %L, %L)', room, profile_d, 'Hi')) = '42501');

  perform pg_temp.act_as(user_b);
  insert into rls_results values ('an invited company sees the room''s name, description, needs, and host',
    exists (select 1 from public.opportunity_rooms where id = room and title = 'Fleet platform' and host_profile_id = profile_h and needs = array['software', 'logistics']));
  insert into rls_results values ('an invited company sees only its own invitation, not the team',
    (select count(*) from public.opportunity_room_members) = 1
    and exists (select 1 from public.opportunity_room_members where room_id = room and profile_id = profile_b and needs = array['logistics']));
  insert into rls_results values ('an invited company does not see the conversation or meetings yet',
    not exists (select 1 from public.opportunity_room_messages) and not exists (select 1 from public.opportunity_room_meetings));
  insert into rls_results values ('an invited company cannot post before joining',
    pg_temp.attempt(format('insert into public.opportunity_room_messages (room_id, profile_id, body) values (%L, %L, %L)', room, profile_b, 'Early')) = '42501');
  update public.opportunity_room_members set status = 'joined' where room_id = room and profile_id = profile_b;
  get diagnostics affected = row_count;
  insert into rls_results values ('an invited company accepts and sees the team and conversation',
    affected = 1 and (select count(*) from public.opportunity_room_members where room_id = room) = 2
    and exists (select 1 from public.opportunity_room_messages where room_id = room and body = 'Builder B joined the room.'));
  insert into rls_results values ('an answered invitation cannot be changed',
    pg_temp.attempt(format('update public.opportunity_room_members set status = %L where room_id = %L and profile_id = %L', 'declined', room, profile_b)) = '23514');

  perform pg_temp.act_as(user_h);
  update public.opportunity_room_members set status = 'joined' where room_id = room and profile_id = profile_c;
  get diagnostics affected = row_count;
  insert into rls_results values ('the host cannot accept an invitation for a company',
    affected = 0 and (select status from public.opportunity_room_members where room_id = room and profile_id = profile_c) = 'invited');

  perform pg_temp.act_as(user_c);
  update public.opportunity_room_members set status = 'declined' where room_id = room and profile_id = profile_c;
  insert into rls_results values ('a company that declines no longer sees the room',
    not exists (select 1 from public.opportunity_rooms) and not exists (select 1 from public.opportunity_room_messages));
  insert into rls_results values ('a company that declined cannot post',
    pg_temp.attempt(format('insert into public.opportunity_room_messages (room_id, profile_id, body) values (%L, %L, %L)', room, profile_c, 'Hi')) = '42501');
  perform pg_temp.act_as(user_h);
  insert into rls_results values ('the host sees who declined',
    (select status from public.opportunity_room_members where room_id = room and profile_id = profile_c) = 'declined'
    and exists (select 1 from public.opportunity_room_messages where room_id = room and body = 'Crafter C declined the invitation.'));

  -- Conversation.
  perform pg_temp.act_as(user_b);
  insert into public.opportunity_room_messages (room_id, profile_id, body) values (room, profile_b, 'Happy to help.' || chr(10) || 'When do you start?');
  perform pg_temp.act_as(user_h);
  insert into public.opportunity_room_messages (room_id, profile_id, body) values (room, profile_h, 'Next month.');
  insert into rls_results values ('the host and joined companies read each other''s messages',
    exists (select 1 from public.opportunity_room_messages where room_id = room and profile_id = profile_b and kind = 'message' and body like 'Happy to help.%'));
  perform pg_temp.act_as(user_b);
  insert into rls_results values ('members cannot post as another company',
    pg_temp.attempt(format('insert into public.opportunity_room_messages (room_id, profile_id, body) values (%L, %L, %L)', room, profile_h, 'Pretending')) = '42501');
  insert into rls_results values ('members cannot write notes',
    pg_temp.attempt(format('insert into public.opportunity_room_messages (room_id, profile_id, body, kind) values (%L, %L, %L, %L)', room, profile_b, 'Fake note', 'note')) = '42501');
  insert into rls_results values ('messages cannot be edited or deleted',
    pg_temp.attempt(format('update public.opportunity_room_messages set body = %L where room_id = %L', 'Edited', room)) = '42501'
    and pg_temp.attempt(format('delete from public.opportunity_room_messages where room_id = %L', room)) = '42501');
  insert into rls_results values ('blank and over-long messages are rejected',
    pg_temp.attempt(format('insert into public.opportunity_room_messages (room_id, profile_id, body) values (%L, %L, %L)', room, profile_b, chr(10) || chr(160))) = '23514'
    and pg_temp.attempt(format('insert into public.opportunity_room_messages (room_id, profile_id, body) values (%L, %L, %L)', room, profile_b, repeat('a', 1001))) = '23514');

  -- Needs.
  update public.opportunity_rooms set needs = array['energy'] where id = room;
  get diagnostics affected = row_count;
  insert into rls_results values ('members cannot change the room''s needs', affected = 0);
  insert into rls_results values ('members cannot rename the room',
    pg_temp.attempt(format('update public.opportunity_rooms set title = %L where id = %L', 'Renamed', room)) = '42501');
  perform pg_temp.act_as(user_h);
  update public.opportunity_rooms set needs = array['software', 'logistics', 'energy'] where id = room;
  get diagnostics affected = row_count;
  insert into rls_results values ('the host changes the room''s needs', affected = 1);

  -- Meetings.
  insert into public.opportunity_room_meetings (room_id, topic, starts_at, duration_minutes, link)
  values (room, 'Kickoff', now() + interval '1 day', 45, 'https://meet.example.com/abc') returning id into meeting;
  perform pg_temp.act_as(user_b);
  insert into rls_results values ('joined companies see meetings and their links',
    exists (select 1 from public.opportunity_room_meetings where id = meeting and link = 'https://meet.example.com/abc')
    and exists (select 1 from public.opportunity_room_messages where room_id = room and body = 'Host Co scheduled "Kickoff".'));
  insert into rls_results values ('members cannot schedule meetings',
    pg_temp.attempt(format('insert into public.opportunity_room_meetings (room_id, topic, starts_at, duration_minutes) values (%L, %L, %L, 30)', room, 'Mine', now() + interval '2 days')) = '42501');
  delete from public.opportunity_room_meetings where id = meeting;
  get diagnostics affected = row_count;
  insert into rls_results values ('members cannot cancel meetings', affected = 0);
  perform pg_temp.act_as(user_h);
  insert into rls_results values ('meetings must start in the future and within a year',
    pg_temp.attempt(format('insert into public.opportunity_room_meetings (room_id, topic, starts_at, duration_minutes) values (%L, %L, %L, 30)', room, 'Past', now() - interval '1 minute')) = '23514'
    and pg_temp.attempt(format('insert into public.opportunity_room_meetings (room_id, topic, starts_at, duration_minutes) values (%L, %L, %L, 30)', room, 'Far', now() + interval '367 days')) = '23514');
  insert into rls_results values ('meeting links must be plain https addresses',
    pg_temp.attempt(format('insert into public.opportunity_room_meetings (room_id, topic, starts_at, duration_minutes, link) values (%L, %L, %L, 30, %L)', room, 'Http', now() + interval '1 day', 'http://meet.example.com')) = '23514'
    and pg_temp.attempt(format('insert into public.opportunity_room_meetings (room_id, topic, starts_at, duration_minutes, link) values (%L, %L, %L, 30, %L)', room, 'Creds', now() + interval '1 day', 'https://user:pw@meet.example.com')) = '23514'
    and pg_temp.attempt(format('insert into public.opportunity_room_meetings (room_id, topic, starts_at, duration_minutes, link) values (%L, %L, %L, 30, %L)', room, 'Script', now() + interval '1 day', 'javascript:alert(1)')) = '23514');
  insert into rls_results values ('meeting lengths are limited to the offered choices',
    pg_temp.attempt(format('insert into public.opportunity_room_meetings (room_id, topic, starts_at, duration_minutes) values (%L, %L, %L, 600)', room, 'Long', now() + interval '1 day')) = '23514');
  delete from public.opportunity_room_meetings where id = meeting;
  get diagnostics affected = row_count;
  insert into rls_results values ('the host cancels a meeting and a note says so',
    affected = 1 and exists (select 1 from public.opportunity_room_messages where room_id = room and body = 'Host Co canceled "Kickoff".'));

  -- Proposals.
  insert into public.opportunity_room_members (room_id, profile_id) values (room, profile_d);
  perform pg_temp.act_as(user_d);
  update public.opportunity_room_members set status = 'joined' where room_id = room and profile_id = profile_d;
  perform pg_temp.act_as(user_b);
  insert into public.opportunity_room_proposals (room_id, profile_id, title, price, timeline, summary)
  values (room, profile_b, 'Phase one', '$48,000', '10 weeks', 'Build the dashboard.' || chr(10) || 'Then train drivers.') returning id into proposal;
  insert into rls_results values ('a joined company sends a proposal and sees it as new', (select status from public.opportunity_room_proposals where id = proposal) = 'new');
  insert into rls_results values ('a proposal cannot start shortlisted',
    pg_temp.attempt(format('insert into public.opportunity_room_proposals (room_id, profile_id, title, summary, status) values (%L, %L, %L, %L, %L)', room, profile_b, 'Sneaky', 'Plan', 'shortlisted')) = '42501');
  insert into rls_results values ('a company cannot send a proposal as another company',
    pg_temp.attempt(format('insert into public.opportunity_room_proposals (room_id, profile_id, title, summary) values (%L, %L, %L, %L)', room, profile_d, 'Fake', 'Plan')) = '42501');
  update public.opportunity_room_proposals set status = 'shortlisted' where id = proposal;
  get diagnostics affected = row_count;
  insert into rls_results values ('the sending company cannot shortlist its own proposal', affected = 0);
  perform pg_temp.act_as(user_d);
  insert into rls_results values ('other members cannot see a proposal', not exists (select 1 from public.opportunity_room_proposals));
  perform pg_temp.act_as(user_c);
  insert into rls_results values ('a company that declined cannot send proposals',
    pg_temp.attempt(format('insert into public.opportunity_room_proposals (room_id, profile_id, title, summary) values (%L, %L, %L, %L)', room, profile_c, 'Late', 'Plan')) = '42501');
  perform pg_temp.act_as(user_h);
  update public.opportunity_room_proposals set status = 'shortlisted' where id = proposal;
  get diagnostics affected = row_count;
  insert into rls_results values ('the host reads and shortlists a proposal', affected = 1
    and exists (select 1 from public.opportunity_room_proposals where id = proposal and status = 'shortlisted' and price = '$48,000'));
  insert into rls_results values ('the host cannot edit a proposal''s text',
    pg_temp.attempt(format('update public.opportunity_room_proposals set price = %L where id = %L', '$1', proposal)) = '42501');
  delete from public.opportunity_room_proposals where id = proposal;
  get diagnostics affected = row_count;
  insert into rls_results values ('the host cannot delete a proposal', affected = 0);
  perform pg_temp.act_as(user_b);
  insert into public.opportunity_room_proposals (room_id, profile_id, title, summary) values (room, profile_b, 'Option 2', 'Cheaper.');
  insert into public.opportunity_room_proposals (room_id, profile_id, title, summary) values (room, profile_b, 'Option 3', 'Faster.');
  insert into rls_results values ('a company can send up to 3 proposals per room',
    pg_temp.attempt(format('insert into public.opportunity_room_proposals (room_id, profile_id, title, summary) values (%L, %L, %L, %L)', room, profile_b, 'Option 4', 'More.')) = '23514');
  delete from public.opportunity_room_proposals where id = proposal;
  get diagnostics affected = row_count;
  insert into rls_results values ('the sending company withdraws a proposal', affected = 1);

  -- Anonymous access and private data.
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  insert into rls_results values ('visitors who are not signed in cannot read rooms', pg_temp.attempt('select count(*) from public.opportunity_rooms') = '42501');
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  insert into rls_results values ('anonymous sessions cannot open rooms or post',
    pg_temp.attempt(format('insert into public.opportunity_rooms (host_profile_id, title) values (%L, %L)', profile_b, 'Anon')) = '42501'
    and pg_temp.attempt(format('insert into public.opportunity_room_messages (room_id, profile_id, body) values (%L, %L, %L)', room, profile_b, 'Anon')) = '42501');
  perform pg_temp.act_as(user_b);
  insert into rls_results values ('members cannot read the daily-limit log', pg_temp.attempt('select count(*) from private.opportunity_room_log') = '42501');
  insert into rls_results values ('members cannot call the room helpers directly',
    pg_temp.attempt(format('select private.room_role(%L)', room)) = '42501');

  -- Team changes.
  delete from public.opportunity_room_members where room_id = room and profile_id = profile_b;
  get diagnostics affected = row_count;
  insert into rls_results values ('a member leaves the room and no longer sees it',
    affected = 1 and not exists (select 1 from public.opportunity_rooms) and not exists (select 1 from public.opportunity_room_proposals));
  perform pg_temp.act_as(user_d);
  delete from public.opportunity_rooms where id = room;
  get diagnostics affected = row_count;
  insert into rls_results values ('members cannot close the room', affected = 0);
  perform pg_temp.act_as(user_h);
  insert into rls_results values ('leaving posts a note and withdraws the company''s proposals',
    exists (select 1 from public.opportunity_room_messages where room_id = room and body = 'Builder B left the room.')
    and not exists (select 1 from public.opportunity_room_proposals where profile_id = profile_b));
  delete from public.opportunity_room_members where room_id = room and profile_id = profile_d;
  insert into rls_results values ('the host removes a company and a note says so',
    exists (select 1 from public.opportunity_room_messages where room_id = room and body = 'Designer D was removed from the room.'));

  -- Room size and daily limits.
  insert into public.opportunity_rooms (id, host_profile_id, title) values (room_full, profile_h, 'Big team');
  insert into public.opportunity_room_members (room_id, profile_id) values (room_full, profile_b), (room_full, profile_c), (room_full, profile_d);
  foreach extra in array extras[1:5] loop
    insert into public.opportunity_room_members (room_id, profile_id) values (room_full, extra);
  end loop;
  insert into rls_results values ('a room holds up to 8 invited companies',
    pg_temp.attempt(format('insert into public.opportunity_room_members (room_id, profile_id) values (%L, %L)', room_full, extras[6])) = '23514');
  perform set_config('role', 'postgres', true);
  delete from private.opportunity_room_log;
  perform set_config('role', 'authenticated', true);
  for i in 1..40 loop
    delete from public.opportunity_room_members where room_id = room_full and profile_id = extras[1];
    insert into public.opportunity_room_members (room_id, profile_id) values (room_full, extras[1]);
  end loop;
  delete from public.opportunity_room_members where room_id = room_full and profile_id = extras[1];
  insert into rls_results values ('a 41st invitation in a day is rejected',
    pg_temp.attempt(format('insert into public.opportunity_room_members (room_id, profile_id) values (%L, %L)', room_full, extras[1])) = '23514');
  for i in 1..300 loop
    insert into public.opportunity_room_messages (room_id, profile_id, body) values (room_full, profile_h, 'Message ' || i);
  end loop;
  insert into rls_results values ('a 301st room message in a day is rejected',
    pg_temp.attempt(format('insert into public.opportunity_room_messages (room_id, profile_id, body) values (%L, %L, %L)', room_full, profile_h, 'One more')) = '23514');
  for i in 1..20 loop
    insert into public.opportunity_room_meetings (room_id, topic, starts_at, duration_minutes) values (room_full, 'Meeting ' || i, now() + interval '1 day', 30);
  end loop;
  insert into rls_results values ('a room holds up to 20 meetings',
    pg_temp.attempt(format('insert into public.opportunity_room_meetings (room_id, topic, starts_at, duration_minutes) values (%L, %L, %L, 30)', room_full, 'One more', now() + interval '1 day')) = '23514');
  perform set_config('role', 'postgres', true);
  delete from private.opportunity_room_log;
  perform set_config('role', 'authenticated', true);
  for i in 1..10 loop
    insert into public.opportunity_rooms (host_profile_id, title) values (profile_h, 'Room ' || i);
  end loop;
  insert into rls_results values ('an 11th new room in a day is rejected',
    pg_temp.attempt(format('insert into public.opportunity_rooms (host_profile_id, title) values (%L, %L)', profile_h, 'Room 11')) = '23514');
  perform set_config('role', 'postgres', true);
  delete from private.opportunity_room_log;
  perform set_config('role', 'authenticated', true);
  for i in 1..8 loop
    insert into public.opportunity_rooms (host_profile_id, title) values (profile_h, 'More ' || i);
  end loop;
  insert into rls_results values ('the host has 20 open rooms before the limit check', (select count(*) from public.opportunity_rooms) = 20);
  perform set_config('role', 'postgres', true);
  delete from private.opportunity_room_log;
  perform set_config('role', 'authenticated', true);
  insert into rls_results values ('a 21st open room is rejected',
    pg_temp.attempt(format('insert into public.opportunity_rooms (host_profile_id, title) values (%L, %L)', profile_h, 'Room 21')) = '23514');
  perform pg_temp.act_as(user_b);
  update public.opportunity_room_members set status = 'joined' where room_id = room_full and profile_id = profile_b;
  for i in 1..20 loop
    insert into public.opportunity_room_proposals (room_id, profile_id, title, summary) values (room_full, profile_b, 'Bid ' || i, 'Plan');
    delete from public.opportunity_room_proposals where room_id = room_full and profile_id = profile_b;
  end loop;
  insert into rls_results values ('a 21st proposal in a day is rejected, even after withdrawing',
    pg_temp.attempt(format('insert into public.opportunity_room_proposals (room_id, profile_id, title, summary) values (%L, %L, %L, %L)', room_full, profile_b, 'Bid 21', 'Plan')) = '23514');

  -- Closing and cascades.
  perform pg_temp.act_as(user_h);
  delete from public.opportunity_rooms where id = room;
  get diagnostics affected = row_count;
  insert into rls_results values ('the host closes a room and everything in it is deleted',
    affected = 1 and not exists (select 1 from public.opportunity_room_members where room_id = room)
    and not exists (select 1 from public.opportunity_room_messages where room_id = room)
    and not exists (select 1 from public.opportunity_room_meetings where room_id = room));
  perform pg_temp.act_as(user_b);
  insert into public.opportunity_room_messages (room_id, profile_id, body) values (room_full, profile_b, 'Before deleting B');
  perform set_config('role', 'postgres', true);
  delete from public.company_profiles where id = profile_b;
  insert into rls_results values ('deleting a member company removes it from rooms and keeps its messages without an author',
    not exists (select 1 from public.opportunity_room_members where profile_id = profile_b)
    and exists (select 1 from public.opportunity_room_messages where room_id = room_full and body = 'Before deleting B' and profile_id is null));
  delete from auth.users where id = user_h;
  insert into rls_results values ('deleting the host''s account deletes their rooms and limit log',
    not exists (select 1 from public.opportunity_rooms where host_profile_id in (profile_h, profile_h2))
    and not exists (select 1 from public.opportunity_room_messages where room_id = room_full)
    and not exists (select 1 from private.opportunity_room_log where user_id = user_h));
end;
$$;

select check_name, case when passed then 'PASS' else 'FAIL' end as result from rls_results;
rollback;
