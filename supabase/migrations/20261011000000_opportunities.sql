-- Opportunity Board: requests posted by member companies, readable by everyone, and the responses
-- they receive. A response is visible only to the account that sent it and to the posting company's
-- owner. Neither table exposes an account id, so posts and responses don't reveal which companies
-- share an account.

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.company_profiles (id) on delete cascade,
  type text not null check (type in ('Partner', 'Service', 'Collaboration')),
  title text not null check (char_length(title) <= 100 and btrim(title) <> ''),
  summary text not null check (char_length(summary) <= 600 and btrim(summary) <> ''),
  scope text[] not null default '{}' check (cardinality(scope) <= 5 and private.longest_item(scope) <= 80),
  seeking text not null default '' check (seeking in (
    '', 'Aerospace & Defense', 'Construction', 'Engineering', 'Manufacturing', 'Technology',
    'Logistics', 'Energy', 'Professional services'
  )),
  location text not null default '' check (char_length(location) <= 80),
  created_at timestamptz not null default now()
);

create index opportunities_profile_id_idx on public.opportunities (profile_id);
create index opportunities_created_at_idx on public.opportunities (created_at desc);

create table public.opportunity_responses (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  responder_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  profile_id uuid not null references public.company_profiles (id) on delete cascade,
  message text not null default '' check (char_length(message) <= 800),
  contact text not null default '' check (char_length(contact) <= 160),
  created_at timestamptz not null default now()
);

create index opportunity_responses_opportunity_id_idx on public.opportunity_responses (opportunity_id);
create index opportunity_responses_responder_id_idx on public.opportunity_responses (responder_id, created_at desc);
create index opportunity_responses_profile_id_idx on public.opportunity_responses (profile_id);

-- Limits are counted across rows the caller can't read, so the guards run with elevated rights.
create or replace function private.opportunities_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('opportunities:' || new.profile_id::text, 0));
  if (select count(*) from public.opportunities where profile_id = new.profile_id) >= 20 then
    raise exception 'Each company can have up to 20 opportunity posts.' using errcode = 'check_violation';
  end if;
  new.created_at := pg_catalog.now();
  return new;
end;
$$;

create trigger opportunities_guard
before insert on public.opportunities
for each row execute function private.opportunities_guard();

create or replace function private.opportunity_responses_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('responses:' || new.responder_id::text, 0));
  if (select count(*) from public.opportunity_responses
      where responder_id = new.responder_id and opportunity_id = new.opportunity_id) >= 3 then
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

create trigger opportunity_responses_guard
before insert on public.opportunity_responses
for each row execute function private.opportunity_responses_guard();

alter table public.opportunities enable row level security;
alter table public.opportunity_responses enable row level security;

create policy "Anyone can read opportunities"
on public.opportunities for select
to anon, authenticated
using (true);

create policy "Members post opportunities for their own companies"
on public.opportunities for insert
to authenticated
with check (
  exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = opportunities.profile_id and owner.owner_id = (select auth.uid())
  )
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

create policy "Members delete their own companies' opportunities"
on public.opportunities for delete
to authenticated
using (
  exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = opportunities.profile_id and owner.owner_id = (select auth.uid())
  )
);

create policy "Responders and the posting company see responses"
on public.opportunity_responses for select
to authenticated
using (
  responder_id = (select auth.uid())
  or exists (
    select 1
    from public.opportunities as opportunity
    join public.company_profile_owners as owner on owner.profile_id = opportunity.profile_id
    where opportunity.id = opportunity_responses.opportunity_id and owner.owner_id = (select auth.uid())
  )
);

create policy "Members respond as their own company to other companies' opportunities"
on public.opportunity_responses for insert
to authenticated
with check (
  responder_id = (select auth.uid())
  and exists (
    select 1 from public.company_profile_owners as owner
    where owner.profile_id = opportunity_responses.profile_id and owner.owner_id = (select auth.uid())
  )
  and not exists (
    select 1
    from public.opportunities as opportunity
    join public.company_profile_owners as owner on owner.profile_id = opportunity.profile_id
    where opportunity.id = opportunity_responses.opportunity_id and owner.owner_id = (select auth.uid())
  )
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

revoke all on public.opportunities from anon, authenticated;
grant select on public.opportunities to anon, authenticated;
grant insert (profile_id, type, title, summary, scope, seeking, location) on public.opportunities to authenticated;
grant delete on public.opportunities to authenticated;

revoke all on public.opportunity_responses from anon, authenticated;
grant select (id, opportunity_id, profile_id, message, contact, created_at) on public.opportunity_responses to authenticated;
grant insert (opportunity_id, profile_id, message, contact) on public.opportunity_responses to authenticated;
