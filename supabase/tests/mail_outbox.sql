-- Notification queue. Runs in a transaction that is always rolled back.
-- Run: supabase db query --linked -f supabase/tests/mail_outbox.sql
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mail-a@example.test'),
  ('00000000-0000-4000-8000-0000000000d2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mail-b@example.test');

create temporary table rls_results (check_name text, passed boolean) on commit drop;
grant all on rls_results to anon, authenticated;

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
  user_a constant uuid := '00000000-0000-4000-8000-0000000000d1';
  user_b constant uuid := '00000000-0000-4000-8000-0000000000d2';
  profile_a uuid;
  profile_b uuid;
  conversation uuid;
  queued integer;
  queued_preview text;
  starts timestamptz := pg_catalog.now() + interval '1 day';
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description) values ('Inbox Co', 'Energy', 'Receives mail') returning id into profile_a;
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description) values ('Sender Co', 'Logistics', 'Sends mail') returning id into profile_b;
  insert into public.company_conversations (profile_id, sender_profile_id) values (profile_a, profile_b) returning id into conversation;
  insert into public.company_messages (conversation_id, body) values (conversation, 'Secret offer details that must stay out of email.');
  insert into public.company_messages (conversation_id, body) values (conversation, 'A second secret line.');

  perform set_config('role', 'postgres', true);
  select count(*), max(mail.preview) into queued, queued_preview
  from private.mail_outbox as mail
  where mail.recipient_id = user_a and mail.kind = 'message';
  insert into rls_results values ('a message queues one note while a second is still waiting', queued = 1);
  insert into rls_results values ('the email does not contain the message', queued_preview not like '%Secret%' and queued_preview like '%Sender Co%');

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into public.company_follows (profile_id) values (profile_a);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.company_updates (profile_id, type, text) values (profile_a, 'project', 'Private update wording');
  insert into public.company_updates (profile_id, type, text) values (profile_a, 'project', 'Another private update');
  insert into public.company_events (profile_id, title, format, starts_at, duration_minutes, description)
  values (profile_a, 'Open house', 'online', starts, 60, 'A public event description');

  perform set_config('role', 'postgres', true);
  insert into rls_results values ('a follower gets one update note per company per day',
    (select count(*) = 1 from private.mail_outbox where recipient_id = user_b and kind = 'update'));
  insert into rls_results values ('the update email does not contain the update',
    not exists (select 1 from private.mail_outbox as mail where mail.preview like '%Private update%'));
  insert into rls_results values ('the host gets a reminder for a future event',
    exists (
      select 1 from private.mail_outbox
      where recipient_id = user_a and kind = 'reminder' and send_after > pg_catalog.now() + interval '12 hours'
    ));
  insert into rls_results values ('a wrong dispatch secret claims nothing',
    (select count(*) = 0 from public.claim_due_mail('not-the-secret')));
  insert into rls_results values ('a wrong secret does not mark mail as sending',
    not exists (select 1 from private.mail_outbox where status <> 'pending'));

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  insert into rls_results values ('visitors cannot read the mail queue',
    pg_temp.attempt('select preview from private.mail_outbox') = '42501');
  insert into rls_results values ('visitors cannot claim mail',
    pg_temp.attempt($q$select * from public.claim_due_mail('not-the-secret')$q$) = '42501');
end;
$$;

select check_name, case when passed then 'PASS' else 'FAIL' end as result from rls_results;
rollback;
