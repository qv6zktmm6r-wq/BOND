-- Founding-member numbers and the feedback inbox. Runs in a transaction that is always rolled back.
-- Run: supabase db query --linked -f supabase/tests/founding_feedback.sql
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'founding-a@example.test'),
  ('00000000-0000-4000-8000-0000000000f2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'founding-b@example.test');

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
  user_a constant uuid := '00000000-0000-4000-8000-0000000000f1';
  before_next integer;
  profile_a uuid;
  first_number integer;
  second_number integer;
  seen integer;
begin
  select next_number into before_next from private.founding_counter;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description, founding_number)
  values ('Founding Co', 'Energy', 'First test company', 1)
  returning id, founding_number into profile_a, first_number;
  insert into rls_results values ('a new company receives the next founding number, not one it chooses', first_number = before_next);
  insert into public.company_profiles (name, industry, description) values ('Second Co', 'Logistics', 'Second test company')
  returning founding_number into second_number;
  insert into rls_results values ('the next company receives the following number', second_number = first_number + 1);
  update public.company_profiles set name = 'Renamed Co', founding_number = 1 where id = profile_a;
  insert into rls_results values ('renaming a company keeps its founding number',
    (select founding_number = first_number and name = 'Renamed Co' from public.company_profiles where id = profile_a));

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  select founding_number into seen from public.company_profiles where id = profile_a;
  insert into rls_results values ('visitors can see a founding number', seen = first_number);
  insert into rls_results values ('visitors cannot read the founding counter',
    pg_temp.attempt('select next_number from private.founding_counter') = '42501');
  insert into rls_results values ('the open-places count matches the highest number issued',
    public.founding_spots_remaining() = greatest(0, 100 - second_number));

  insert into public.site_feedback (body, contact) values ('The expo should stay near the top.', '');
  insert into rls_results values ('a visitor can send feedback', true);
  insert into rls_results values ('a visitor cannot read feedback',
    pg_temp.attempt('select body from public.site_feedback') = '42501');
  insert into rls_results values ('feedback needs visible words',
    pg_temp.attempt($q$insert into public.site_feedback (body) values ('   ')$q$) <> 'ok');

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.site_feedback (body) values ('First note');
  insert into public.site_feedback (body) values ('Second note');
  insert into public.site_feedback (body) values ('Third note');
  insert into rls_results values ('a fourth note the same day is refused',
    pg_temp.attempt($q$insert into public.site_feedback (body) values ('Fourth note')$q$) = '23514');
  perform set_config('role', 'postgres', true);
  insert into rls_results values ('a member can send three notes a day',
    (select count(*) = 3 from public.site_feedback where user_id = user_a));
  insert into rls_results values ('a signed-in note is tied to that member',
    (select count(*) = 3 from public.site_feedback where user_id = user_a));
  insert into rls_results values ('a visitor note is not tied to a member',
    exists (select 1 from public.site_feedback where user_id is null and body = 'The expo should stay near the top.'));
end;
$$;

select check_name, case when passed then 'PASS' else 'FAIL' end as result from rls_results;
rollback;
