-- Responders can withdraw their responses (and the contact details in them), reply contacts must be
-- an email address or phone number, each account can post up to 10 opportunities a day (deleted posts
-- still count), posting checks company ownership before any limit, and the 3-responses-per-opportunity
-- limit counts per responding company so it says nothing about which companies share an account.

create table private.opportunity_post_log (
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index opportunity_post_log_owner_idx on private.opportunity_post_log (owner_id, created_at desc);

create or replace function private.opportunities_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  poster uuid;
begin
  select owner.owner_id into poster from public.company_profile_owners as owner where owner.profile_id = new.profile_id;
  if poster is null or ((select auth.uid()) is not null and poster <> (select auth.uid())) then
    raise exception 'Opportunities can only be posted for your own companies.' using errcode = 'insufficient_privilege';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('opportunities:' || poster::text, 0));
  if (select count(*) from public.opportunities where profile_id = new.profile_id) >= 20 then
    raise exception 'Each company can have up to 20 opportunity posts.' using errcode = 'check_violation';
  end if;
  if (select count(*) from private.opportunity_post_log
      where owner_id = poster and created_at > pg_catalog.now() - interval '1 day') >= 10 then
    raise exception 'You can post up to 10 opportunities a day.' using errcode = 'check_violation';
  end if;
  insert into private.opportunity_post_log (owner_id) values (poster);
  new.created_at := pg_catalog.now();
  return new;
end;
$$;

create or replace function private.opportunity_responses_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('responses:' || new.responder_id::text, 0));
  if (select count(*) from public.opportunity_responses
      where profile_id = new.profile_id and opportunity_id = new.opportunity_id) >= 3 then
    raise exception 'You can send up to 3 responses to one opportunity.' using errcode = 'check_violation';
  end if;
  if (select count(*) from public.opportunity_responses
      where responder_id = new.responder_id and created_at > pg_catalog.now() - interval '1 day') >= 30 then
    raise exception 'You can send up to 30 responses a day.' using errcode = 'check_violation';
  end if;
  new.created_at := pg_catalog.now();
  return new;
end;
$$;

alter table public.opportunity_responses
  drop constraint opportunity_responses_contact_check,
  add constraint opportunity_responses_contact_check check (
    contact = ''
    or (char_length(contact) <= 160 and contact ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$')
    or contact ~ '^\+?[0-9][0-9 ().-]{5,24}$'
  );

create policy "Responders withdraw their own responses"
on public.opportunity_responses for delete
to authenticated
using (responder_id = (select auth.uid()));

grant delete on public.opportunity_responses to authenticated;
