-- Execute AFTER all migrations, as postgres superuser.
insert into auth.users(id,email) values
 ('99999999-9999-4999-8999-999999999999','master@example.test'),
 ('11111111-1111-4111-8111-111111111111','a@example.test'),
 ('22222222-2222-4222-8222-222222222222','b@example.test'),
 ('33333333-3333-4333-8333-333333333333','trainer@example.test'),
 ('44444444-4444-4444-8444-444444444444','athlete-c@example.test');
insert into public.fitos_platform_admins(user_id) values('99999999-9999-4999-8999-999999999999');
insert into public.fitos_gyms(id,slug,name,status) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','gym-a','Gym A','active'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','gym-b','Gym B','active');
insert into public.fitos_branches(id,gym_id,name) values
 ('a1000000-0000-4000-8000-000000000000','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Sucursal A1'),
 ('a2000000-0000-4000-8000-000000000000','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Sucursal A2'),
 ('b1000000-0000-4000-8000-000000000000','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Sucursal B1');
insert into public.fitos_memberships(gym_id,user_id,role,branch_id) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','athlete','a1000000-0000-4000-8000-000000000000'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','athlete','b1000000-0000-4000-8000-000000000000'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','33333333-3333-4333-8333-333333333333','trainer','a1000000-0000-4000-8000-000000000000'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444','athlete','a2000000-0000-4000-8000-000000000000');
insert into public.fitos_profiles(id,display_name) values
 ('11111111-1111-4111-8111-111111111111','Athlete A'),
 ('22222222-2222-4222-8222-222222222222','Athlete B'),
 ('44444444-4444-4444-8444-444444444444','Athlete C');
insert into public.fitos_measurements(gym_id,athlete_id,measured_on,weight_kg) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','2026-10-29',80),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444','2026-10-29',74),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','2026-10-29',65);
insert into public.fitos_plans(id,gym_id,athlete_id,title,starts_on,ends_on,created_by) values
 ('11100000-0000-4000-8000-000000000000','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Plan A','2026-10-01','2026-11-01','99999999-9999-4999-8999-999999999999');
insert into public.fitos_plan_days(id,gym_id,plan_id,day_index,title,exercises) values
 ('11110000-0000-4000-8000-000000000000','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11100000-0000-4000-8000-000000000000',0,'Día 1','[{"id":"press","name":"Press","sets":2}]');
insert into public.fitos_workouts(id,gym_id,athlete_id,plan_day_id,workout_date) values
 ('11111000-0000-4000-8000-000000000000','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','11110000-0000-4000-8000-000000000000','2026-10-30');
-- Deliberately do not grant blanket permissions here. The migration grants are the source of truth.
