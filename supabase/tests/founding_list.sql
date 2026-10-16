-- The pre-launch founding list. Runs in a transaction that is always rolled back.
-- Run: supabase db query --linked -f supabase/tests/founding_list.sql
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-4000-8000-0000000000f3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'list-a@example.test'),
  ('00000000-0000-4000-8000-0000000000f4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'list-b@example.test');

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
  user_a constant uuid := '00000000-0000-4000-8000-0000000000f3';
  user_b constant uuid := '00000000-0000-4000-8000-0000000000f4';
  spots_before integer;
  expected_place integer;
  first_join jsonb;
  second_join jsonb;
  repeat_join jsonb;
  place_a integer;
  place_b integer;
  profile_place integer;
begin
  select next_number into expected_place from private.founding_list_counter;
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  spots_before := public.founding_spots_remaining();
  first_join := public.join_founding_list('List-A@example.test', 'List Co');
  place_a := (first_join ->> 'place')::integer;
  insert into rls_results values ('a new email receives the next place', place_a = expected_place and (first_join ->> 'already')::boolean = false);
  insert into rls_results values ('one signup uses one open place', public.founding_spots_remaining() = greatest(0, spots_before - 1));
  repeat_join := public.join_founding_list('list-a@example.test', 'List Co');
  insert into rls_results values ('the same email keeps its place', (repeat_join ->> 'place')::integer = place_a and (repeat_join ->> 'already')::boolean);
  insert into rls_results values ('repeating an email does not use another place', public.founding_spots_remaining() = greatest(0, spots_before - 1));
  second_join := public.join_founding_list('list-c@example.test', '');
  place_b := (second_join ->> 'place')::integer;
  insert into rls_results values ('the next business receives the following place', place_b = place_a + 1);
  insert into rls_results values ('a place of 100 or less is a gold founding place', (first_join ->> 'founding')::boolean = (place_a <= 100));
  insert into rls_results values ('the list rejects an invalid email',
    pg_temp.attempt($q$select public.join_founding_list('not-an-email', 'Nope')$q$) = '23514');
  insert into rls_results values ('visitors cannot read the list',
    pg_temp.attempt('select email from public.founding_signups') = '42501');

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description)
  values ('Listed Co', 'Energy', 'A company on the founding list')
  returning founding_place into profile_place;
  insert into rls_results values ('a published company keeps the list place reserved for its email',
    profile_place is not distinct from case when place_a <= 100 then place_a else null end);

  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description)
  values ('Unlisted Co', 'Logistics', 'A company that is not on the list')
  returning founding_place into profile_place;
  insert into rls_results values ('a company that is not on the list does not receive the badge place', profile_place is null);
end;
$$;

select check_name, case when passed then 'PASS' else 'FAIL' end as result from rls_results;
rollback;
