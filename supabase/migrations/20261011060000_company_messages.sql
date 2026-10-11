-- Private conversations between a signed-in member and a published company, with meeting requests.
-- A member writes as themselves or as one of their published companies; the company sees that
-- company's name or "A BOND member", never an account id or email. Only the member and the
-- company's owner can read a conversation, and the company sees it only once it has a message.
-- Each side keeps its own last-read time, which the other side can't see. Deleting a conversation
-- removes it for both sides; when the company deletes it, that member can't start another one with
-- the company. Limits: 20 new conversations and 200 messages a day per account, 2,000 characters
-- per message, and one pending meeting request per conversation.

create table public.company_conversations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.company_profiles (id) on delete cascade,
  sender_profile_id uuid references public.company_profiles (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  constraint company_conversations_not_self check (sender_profile_id is distinct from profile_id)
);

create unique index company_conversations_one_per_identity
  on public.company_conversations (user_id, profile_id, sender_profile_id) nulls not distinct;
create index company_conversations_profile_idx on public.company_conversations (profile_id, last_message_at desc);
create index company_conversations_sender_idx on public.company_conversations (sender_profile_id);

create table public.company_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.company_conversations (id) on delete cascade,
  from_company boolean not null default false,
  kind text not null default 'message' check (kind in ('message', 'meeting')),
  body text not null default '' check (char_length(body) <= 2000),
  times text not null default '' check (char_length(times) <= 200),
  meeting_status text check (meeting_status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint company_messages_text_plain check (
    private.text_is_plain(body, true) and private.text_is_plain(times, false)
    and case when kind = 'message' then private.text_has_content(body) and times = '' and meeting_status is null
      else private.text_has_content(times) and meeting_status is not null end
  )
);

create index company_messages_conversation_idx on public.company_messages (conversation_id, created_at);
create unique index company_messages_one_pending_meeting
  on public.company_messages (conversation_id) where meeting_status = 'pending';

create table public.company_conversation_reads (
  conversation_id uuid not null references public.company_conversations (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index company_conversation_reads_user_idx on public.company_conversation_reads (user_id);

create table private.company_conversation_blocks (
  profile_id uuid not null references public.company_profiles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, user_id)
);

create index company_conversation_blocks_user_idx on private.company_conversation_blocks (user_id);

create table private.company_conversation_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index company_conversation_log_user_idx on private.company_conversation_log (user_id, created_at desc);

create table private.company_message_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index company_message_log_user_idx on private.company_message_log (user_id, created_at desc);

create function private.owns_profile(profile uuid, member uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = profile and owner.owner_id = member
  )
$$;

revoke all on function private.owns_profile(uuid, uuid) from public, anon, authenticated;

create function private.company_conversations_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or new.user_id is distinct from (select auth.uid()) then
    raise exception 'Sign in to send messages.' using errcode = 'insufficient_privilege';
  end if;
  if private.owns_profile(new.profile_id, new.user_id) then
    raise exception 'You can''t message your own company.' using errcode = 'check_violation';
  end if;
  if new.sender_profile_id is not null and not private.owns_profile(new.sender_profile_id, new.user_id) then
    raise exception 'You can only write as one of your own companies.' using errcode = 'insufficient_privilege';
  end if;
  if exists (
    select 1 from private.company_conversation_blocks as block
    where block.profile_id = new.profile_id and block.user_id = new.user_id
  ) then
    raise exception 'This company isn''t accepting messages from you.' using errcode = 'insufficient_privilege';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('conversations:' || new.user_id::text, 0));
  if exists (
    select 1 from public.company_conversations as conversation
    where conversation.user_id = new.user_id and conversation.profile_id = new.profile_id
      and conversation.sender_profile_id is not distinct from new.sender_profile_id
  ) then
    return null;
  end if;
  delete from private.company_conversation_log where user_id = new.user_id and created_at < pg_catalog.now() - interval '2 days';
  if (select count(*) from private.company_conversation_log
      where user_id = new.user_id and created_at > pg_catalog.now() - interval '1 day') >= 20 then
    raise exception 'You can start up to 20 conversations a day.' using errcode = 'check_violation';
  end if;
  insert into private.company_conversation_log (user_id) values (new.user_id);
  new.created_at := pg_catalog.now();
  new.last_message_at := null;
  return new;
end;
$$;

create trigger company_conversations_guard
before insert on public.company_conversations
for each row execute function private.company_conversations_guard();

create function private.company_conversations_block()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.owns_profile(old.profile_id, (select auth.uid()))
    and exists (select 1 from public.company_profiles where id = old.profile_id)
    and exists (select 1 from auth.users where id = old.user_id) then
    insert into private.company_conversation_blocks (profile_id, user_id)
    values (old.profile_id, old.user_id)
    on conflict do nothing;
  end if;
  return null;
end;
$$;

create trigger company_conversations_block
after delete on public.company_conversations
for each row execute function private.company_conversations_block();

create function private.company_messages_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  conversation record;
begin
  select c.profile_id, c.user_id into conversation
  from public.company_conversations as c where c.id = new.conversation_id;
  if not found or caller is null then
    raise exception 'This conversation no longer exists.' using errcode = 'foreign_key_violation';
  end if;
  if private.owns_profile(conversation.profile_id, caller) then
    new.from_company := true;
  elsif conversation.user_id = caller then
    new.from_company := false;
  else
    raise exception 'This conversation no longer exists.' using errcode = 'foreign_key_violation';
  end if;
  if new.kind = 'meeting' then
    if new.from_company then
      raise exception 'Only the member who started the conversation can request a meeting.' using errcode = 'check_violation';
    end if;
    if exists (
      select 1 from public.company_messages as message
      where message.conversation_id = new.conversation_id and message.meeting_status = 'pending'
    ) then
      raise exception 'This conversation already has a meeting request waiting for an answer.' using errcode = 'check_violation';
    end if;
    new.meeting_status := 'pending';
  else
    new.meeting_status := null;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('messages:' || caller::text, 0));
  delete from private.company_message_log where user_id = caller and created_at < pg_catalog.now() - interval '2 days';
  if (select count(*) from private.company_message_log
      where user_id = caller and created_at > pg_catalog.now() - interval '1 day') >= 200 then
    raise exception 'You can send up to 200 messages a day.' using errcode = 'check_violation';
  end if;
  insert into private.company_message_log (user_id) values (caller);
  new.created_at := pg_catalog.now();
  return new;
