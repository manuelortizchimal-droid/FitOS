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
