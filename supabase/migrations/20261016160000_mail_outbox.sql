-- Notification mail. The queue is private: visitors cannot read it, and the messages never include
-- a conversation, proposal, contact, or join link. Pending rows with the same key collapse into one
-- email. Each account gets at most 8 a day, and the project at most 40, so notification mail stays
-- inside the sender's daily allowance.

create table private.mail_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in (
    'message', 'meeting', 'response', 'update', 'invite', 'room', 'proposal', 'reminder'
  )),
  subject text not null check (char_length(subject) <= 120),
  preview text not null check (char_length(preview) <= 240),
  href text not null check (href ~ '^https://joinbond\.world/[a-z0-9.?=&-]+$' and char_length(href) <= 200),
  coalesce_key text not null check (char_length(coalesce_key) <= 160),
  send_after timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'skipped')),
  attempts integer not null default 0 check (attempts >= 0),
  claimed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index mail_outbox_one_pending on private.mail_outbox (coalesce_key) where status = 'pending';
create index mail_outbox_due_idx on private.mail_outbox (send_after) where status = 'pending';

revoke all on private.mail_outbox from public, anon, authenticated;

create function private.profile_owner(profile uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select owner_id from public.company_profile_owners where profile_id = profile
$$;

revoke all on function private.profile_owner(uuid) from public, anon, authenticated;

create function private.enqueue_mail(
  recipient uuid,
  mail_kind text,
  mail_subject text,
  mail_preview text,
  mail_href text,
  mail_key text,
  deliver_after timestamptz,
  allow_self boolean,
  once_only boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if recipient is null or mail_key is null or mail_subject is null or mail_preview is null or mail_href is null then
    return;
  end if;
  if not allow_self and recipient is not distinct from (select auth.uid()) then
    return;
  end if;
  if exists (
    select 1 from private.mail_outbox
    where coalesce_key = mail_key and (status = 'pending' or once_only)
  ) then
    return;
  end if;
  if (
    select count(*) from private.mail_outbox
    where recipient_id = recipient and created_at > pg_catalog.now() - interval '1 day'
  ) >= 8 then
    return;
  end if;
  if (
    select count(*) from private.mail_outbox
    where created_at > pg_catalog.now() - interval '1 day'
  ) >= 40 then
    return;
  end if;
  insert into private.mail_outbox (recipient_id, kind, subject, preview, href, coalesce_key, send_after)
  values (
    recipient,
    mail_kind,
    pg_catalog.left(mail_subject, 120),
    pg_catalog.left(mail_preview, 240),
    mail_href,
    mail_key,
    coalesce(deliver_after, pg_catalog.now())
  );
exception when unique_violation or check_violation then
  return;
end;
$$;

revoke all on function private.enqueue_mail(uuid, text, text, text, text, text, timestamptz, boolean, boolean) from public, anon, authenticated;

create function private.notify_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  conversation record;
  recipient uuid;
  speaker text;
begin
  select * into conversation from public.company_conversations where id = new.conversation_id;
  if conversation.id is null then
    return null;
  end if;
  if new.from_company then
    recipient := conversation.user_id;
    speaker := coalesce(private.profile_name(conversation.profile_id), 'A company');
  else
    recipient := private.profile_owner(conversation.profile_id);
    speaker := coalesce(private.profile_name(conversation.sender_profile_id), 'A BOND member');
  end if;
  if new.kind = 'meeting' then
    perform private.enqueue_mail(
      recipient, 'meeting', 'Meeting request on BOND',
      speaker || ' requested a meeting on BOND.',
      'https://joinbond.world/dashboard.html',
      'meeting:' || conversation.id::text || ':' || recipient::text,
      pg_catalog.now(), false, false
    );
  else
    perform private.enqueue_mail(
      recipient, 'message', 'New message on BOND',
      speaker || ' sent you a message on BOND.',
      'https://joinbond.world/dashboard.html',
      'message:' || conversation.id::text || ':' || recipient::text,
      pg_catalog.now(), false, false
    );
  end if;
  return null;
end;
$$;

create trigger company_messages_notify
after insert on public.company_messages
for each row execute function private.notify_message();

create function private.notify_meeting_answer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  conversation record;
  recipient uuid;
begin
  if new.meeting_status is not distinct from old.meeting_status
    or new.meeting_status not in ('accepted', 'declined') then
    return null;
  end if;
  select * into conversation from public.company_conversations where id = new.conversation_id;
  if (select auth.uid()) is not distinct from conversation.user_id then
    recipient := private.profile_owner(conversation.profile_id);
  else
    recipient := conversation.user_id;
  end if;
  perform private.enqueue_mail(
    recipient, 'meeting', 'Meeting update on BOND',
    'A meeting request on BOND was ' || new.meeting_status || '.',
    'https://joinbond.world/dashboard.html',
    'meeting-answer:' || new.id::text,
    pg_catalog.now(), false, true
  );
  return null;
end;
$$;

create trigger company_messages_notify_answer
after update of meeting_status on public.company_messages
for each row execute function private.notify_meeting_answer();

create function private.notify_response()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  poster uuid;
begin
  select private.profile_owner(opportunity.profile_id) into poster
  from public.opportunities as opportunity
  where opportunity.id = new.opportunity_id;
  perform private.enqueue_mail(
    poster, 'response', 'New response on BOND',
    'A company responded to your opportunity on BOND.',
    'https://joinbond.world/dashboard.html',
    'response:' || new.opportunity_id::text || ':' || poster::text,
    pg_catalog.now(), false, false
  );
  return null;
end;
$$;

create trigger opportunity_responses_notify
after insert on public.opportunity_responses
for each row execute function private.notify_response();

create function private.notify_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  follower uuid;
  company text := coalesce(private.profile_name(new.profile_id), 'A company you follow');
begin
  for follower in
    select follow.user_id from public.company_follows as follow where follow.profile_id = new.profile_id
  loop
    perform private.enqueue_mail(
      follower, 'update', 'Update on BOND',
      company || ' shared an update on BOND.',
      'https://joinbond.world/dashboard.html',
      'update:' || new.profile_id::text || ':' || follower::text || ':' || to_char(pg_catalog.now(), 'YYYY-MM-DD'),
      pg_catalog.now(), false, true
    );
  end loop;
  return null;
end;
$$;

create trigger company_updates_notify
after insert on public.company_updates
for each row execute function private.notify_update();

create function private.notify_room_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'invited' then
    return null;
  end if;
  perform private.enqueue_mail(
    private.profile_owner(new.profile_id), 'invite', 'Opportunity Room invitation',
    'Your company was invited to an Opportunity Room on BOND.',
    'https://joinbond.world/room.html?id=' || new.room_id::text,
    'invite:' || new.room_id::text || ':' || new.profile_id::text,
    pg_catalog.now(), false, true
  );
  return null;
end;
$$;

create trigger opportunity_room_members_notify
after insert on public.opportunity_room_members
for each row execute function private.notify_room_invite();

create function private.notify_room_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  room record;
  recipient uuid;
  sender uuid := private.profile_owner(new.profile_id);
begin
  if new.kind <> 'message' then
    return null;
  end if;
  select * into room from public.opportunity_rooms where id = new.room_id;
  for recipient in
    select private.profile_owner(room.host_profile_id)
    union
    select private.profile_owner(member.profile_id)
    from public.opportunity_room_members as member
    where member.room_id = new.room_id and member.status = 'joined'
  loop
    if recipient is not distinct from sender then
      continue;
    end if;
    perform private.enqueue_mail(
      recipient, 'room', 'Opportunity Room message',
      'There is a new message in your Opportunity Room.',
      'https://joinbond.world/room.html?id=' || new.room_id::text,
      'room:' || new.room_id::text || ':' || recipient::text || ':' || to_char(pg_catalog.now(), 'YYYY-MM-DD'),
      pg_catalog.now(), false, true
    );
  end loop;
  return null;
end;
$$;

create trigger opportunity_room_messages_notify
after insert on public.opportunity_room_messages
for each row execute function private.notify_room_message();

create function private.notify_proposal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  host uuid;
begin
  select private.profile_owner(room.host_profile_id) into host
  from public.opportunity_rooms as room
  where room.id = new.room_id;
  perform private.enqueue_mail(
    host, 'proposal', 'New proposal on BOND',
    'A company sent a proposal to your Opportunity Room.',
    'https://joinbond.world/room.html?id=' || new.room_id::text,
    'proposal:' || new.room_id::text || ':' || host::text || ':' || to_char(pg_catalog.now(), 'YYYY-MM-DD'),
    pg_catalog.now(), false, true
  );
  return null;
end;
$$;

create trigger opportunity_room_proposals_notify
after insert on public.opportunity_room_proposals
for each row execute function private.notify_proposal();

create function private.enqueue_reminder(recipient uuid, mail_key text, deliver_after timestamptz, mail_preview text, mail_href text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if deliver_after is null then
    return;
  end if;
  perform private.enqueue_mail(
    recipient, 'reminder', 'Coming up on BOND', mail_preview, mail_href, mail_key, deliver_after, true, true
  );
end;
$$;

revoke all on function private.enqueue_reminder(uuid, text, timestamptz, text, text) from public, anon, authenticated;

create function private.notify_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.starts_at <= pg_catalog.now() then
    return null;
  end if;
  perform private.enqueue_reminder(
    private.profile_owner(new.profile_id),
    'event:' || new.id::text || ':' || private.profile_owner(new.profile_id)::text,
    greatest(pg_catalog.now(), new.starts_at - interval '2 hours'),
    'Your BOND event starts soon. Open BOND for the details.',
    'https://joinbond.world/dashboard.html'
  );
  return null;
end;
$$;

create trigger company_events_notify
after insert on public.company_events
for each row execute function private.notify_event();

create function private.notify_rsvp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  starts timestamptz;
begin
  select event.starts_at into starts from public.company_events as event where event.id = new.event_id;
  if starts is null or starts <= pg_catalog.now() then
    return null;
  end if;
  perform private.enqueue_reminder(
    new.user_id,
    'event:' || new.event_id::text || ':' || new.user_id::text,
    greatest(pg_catalog.now(), starts - interval '2 hours'),
    'An event you are attending on BOND starts soon.',
    'https://joinbond.world/dashboard.html'
  );
  return null;
end;
$$;

create trigger company_event_rsvps_notify
after insert on public.company_event_rsvps
for each row execute function private.notify_rsvp();

create function private.notify_room_meeting()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  room record;
  recipient uuid;
begin
  if new.starts_at <= pg_catalog.now() then
    return null;
  end if;
  select * into room from public.opportunity_rooms where id = new.room_id;
  for recipient in
    select private.profile_owner(room.host_profile_id)
    union
    select private.profile_owner(member.profile_id)
    from public.opportunity_room_members as member
    where member.room_id = new.room_id and member.status = 'joined'
  loop
    perform private.enqueue_reminder(
      recipient,
      'room-meeting:' || new.id::text || ':' || recipient::text,
      greatest(pg_catalog.now(), new.starts_at - interval '2 hours'),
      'A meeting in your Opportunity Room is coming up. Open the room for the details.',
      'https://joinbond.world/room.html?id=' || new.room_id::text
    );
  end loop;
  return null;
end;
$$;

create trigger opportunity_room_meetings_notify
after insert on public.opportunity_room_meetings
for each row execute function private.notify_room_meeting();

revoke all on function private.notify_message() from public, anon, authenticated;
revoke all on function private.notify_meeting_answer() from public, anon, authenticated;
revoke all on function private.notify_response() from public, anon, authenticated;
revoke all on function private.notify_update() from public, anon, authenticated;
revoke all on function private.notify_room_invite() from public, anon, authenticated;
revoke all on function private.notify_room_message() from public, anon, authenticated;
revoke all on function private.notify_proposal() from public, anon, authenticated;
revoke all on function private.notify_event() from public, anon, authenticated;
revoke all on function private.notify_rsvp() from public, anon, authenticated;
revoke all on function private.notify_room_meeting() from public, anon, authenticated;

create function public.claim_due_mail(dispatch_secret text)
returns table (id uuid, recipient_email text, subject text, preview text, href text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected text;
begin
  select decrypted_secret into expected
  from vault.decrypted_secrets
  where name = 'bond_mail_dispatch'
  limit 1;
  if expected is null or dispatch_secret is distinct from expected then
    return;
  end if;
  update private.mail_outbox as mail
  set status = 'pending', claimed_at = null
  where mail.status = 'sending'
    and mail.claimed_at < pg_catalog.now() - interval '15 minutes'
    and mail.attempts < 3;
  update private.mail_outbox as mail
  set status = 'skipped'
  where mail.status = 'sending'
    and mail.claimed_at < pg_catalog.now() - interval '15 minutes'
    and mail.attempts >= 3;
  return query
  with claimed as (
    update private.mail_outbox as mail
    set status = 'sending', claimed_at = pg_catalog.now(), attempts = mail.attempts + 1
    where mail.id in (
      select due.id
      from private.mail_outbox as due
      join auth.users as users on users.id = due.recipient_id
      where due.status = 'pending'
        and due.send_after <= pg_catalog.now()
        and users.email is not null
        and users.email <> ''
      order by due.send_after
      limit 8
    )
    returning mail.id, mail.recipient_id, mail.subject, mail.preview, mail.href
  )
  select claimed.id, users.email::text, claimed.subject, claimed.preview, claimed.href
  from claimed
  join auth.users as users on users.id = claimed.recipient_id;
end;
$$;

create function public.complete_mail(dispatch_secret text, mail_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected text;
  updated integer;
begin
  select decrypted_secret into expected from vault.decrypted_secrets where name = 'bond_mail_dispatch' limit 1;
  if expected is null or dispatch_secret is distinct from expected or mail_ids is null then
    return 0;
  end if;
  update private.mail_outbox
  set status = 'sent', sent_at = pg_catalog.now()
  where id = any(mail_ids) and status = 'sending';
  get diagnostics updated = row_count;
  return updated;
end;
$$;

create function public.release_mail(dispatch_secret text, mail_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected text;
  updated integer;
begin
  select decrypted_secret into expected from vault.decrypted_secrets where name = 'bond_mail_dispatch' limit 1;
  if expected is null or dispatch_secret is distinct from expected or mail_ids is null then
    return 0;
  end if;
  update private.mail_outbox
  set status = case when attempts >= 3 then 'skipped' else 'pending' end,
      claimed_at = null
  where id = any(mail_ids) and status = 'sending';
  get diagnostics updated = row_count;
  return updated;
end;
$$;

revoke all on function public.claim_due_mail(text) from public, anon, authenticated;
revoke all on function public.complete_mail(text, uuid[]) from public, anon, authenticated;
revoke all on function public.release_mail(text, uuid[]) from public, anon, authenticated;
grant execute on function public.claim_due_mail(text) to service_role;
grant execute on function public.complete_mail(text, uuid[]) to service_role;
grant execute on function public.release_mail(text, uuid[]) to service_role;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'bond-mail-dispatch') then
    perform cron.unschedule('bond-mail-dispatch');
  end if;
  perform cron.schedule(
    'bond-mail-dispatch',
    '* * * * *',
    $job$
    select net.http_post(
      url := 'https://mdifopcbcvyzfoflnoxz.supabase.co/functions/v1/dispatch-mail',
      body := '{}'::jsonb,
      params := '{}'::jsonb,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'bond_mail_dispatch' limit 1), '')
      ),
      timeout_milliseconds := 5000
    );
    $job$
  );
end;
$$;
