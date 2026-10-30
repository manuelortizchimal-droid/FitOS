-- Ensure Data API uses explicit grants, but anonymous SQL access stays denied.
do $$
begin
 if has_table_privilege('anon','public.fitos_gyms','SELECT') then
   raise exception 'Anonymous access was granted to gyms';
 end if;
 if has_table_privilege('anon','public.fitos_measurements','SELECT') then
   raise exception 'Anonymous access was granted to measurements';
 end if;
 if not has_table_privilege('authenticated','public.fitos_measurements','SELECT') then
   raise exception 'Authenticated data API has no measurement read grant';
 end if;
 if has_table_privilege('authenticated','public.fitos_gyms','UPDATE') then
   raise exception 'License updates bypass audit RPC';
 end if;
 if has_table_privilege('authenticated','public.fitos_memberships','UPDATE') then
   raise exception 'Membership direct write privilege must stay revoked';
 end if;
end $$;
-- Actual RLS acceptance checks on PostgreSQL roles (simulated authenticated JWT subjects).
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
do $$
begin
 if (select count(*) from public.fitos_gyms)<>1 then raise exception 'Tenant A can read wrong gyms'; end if;
 if (select count(*) from public.fitos_branches)<>1 then raise exception 'Athlete sees another branch'; end if;
 if (select count(*) from public.fitos_measurements)<>1 then raise exception 'Tenant A measurements leaked'; end if;
 if (select count(*) from public.fitos_profiles)<>1 then raise exception 'Tenant A profiles leaked'; end if;
end $$;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
do $$
begin
 if (select count(*) from public.fitos_measurements)<>1 then raise exception 'Trainer can read another branch'; end if;
 if (select count(*) from public.fitos_branches)<>1 then raise exception 'Trainer sees other branches'; end if;
end $$;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
do $$
declare rejected boolean:=false;
begin
 begin
  update public.fitos_workouts set status='completed' where id='11111000-0000-4000-8000-000000000000';
 exception when others then rejected:=true; end;
 if not rejected then raise exception 'Empty workout was completed'; end if;
end $$;
insert into public.fitos_sets(gym_id,workout_id,exercise_key,set_number,weight_kg,reps,rir) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111000-0000-4000-8000-000000000000','press',1,50,10,2),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111000-0000-4000-8000-000000000000','press',2,55,8,1);
update public.fitos_workouts set status='completed' where id='11111000-0000-4000-8000-000000000000';
do $$ begin
 if (select status from public.fitos_workouts where id='11111000-0000-4000-8000-000000000000')<>'completed' then raise exception 'Workout not completed'; end if;
end $$;
do $$
declare blocked boolean:=false;
begin
 begin
  insert into public.fitos_workouts(gym_id,athlete_id,plan_day_id,workout_date)
  values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111',
    '11110000-0000-4000-8000-000000000000','2026-10-30');
 exception when unique_violation then blocked:=true; end;
 if not blocked then raise exception 'Duplicate workout was accepted'; end if;
end $$;
do $$
declare blocked boolean:=false;
begin
 begin
  update public.fitos_plans set athlete_id='44444444-4444-4444-8444-444444444444'
  where id='11100000-0000-4000-8000-000000000000';
 exception when others then blocked:=true; end;
 if not blocked then raise exception 'Plan athlete transfer was accepted'; end if;
end $$;
select set_config('request.jwt.claim.sub','99999999-9999-4999-8999-999999999999',false);
select public.fitos_set_gym_status('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','suspended');
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
do $$
begin
 if (select count(*) from public.fitos_gyms)<>1 then raise exception 'Suspended gym status invisible'; end if;
 if (select count(*) from public.fitos_measurements)<>0 then raise exception 'Suspended gym records readable'; end if;
 if (select count(*) from public.fitos_workouts)<>0 then raise exception 'Suspended gym workout readable'; end if;
end $$;
reset role;
