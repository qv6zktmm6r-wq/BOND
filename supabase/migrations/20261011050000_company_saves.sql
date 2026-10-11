-- Saved companies: a signed-in member's private list of published companies they saved. Only the
-- member can read their saves; companies never see who saved them, and no account id is exposed.
-- Limits: 500 saved companies per account and 200 new saves a day (deleted saves still count).

create table public.company_saves (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  profile_id uuid not null references public.company_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, profile_id)
);

create index company_saves_profile_id_idx on public.company_saves (profile_id);

create table private.company_save_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index company_save_log_user_idx on private.company_save_log (user_id, created_at desc);

create function private.company_saves_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('saves:' || new.user_id::text, 0));
  if exists (select 1 from public.company_saves where user_id = new.user_id and profile_id = new.profile_id) then
    return null;
  end if;
  if (select count(*) from public.company_saves where user_id = new.user_id) >= 500 then
    raise exception 'You can save up to 500 companies.' using errcode = 'check_violation';
  end if;
  delete from private.company_save_log where user_id = new.user_id and created_at < pg_catalog.now() - interval '2 days';
  if (select count(*) from private.company_save_log
      where user_id = new.user_id and created_at > pg_catalog.now() - interval '1 day') >= 200 then
    raise exception 'You can save up to 200 companies a day.' using errcode = 'check_violation';
  end if;
  insert into private.company_save_log (user_id) values (new.user_id);
  new.created_at := pg_catalog.now();
  return new;
end;
$$;

create trigger company_saves_guard
before insert on public.company_saves
for each row execute function private.company_saves_guard();

alter table public.company_saves enable row level security;

create policy "Members see the companies they saved"
on public.company_saves for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Members save companies"
on public.company_saves for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (((select auth.jwt()) ->> 'is_anonymous')::boolean) is not true
);

create policy "Members unsave companies"
on public.company_saves for delete
to authenticated
using (user_id = (select auth.uid()));

revoke all on public.company_saves from anon, authenticated;
grant select (profile_id, created_at) on public.company_saves to authenticated;
grant insert (profile_id) on public.company_saves to authenticated;
grant delete on public.company_saves to authenticated;
