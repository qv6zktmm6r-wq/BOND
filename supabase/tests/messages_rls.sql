-- Access-rule checks for company conversations, messages, meeting requests, and read times.
-- Runs in a transaction that is always rolled back.
-- Run: supabase db query --linked -f supabase/tests/messages_rls.sql
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-4000-8000-0000000000a7', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'messages-a@example.test'),
  ('00000000-0000-4000-8000-0000000000b7', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'messages-b@example.test'),
  ('00000000-0000-4000-8000-0000000000c7', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'messages-c@example.test');

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

do $$
declare
  user_a constant uuid := '00000000-0000-4000-8000-0000000000a7';
  user_b constant uuid := '00000000-0000-4000-8000-0000000000b7';
  user_c constant uuid := '00000000-0000-4000-8000-0000000000c7';
  profile_a uuid;
  profile_b uuid;
  profile_c uuid;
  conversation_self uuid;
  conversation_company uuid;
  meeting uuid;
  affected integer;
  seen integer;
  stamp timestamptz;
  i integer;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description) values ('Inbox A', 'Energy', 'Receives messages') returning id into profile_a;
  perform set_config('request.jwt.claims', json_build_object('sub', user_c, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description) values ('Outsider C', 'Energy', 'Not in the conversation') returning id into profile_c;
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description) values ('Sender B', 'Logistics', 'Sends messages') returning id into profile_b;

  -- Starting conversations.
  insert into public.company_conversations (profile_id) values (profile_a);
  select id into conversation_self from public.company_conversations where profile_id = profile_a and sender_profile_id is null;
  insert into rls_results values ('member starts a conversation as themselves and sees it', conversation_self is not null);
  insert into public.company_conversations (profile_id) values (profile_a);
  get diagnostics affected = row_count;
  select count(*) into seen from public.company_conversations;
  insert into rls_results values ('starting the same conversation again is skipped', affected = 0 and seen = 1);
  insert into public.company_conversations (profile_id, sender_profile_id) values (profile_a, profile_b);
  select id into conversation_company from public.company_conversations where sender_profile_id = profile_b;
  insert into rls_results values ('member starts a separate conversation as their company', conversation_company is not null);
  insert into rls_results values ('member cannot write as someone else''s company',
    pg_temp.attempt(format('insert into public.company_conversations (profile_id, sender_profile_id) values (%L, %L)', profile_a, profile_c)) = '42501');
  insert into rls_results values ('member cannot start a conversation on someone else''s behalf',
    pg_temp.attempt(format('insert into public.company_conversations (profile_id, user_id) values (%L, %L)', profile_c, user_c)) = '42501');
  insert into rls_results values ('conversation account ids are not readable',
    pg_temp.attempt('select user_id from public.company_conversations') = '42501');

  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  select count(*) into seen from public.company_conversations;
  insert into rls_results values ('the company does not see a conversation before its first message', seen = 0);
  insert into rls_results values ('members cannot message their own company',
    pg_temp.attempt(format('insert into public.company_conversations (profile_id) values (%L)', profile_a)) = '23514');

  -- Messages.
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into public.company_messages (conversation_id, body) values (conversation_self, 'Hello from a member.' || chr(10) || 'Second line.');
  insert into public.company_messages (conversation_id, body) values (conversation_company, 'Hello from Sender B.');
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  select count(*) into seen from public.company_conversations where profile_id = profile_a;
  insert into rls_results values ('the company sees conversations once they have a message', seen = 2);
  insert into rls_results values ('the company sees which company wrote, or none for a member writing as themselves',
    exists (select 1 from public.company_conversations where id = conversation_company and sender_profile_id = profile_b)
    and exists (select 1 from public.company_conversations where id = conversation_self and sender_profile_id is null));
  insert into rls_results values ('the company reads the member''s message, marked as not from the company',
    exists (select 1 from public.company_messages where conversation_id = conversation_self and not from_company and body like 'Hello from a member.%'));
  insert into rls_results values ('the company cannot read the conversation''s account id',
    pg_temp.attempt('select user_id from public.company_conversations') = '42501');
  insert into public.company_messages (conversation_id, body) values (conversation_self, 'Thanks, happy to talk.');
  insert into rls_results values ('the company''s reply is marked as from the company',
    exists (select 1 from public.company_messages where conversation_id = conversation_self and from_company and body = 'Thanks, happy to talk.'));
  insert into rls_results values ('nobody can edit a message''s text',
    pg_temp.attempt(format('update public.company_messages set body = %L where conversation_id = %L', 'Edited', conversation_self)) = '42501');
  insert into rls_results values ('nobody can edit a conversation',
    pg_temp.attempt(format('update public.company_conversations set profile_id = %L where id = %L', profile_c, conversation_self)) = '42501');

  perform set_config('request.jwt.claims', json_build_object('sub', user_c, 'role', 'authenticated')::text, true);
  select count(*) into seen from public.company_conversations;
  insert into rls_results values ('outsiders see no conversations', seen = 0);
  select count(*) into seen from public.company_messages;
  insert into rls_results values ('outsiders see no messages', seen = 0);
  insert into rls_results values ('outsiders cannot write into a conversation',
    pg_temp.attempt(format('insert into public.company_messages (conversation_id, body) values (%L, %L)', conversation_self, 'Intruding')) = '23503');
  insert into rls_results values ('outsiders cannot mark a conversation read',
    pg_temp.attempt(format('insert into public.company_conversation_reads (conversation_id) values (%L)', conversation_self)) = '23503');
  select count(*) into affected from public.company_conversations;
  delete from public.company_conversations where id = conversation_self;
  get diagnostics affected = row_count;
  insert into rls_results values ('outsiders cannot delete a conversation', affected = 0);

  -- Text rules.
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into rls_results values ('hidden characters are rejected in messages',
    pg_temp.attempt(format('insert into public.company_messages (conversation_id, body) values (%L, %L)', conversation_self, 'Call' || chr(8238) || ' me')) = '23514');
  insert into rls_results values ('blank messages are rejected',
    pg_temp.attempt(format('insert into public.company_messages (conversation_id, body) values (%L, %L)', conversation_self, chr(10) || chr(12288))) = '23514');
  insert into rls_results values ('messages over 2,000 characters are rejected',
    pg_temp.attempt(format('insert into public.company_messages (conversation_id, body) values (%L, %L)', conversation_self, repeat('a', 2001))) = '23514');

  -- Meeting requests.
  insert into public.company_messages (conversation_id, kind, body, times) values (conversation_self, 'meeting', 'Site walk', 'Tuesday or Wednesday afternoon')
  returning id into meeting;
  insert into rls_results values ('member requests a meeting, which starts as pending',
    exists (select 1 from public.company_messages where id = meeting and meeting_status = 'pending' and not from_company));
  insert into rls_results values ('a second pending meeting request is rejected',
    pg_temp.attempt(format('insert into public.company_messages (conversation_id, kind, times) values (%L, %L, %L)', conversation_self, 'meeting', 'Friday')) = '23514');
  insert into rls_results values ('meeting requests need preferred times',
    pg_temp.attempt(format('insert into public.company_messages (conversation_id, kind, body) values (%L, %L, %L)', conversation_company, 'meeting', 'Any time')) = '23514');
  insert into rls_results values ('the member cannot accept their own meeting request',
    pg_temp.attempt(format('update public.company_messages set meeting_status = %L where id = %L', 'accepted', meeting)) = '42501');
  perform set_config('request.jwt.claims', json_build_object('sub', user_c, 'role', 'authenticated')::text, true);
  update public.company_messages set meeting_status = 'accepted' where id = meeting;
  get diagnostics affected = row_count;
  insert into rls_results values ('outsiders cannot answer a meeting request', affected = 0);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into rls_results values ('the company cannot request a meeting',
    pg_temp.attempt(format('insert into public.company_messages (conversation_id, kind, times) values (%L, %L, %L)', conversation_company, 'meeting', 'Monday')) = '23514');
  insert into rls_results values ('the company cannot cancel the member''s request',
    pg_temp.attempt(format('update public.company_messages set meeting_status = %L where id = %L', 'cancelled', meeting)) = '42501');
  update public.company_messages set meeting_status = 'accepted' where id = meeting;
  insert into rls_results values ('the company accepts a meeting request',
    exists (select 1 from public.company_messages where id = meeting and meeting_status = 'accepted'));
  insert into rls_results values ('an answered meeting request cannot change again',
    pg_temp.attempt(format('update public.company_messages set meeting_status = %L where id = %L', 'declined', meeting)) = '23514');
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into public.company_messages (conversation_id, kind, times) values (conversation_self, 'meeting', 'Next week') returning id into meeting;
  update public.company_messages set meeting_status = 'cancelled' where id = meeting;
  insert into rls_results values ('the member cancels a pending meeting request',
    exists (select 1 from public.company_messages where id = meeting and meeting_status = 'cancelled'));

  -- Read times.
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.company_messages (conversation_id, body) values (conversation_self, 'See you then.');
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  select read_at into stamp from public.company_conversation_reads where conversation_id = conversation_self;
  insert into rls_results values ('a conversation is marked read for whoever wrote last and unread for the other side',
    stamp is not null and stamp <= (select last_message_at from public.company_conversations where id = conversation_self));
  insert into public.company_conversation_reads (conversation_id) values (conversation_self);
  insert into public.company_conversation_reads (conversation_id) values (conversation_self);
  select count(*) into seen from public.company_conversation_reads where conversation_id = conversation_self;
  insert into rls_results values ('marking a conversation read twice keeps one row', seen = 1);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  select count(*) into seen from public.company_conversation_reads where conversation_id = conversation_self;
  insert into rls_results values ('each side sees only its own read time', seen = 1);
  insert into rls_results values ('read rows do not expose account ids',
    pg_temp.attempt('select user_id from public.company_conversation_reads') = '42501');

  -- Visitors and anonymous sessions.
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  insert into rls_results values ('visitors cannot read conversations', pg_temp.attempt('select count(*) from public.company_conversations') = '42501');
  insert into rls_results values ('visitors cannot read messages', pg_temp.attempt('select count(*) from public.company_messages') = '42501');
  insert into rls_results values ('visitors cannot start conversations',
    pg_temp.attempt(format('insert into public.company_conversations (profile_id) values (%L)', profile_a)) = '42501');
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_c, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  insert into rls_results values ('anonymous sessions cannot start conversations',
    pg_temp.attempt(format('insert into public.company_conversations (profile_id) values (%L)', profile_a)) = '42501');
  insert into rls_results values ('members cannot read the block list', pg_temp.attempt('select count(*) from private.company_conversation_blocks') = '42501');

  -- Daily limits.
  perform set_config('request.jwt.claims', json_build_object('sub', user_c, 'role', 'authenticated')::text, true);
  perform set_config('role', 'postgres', true);
  delete from private.company_conversation_log;
  perform set_config('role', 'authenticated', true);
  for i in 1..20 loop
    insert into public.company_conversations (profile_id) values (profile_b);
    delete from public.company_conversations where profile_id = profile_b;
  end loop;
  insert into rls_results values ('a 21st new conversation in a day is rejected, even after deleting',
    pg_temp.attempt(format('insert into public.company_conversations (profile_id) values (%L)', profile_b)) = '23514');
  insert into rls_results values ('deleting your own conversation does not block you',
    not exists (select 1 from public.company_conversations));
  perform set_config('role', 'postgres', true);
  delete from private.company_conversation_log;
  delete from private.company_message_log;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  for i in 1..200 loop
    insert into public.company_messages (conversation_id, body) values (conversation_company, 'Message ' || i);
  end loop;
  insert into rls_results values ('a 201st message in a day is rejected',
    pg_temp.attempt(format('insert into public.company_messages (conversation_id, body) values (%L, %L)', conversation_company, 'One too many')) = '23514');

  -- Delete and block.
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  delete from public.company_conversations where id = conversation_self;
  get diagnostics affected = row_count;
  insert into rls_results values ('the company deletes a conversation', affected = 1);
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into rls_results values ('the deleted conversation and its messages are gone for the member',
    not exists (select 1 from public.company_conversations where id = conversation_self)
    and not exists (select 1 from public.company_messages where conversation_id = conversation_self));
  insert into rls_results values ('a member the company deleted cannot start a new conversation with it',
    pg_temp.attempt(format('insert into public.company_conversations (profile_id) values (%L)', profile_a)) = '42501');
  insert into rls_results values ('the block does not affect other companies',
    pg_temp.attempt(format('insert into public.company_conversations (profile_id) values (%L)', profile_c)) = 'ok');

  -- Cleanup cascades.
  perform set_config('role', 'postgres', true);
  delete from public.company_profiles where id = profile_b;
  insert into rls_results values ('deleting the writing company deletes its conversations',
    not exists (select 1 from public.company_conversations where id = conversation_company));
  delete from public.company_profiles where id = profile_c;
  insert into rls_results values ('deleting the contacted company deletes its conversations without error',
    not exists (select 1 from public.company_conversations where profile_id = profile_c));
  delete from auth.users where id = user_b;
  insert into rls_results values ('deleting the account deletes its conversations, read times, and blocks',
    not exists (select 1 from public.company_conversations where user_id = user_b)
    and not exists (select 1 from public.company_conversation_reads where user_id = user_b)
    and not exists (select 1 from private.company_conversation_blocks where user_id = user_b));
end;
$$;

select check_name, case when passed then 'PASS' else 'FAIL' end as result from rls_results;
rollback;
