-- Introduction requests and extra company managers. Always rolled back.
-- Run: supabase db query --linked -f supabase/tests/introductions_representatives.sql
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'intro-founder@example.test'),
  ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'intro-asker@example.test'),
  ('00000000-0000-4000-8000-0000000000e3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'intro-rep@example.test');

create temporary table rls_results (check_name text, passed boolean) on commit drop;
grant all on rls_results to anon, authenticated;

do $$
declare
  founder constant uuid := '00000000-0000-4000-8000-0000000000e1';
  asker constant uuid := '00000000-0000-4000-8000-0000000000e2';
  rep constant uuid := '00000000-0000-4000-8000-0000000000e3';
  company uuid;
  invited jsonb;
  pending jsonb;
  accepted integer;
  mailed integer;
  seen integer;
  updated integer;
  removed integer;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', founder, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description)
  values ('Intro Co', 'Construction', 'Builds introductions')
  returning id into company;

  perform set_config('request.jwt.claims', json_build_object('sub', asker, 'role', 'authenticated')::text, true);
  insert into public.introduction_requests (requester_id, company_id) values (asker, company);
  perform set_config('role', 'postgres', true);
  insert into rls_results values (
    'a member can request an introduction',
    (select count(*) from public.introduction_requests where company_id = company and requester_id = asker) = 1
  );
  insert into rls_results values (
    'the company founder gets an introduction email without the asker in it',
    (select count(*) from private.mail_outbox
      where recipient_id = founder and kind = 'introduction'
        and preview not ilike '%intro-asker%' and preview not ilike '%@%') = 1
  );

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', asker, 'role', 'authenticated')::text, true);
  select count(*) into seen from public.my_introduction_requests() where my_introduction_requests = company;
  insert into rls_results values ('the asker can see their own request', seen = 1);

  begin
    perform set_config('request.jwt.claims', json_build_object('sub', founder, 'role', 'authenticated')::text, true);
    insert into public.introduction_requests (requester_id, company_id) values (founder, company);
    insert into rls_results values ('a manager cannot request an introduction to their own company', false);
  exception when others then
    insert into rls_results values ('a manager cannot request an introduction to their own company', true);
  end;

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    insert into public.introduction_requests (requester_id, company_id) values (asker, company);
    insert into rls_results values ('visitors cannot request an introduction', false);
  exception when others then
    insert into rls_results values ('visitors cannot request an introduction', true);
  end;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', asker, 'role', 'authenticated')::text, true);
  invited := public.invite_company_representative(company, 'intro-rep@example.test');
  insert into rls_results values ('only the founder can add a representative', invited->>'reason' = 'founder');

  perform set_config('request.jwt.claims', json_build_object('sub', founder, 'role', 'authenticated')::text, true);
  invited := public.invite_company_representative(company, 'intro-rep@example.test');
  insert into rls_results values ('the founder adds someone who already has an account', invited->>'ok' = 'true' and invited->>'pending' = 'false');
  pending := public.invite_company_representative(company, 'intro-later@example.test');
  insert into rls_results values ('an unknown email waits until that person signs in', pending->>'ok' = 'true' and pending->>'pending' = 'true');
  insert into rls_results values (
    'the founder cannot add their own email',
    (public.invite_company_representative(company, 'intro-founder@example.test'))->>'reason' = 'self'
  );

  perform set_config('role', 'postgres', true);
  select count(*) into mailed from private.mail_outbox where recipient_id = rep and kind = 'representative';
  insert into rls_results values ('the new representative gets an email', mailed = 1);

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', rep, 'role', 'authenticated')::text, true);
  update public.company_profiles set description = 'Builds introductions together' where id = company;
  get diagnostics updated = row_count;
  insert into rls_results values ('a representative can update the company', updated = 1);
  delete from public.company_profiles where id = company;
  get diagnostics removed = row_count;
  insert into rls_results values ('a representative cannot delete the company', removed = 0);
  insert into public.company_updates (profile_id, type, text) values (company, 'project', 'Shared by a representative');
  insert into rls_results values ('a representative can share an update', (select count(*) from public.company_updates where profile_id = company) = 1);

  perform set_config('role', 'postgres', true);
  insert into auth.users (id, instance_id, aud, role, email)
  values ('00000000-0000-4000-8000-0000000000e4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'intro-later@example.test');
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-8000-0000000000e4', 'role', 'authenticated')::text, true);
  accepted := public.accept_company_invites();
  insert into rls_results values ('signing in accepts a waiting invitation', accepted = 1);
end;
$$;

select check_name, case when passed then 'PASS' else 'FAIL' end as result
from rls_results
order by check_name;

rollback;
