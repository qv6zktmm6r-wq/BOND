-- Access-rule checks for public.company_profile_views and company_profile_view_counts.
-- Runs in a transaction that is always rolled back.
-- Run: supabase db query --linked -f supabase/tests/profile_views_rls.sql
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-4000-8000-0000000000a4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'views-a@example.test'),
  ('00000000-0000-4000-8000-0000000000b4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'views-b@example.test'),
  ('00000000-0000-4000-8000-0000000000c4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'views-c@example.test');

create temporary table rls_results (check_name text, passed boolean) on commit drop;
grant all on rls_results to anon, authenticated;

do $$
declare
  user_a constant uuid := '00000000-0000-4000-8000-0000000000a4';
  user_b constant uuid := '00000000-0000-4000-8000-0000000000b4';
  user_c constant uuid := '00000000-0000-4000-8000-0000000000c4';
  today constant date := (now() at time zone 'utc')::date;
  profile_a uuid;
  profile_c uuid;
  seen integer;
  total integer;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description) values ('Views A', 'Energy', 'Gets visitors')
  returning id into profile_a;
  perform set_config('request.jwt.claims', json_build_object('sub', user_c, 'role', 'authenticated')::text, true);
  insert into public.company_profiles (name, industry, description) values ('Views C', 'Logistics', 'Another company')
  returning id into profile_c;

  -- Counting.
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  insert into public.company_profile_views (profile_id) values (profile_a);
  insert into public.company_profile_views (profile_id) values (profile_a);
  insert into public.company_profile_views (profile_id) values (profile_a) on conflict do nothing;
  select count(*) into seen from public.company_profile_views;
  insert into rls_results values ('viewers cannot read visit rows back', seen = 0);
  begin
    insert into public.company_profile_views (profile_id, day) values (profile_a, today - 1);
    insert into rls_results values ('viewers cannot choose the day', false);
  exception when insufficient_privilege then
    insert into rls_results values ('viewers cannot choose the day', true);
  end;
  begin
    insert into public.company_profile_views (profile_id, viewer_id) values (profile_a, user_c);
    insert into rls_results values ('viewers cannot record visits for someone else', false);
  exception when insufficient_privilege then
    insert into rls_results values ('viewers cannot record visits for someone else', true);
  end;
  begin
    update public.company_profile_views set profile_id = profile_c;
    insert into rls_results values ('visits cannot be changed', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visits cannot be changed', true);
  end;
  begin
    insert into public.company_profile_views (profile_id) values (profile_a)
    on conflict (profile_id, day, viewer_id) do update set profile_id = excluded.profile_id;
    insert into rls_results values ('visits cannot be upserted', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visits cannot be upserted', true);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', user_c, 'role', 'authenticated')::text, true);
  insert into public.company_profile_views (profile_id) values (profile_a);

  perform set_config('role', 'postgres', true);
  insert into rls_results values ('repeat visits on the same day count once',
    (select count(*) from public.company_profile_views where profile_id = profile_a and day = today) = 2);
  set local session_replication_role = replica;
  insert into public.company_profile_views (profile_id, viewer_id, day)
  values (profile_a, user_b, today - 1), (profile_a, user_c, today - 1), (profile_a, user_b, today - 3);
  set local session_replication_role = origin;
  perform set_config('role', 'authenticated', true);

  perform set_config('request.jwt.claims', json_build_object('sub', user_c, 'role', 'authenticated')::text, true);
  select coalesce(sum(views), 0) into total from public.company_profile_view_counts where profile_id = profile_a;
  insert into rls_results values ('other companies cannot see a company''s view counts', total = 0);

  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  select views into total from public.company_profile_view_counts where profile_id = profile_a and day = today - 1;
  insert into rls_results values ('owner sees one view per member per day', total = 2);
  select count(*) into seen from public.company_profile_view_counts where profile_id = profile_a and day = today;
  insert into rls_results values ('owner does not see today''s views until tomorrow', seen = 0);
  begin
    perform viewer_id from public.company_profile_views;
    insert into rls_results values ('owners cannot see who viewed', false);
  exception when insufficient_privilege then
    insert into rls_results values ('owners cannot see who viewed', true);
  end;
  begin
    insert into public.company_profile_views (profile_id) values (profile_a);
    insert into rls_results values ('views of your own company are not counted', false);
  exception when check_violation then
    insert into rls_results values ('views of your own company are not counted', true);
  end;
  begin
    delete from public.company_profile_views where profile_id = profile_a;
    insert into rls_results values ('owners cannot delete visits', false);
  exception when insufficient_privilege then
    insert into rls_results values ('owners cannot delete visits', true);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  begin
    insert into public.company_profile_views (profile_id) values (profile_c);
    insert into rls_results values ('anonymous sessions are not counted', false);
  exception when insufficient_privilege then
    insert into rls_results values ('anonymous sessions are not counted', true);
  end;

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    insert into public.company_profile_views (profile_id) values (profile_a);
    insert into rls_results values ('visitors cannot record visits', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visitors cannot record visits', true);
  end;
  begin
    perform count(*) from public.company_profile_views;
    insert into rls_results values ('visitors cannot read visits', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visitors cannot read visits', true);
  end;
  begin
    perform count(*) from public.company_profile_view_counts;
    insert into rls_results values ('visitors cannot read view counts', false);
  exception when insufficient_privilege then
    insert into rls_results values ('visitors cannot read view counts', true);
  end;

  -- Limits and retention.
  perform set_config('role', 'postgres', true);
  set local session_replication_role = replica;
  insert into public.company_profile_views (profile_id, viewer_id, day)
  select gen_random_uuid(), user_b, today from generate_series(1, 299);
  insert into public.company_profile_views (profile_id, viewer_id, day) values (profile_a, user_c, today - 120);
  set local session_replication_role = origin;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  begin
    insert into public.company_profile_views (profile_id) values (profile_c);
    insert into rls_results values ('more than 300 profile views a day are not counted', false);
  exception when check_violation then
    insert into rls_results values ('more than 300 profile views a day are not counted', true);
  end;

  perform set_config('role', 'postgres', true);
  delete from public.company_profile_views where viewer_id = user_b and day = today and profile_id not in (profile_a, profile_c);
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.company_profile_views (profile_id) values (profile_c);
  perform set_config('role', 'postgres', true);
  insert into rls_results values ('visits older than 90 days are pruned for every company',
    not exists (select 1 from public.company_profile_views where day < today - 90)
    and exists (select 1 from public.company_profile_views where profile_id = profile_c and day = today));

  -- Cascades.
  delete from auth.users where id = user_c;
  insert into rls_results values ('deleting an account removes its visits',
    not exists (select 1 from public.company_profile_views where viewer_id = user_c));
  delete from public.company_profiles where id = profile_a;
  insert into rls_results values ('deleting a company removes its visits',
    not exists (select 1 from public.company_profile_views where profile_id = profile_a));
end;
$$;

select check_name, case when passed then 'PASS' else 'FAIL' end as result from rls_results;
rollback;