end;
$$;

create trigger company_messages_guard
before insert on public.company_messages
for each row execute function private.company_messages_guard();

create function private.company_messages_status_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  conversation record;
begin
  if new.meeting_status is not distinct from old.meeting_status then
    return new;
  end if;
  if old.kind <> 'meeting' or old.meeting_status <> 'pending' then
    raise exception 'This meeting request was already answered.' using errcode = 'check_violation';
  end if;
  select c.profile_id, c.user_id into conversation
  from public.company_conversations as c where c.id = old.conversation_id;
  if caller is not null and private.owns_profile(conversation.profile_id, caller) and new.meeting_status in ('accepted', 'declined') then
    return new;
  end if;
  if caller is not null and conversation.user_id = caller and new.meeting_status = 'cancelled' then
    return new;
  end if;
  raise exception 'You can''t change this meeting request.' using errcode = 'insufficient_privilege';
end;
$$;

create trigger company_messages_status_guard
before update on public.company_messages
for each row execute function private.company_messages_status_guard();

-- Moves the conversation to the top for both sides and marks it read for whoever acted.
create function private.company_messages_touch()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if tg_op = 'UPDATE' and new.meeting_status is not distinct from old.meeting_status then
    return null;
  end if;
  update public.company_conversations set last_message_at = pg_catalog.now() where id = new.conversation_id;
  if caller is not null then
    insert into public.company_conversation_reads (conversation_id, user_id, read_at)
    values (new.conversation_id, caller, pg_catalog.now())
    on conflict (conversation_id, user_id) do update set read_at = excluded.read_at;
  end if;
  return null;
end;
$$;

create trigger company_messages_touch
after insert or update on public.company_messages
for each row execute function private.company_messages_touch();

create function private.company_conversation_reads_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if pg_catalog.pg_trigger_depth() > 1 then
    return new;
  end if;
  if (select auth.uid()) is null or new.user_id is distinct from (select auth.uid()) then
    raise exception 'Sign in to read messages.' using errcode = 'insufficient_privilege';
  end if;
  if not exists (
    select 1 from public.company_conversations as conversation
    where conversation.id = new.conversation_id
      and (conversation.user_id = new.user_id or private.owns_profile(conversation.profile_id, new.user_id))
  ) then
    raise exception 'This conversation no longer exists.' using errcode = 'foreign_key_violation';
  end if;
  update public.company_conversation_reads set read_at = pg_catalog.now()
  where conversation_id = new.conversation_id and user_id = new.user_id;
  if found then
    return null;
  end if;
  new.read_at := pg_catalog.now();
  return new;
end;
$$;

create trigger company_conversation_reads_guard
before insert on public.company_conversation_reads
for each row execute function private.company_conversation_reads_guard();

alter table public.company_conversations enable row level security;
alter table public.company_messages enable row level security;
alter table public.company_conversation_reads enable row level security;

create policy "Members and the company see their conversations"
on public.company_conversations for select
to authenticated
using (
  user_id = (select auth.uid())
  or (last_message_at is not null and exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = company_conversations.profile_id and owner.owner_id = (select auth.uid())
  ))
);

create policy "Members start conversations with companies"
on public.company_conversations for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

create policy "Either side deletes a conversation"
on public.company_conversations for delete
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = company_conversations.profile_id and owner.owner_id = (select auth.uid())
  )
);

create policy "Both sides read a conversation's messages"
on public.company_messages for select
to authenticated
using (exists (
  select 1 from public.company_conversations as conversation where conversation.id = company_messages.conversation_id
));

create policy "Both sides write in a conversation"
on public.company_messages for insert
to authenticated
with check (
  exists (select 1 from public.company_conversations as conversation where conversation.id = company_messages.conversation_id)
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

create policy "Both sides answer meeting requests"
on public.company_messages for update
to authenticated
using (exists (
  select 1 from public.company_conversations as conversation where conversation.id = company_messages.conversation_id
))
with check (exists (
  select 1 from public.company_conversations as conversation where conversation.id = company_messages.conversation_id
));

create policy "Members see their own read times"
on public.company_conversation_reads for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Members mark conversations read"
on public.company_conversation_reads for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

revoke all on public.company_conversations from anon, authenticated;
grant select (id, profile_id, sender_profile_id, created_at, last_message_at) on public.company_conversations to authenticated;
grant insert (profile_id, sender_profile_id) on public.company_conversations to authenticated;
grant delete on public.company_conversations to authenticated;

revoke all on public.company_messages from anon, authenticated;
grant select (id, conversation_id, from_company, kind, body, times, meeting_status, created_at) on public.company_messages to authenticated;
grant insert (conversation_id, kind, body, times) on public.company_messages to authenticated;
grant update (meeting_status) on public.company_messages to authenticated;

revoke all on public.company_conversation_reads from anon, authenticated;
grant select (conversation_id, read_at) on public.company_conversation_reads to authenticated;
grant insert (conversation_id) on public.company_conversation_reads to authenticated;
