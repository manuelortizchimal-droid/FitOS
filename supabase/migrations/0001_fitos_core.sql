-- FitOS Core schema v0.1 — Supabase/PostgreSQL
-- Run on a NEW dedicated Supabase project. Review before migrating production data.
begin;
create extension if not exists pgcrypto;

create type public.fitos_gym_status as enum ('trial','active','suspended','cancelled');
create type public.fitos_role as enum ('owner','admin','trainer','athlete');

create table public.fitos_platform_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table public.fitos_gyms (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check(slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
 name text not null check(length(trim(name)) between 2 and 140),
 status public.fitos_gym_status not null default 'trial',
 member_limit integer not null default 50 check(member_limit between 1 and 1000000),
 logo_url text,
 brand_color text not null default '#ed7622' check(brand_color ~ '^#[0-9a-fA-F]{6}$'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.fitos_branches (
 id uuid primary key default gen_random_uuid(),
 gym_id uuid not null references public.fitos_gyms(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 120),
 created_at timestamptz not null default now(),
 unique(gym_id,id)
);
create table public.fitos_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '',
 created_at timestamptz not null default now()
);
create table public.fitos_memberships (
 id uuid primary key default gen_random_uuid(),
 gym_id uuid not null references public.fitos_gyms(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role public.fitos_role not null default 'athlete',
 branch_id uuid,
 enabled boolean not null default true,
 created_at timestamptz not null default now(),
 unique(gym_id,user_id),
 foreign key (gym_id,branch_id) references public.fitos_branches(gym_id,id)
);
create index fitos_memberships_user_idx on public.fitos_memberships(user_id,gym_id) where enabled;
create index fitos_memberships_gym_idx on public.fitos_memberships(gym_id,role) where enabled;

create table public.fitos_plans (
 id uuid primary key default gen_random_uuid(),
 gym_id uuid not null references public.fitos_gyms(id) on delete cascade,
 athlete_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 150),
 starts_on date not null,
 ends_on date not null,
 active boolean not null default true,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 check(ends_on>=starts_on),
 unique(gym_id,id)
);
create index fitos_plans_athlete_idx on public.fitos_plans(gym_id,athlete_id,starts_on desc);
create table public.fitos_plan_days (
 id uuid primary key default gen_random_uuid(),
 gym_id uuid not null,
 plan_id uuid not null,
 day_index smallint not null check(day_index between 0 and 6),
 title text not null check(length(title) between 1 and 150),
 exercises jsonb not null default '[]'::jsonb check(jsonb_typeof(exercises)='array'),
 unique(plan_id,day_index),
 foreign key (gym_id,plan_id) references public.fitos_plans(gym_id,id) on delete cascade
);
create table public.fitos_workouts (
 id uuid primary key default gen_random_uuid(),
 gym_id uuid not null references public.fitos_gyms(id) on delete cascade,
 athlete_id uuid not null references auth.users(id) on delete cascade,
 plan_day_id uuid references public.fitos_plan_days(id) on delete set null,
 workout_date date not null,
 status text not null default 'in_progress' check(status in ('in_progress','completed','interrupted')),
 notes text check(notes is null or length(notes)<=2000),
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 unique(gym_id,id)
);
create index fitos_workouts_athlete_idx on public.fitos_workouts(gym_id,athlete_id,workout_date desc);
create table public.fitos_sets (
 id uuid primary key default gen_random_uuid(),
 gym_id uuid not null,
 workout_id uuid not null,
 exercise_key text not null check(length(exercise_key) between 1 and 120),
 set_number smallint not null check(set_number between 1 and 25),
 weight_kg numeric(8,2) not null check(weight_kg>=0 and weight_kg<=2500),
 reps smallint not null check(reps between 1 and 200),
 rir smallint not null check(rir between 0 and 10),
 created_at timestamptz not null default now(),
 unique(workout_id,exercise_key,set_number),
 foreign key (gym_id,workout_id) references public.fitos_workouts(gym_id,id) on delete cascade
);
create table public.fitos_measurements (
 id uuid primary key default gen_random_uuid(),
 gym_id uuid not null references public.fitos_gyms(id) on delete cascade,
 athlete_id uuid not null references auth.users(id) on delete cascade,
 measured_on date not null,
 weight_kg numeric(6,2) check(weight_kg between 20 and 400),
 waist_cm numeric(6,2) check(waist_cm between 20 and 300),
 body_fat_pct numeric(5,2) check(body_fat_pct between 1 and 75),
 muscle_kg numeric(6,2) check(muscle_kg between 0 and 300),
 origin text not null default 'manual' check(origin in ('manual','device','imported')),
 created_at timestamptz not null default now(),
 unique(gym_id,athlete_id,measured_on)
);
create index fitos_measurements_athlete_idx on public.fitos_measurements(gym_id,athlete_id,measured_on desc);

-- Security-definer helpers use empty search_path, qualified identifiers, and do not accept a user_id parameter.
create function public.fitos_is_platform_admin()
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.fitos_platform_admins where user_id=(select auth.uid())) $$;
create function public.fitos_gym_enabled(g uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.fitos_gyms where id=g and status in ('trial','active')) $$;
create function public.fitos_is_member(g uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.fitos_memberships where gym_id=g and user_id=(select auth.uid()) and enabled) and public.fitos_gym_enabled(g) $$;
create function public.fitos_can_manage(g uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select public.fitos_is_platform_admin() or (public.fitos_gym_enabled(g) and exists(select 1 from public.fitos_memberships where gym_id=g and user_id=(select auth.uid()) and enabled and role in ('owner','admin'))) $$;
create function public.fitos_can_train(g uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select public.fitos_can_manage(g) or (public.fitos_gym_enabled(g) and exists(select 1 from public.fitos_memberships where gym_id=g and user_id=(select auth.uid()) and enabled and role='trainer')) $$;
create function public.fitos_can_view_athlete(g uuid,a uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select public.fitos_can_train(g) or (a=(select auth.uid()) and public.fitos_is_member(g)) $$;
create function public.fitos_valid_athlete(g uuid,a uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.fitos_memberships where gym_id=g and user_id=a and enabled and role='athlete') $$;

-- Block cross-tenant foreign references even when primary keys are guessed.
create function public.fitos_validate_plan()
returns trigger language plpgsql security definer set search_path=''
as $$ begin
 if not public.fitos_valid_athlete(new.gym_id,new.athlete_id) then raise exception 'Athlete is not an enabled member of this gym'; end if;
 return new;
end $$;
create trigger fitos_validate_plan_before before insert or update of gym_id,athlete_id on public.fitos_plans for each row execute function public.fitos_validate_plan();
create function public.fitos_validate_workout()
returns trigger language plpgsql security definer set search_path=''
as $$ begin
 if not public.fitos_valid_athlete(new.gym_id,new.athlete_id) then raise exception 'Athlete is not an enabled member of this gym'; end if;
 if new.plan_day_id is not null and not exists (
   select 1 from public.fitos_plan_days d join public.fitos_plans p on p.id=d.plan_id
   where d.id=new.plan_day_id and d.gym_id=new.gym_id and p.athlete_id=new.athlete_id
 ) then raise exception 'Workout plan day does not belong to this athlete and gym'; end if;
 return new;
end $$;
create trigger fitos_validate_workout_before before insert or update of gym_id,athlete_id,plan_day_id on public.fitos_workouts for each row execute function public.fitos_validate_workout();
create trigger fitos_validate_measure_before before insert or update of gym_id,athlete_id on public.fitos_measurements for each row execute function public.fitos_validate_plan();

-- Server-controlled membership, licensing, and status enforcement (never trust client controls).
alter table public.fitos_platform_admins enable row level security;
alter table public.fitos_gyms enable row level security;
alter table public.fitos_branches enable row level security;
alter table public.fitos_profiles enable row level security;
alter table public.fitos_memberships enable row level security;
alter table public.fitos_plans enable row level security;
alter table public.fitos_plan_days enable row level security;
alter table public.fitos_workouts enable row level security;
alter table public.fitos_sets enable row level security;
alter table public.fitos_measurements enable row level security;

create policy platform_read on public.fitos_platform_admins for select to authenticated using (user_id=(select auth.uid()));
create policy gyms_read on public.fitos_gyms for select to authenticated using(public.fitos_is_platform_admin() or public.fitos_is_member(id));
create policy gyms_manage on public.fitos_gyms for all to authenticated using(public.fitos_is_platform_admin()) with check(public.fitos_is_platform_admin());
create policy branches_read on public.fitos_branches for select to authenticated using(public.fitos_is_platform_admin() or public.fitos_is_member(gym_id));
create policy branches_manage on public.fitos_branches for all to authenticated using(public.fitos_can_manage(gym_id)) with check(public.fitos_can_manage(gym_id));
create policy profiles_read on public.fitos_profiles for select to authenticated using(id=(select auth.uid()) or exists(select 1 from public.fitos_memberships m where m.user_id=id and public.fitos_can_train(m.gym_id)));
create policy profiles_insert on public.fitos_profiles for insert to authenticated with check(id=(select auth.uid()));
create policy profiles_update on public.fitos_profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy memberships_read on public.fitos_memberships for select to authenticated using(public.fitos_is_platform_admin() or public.fitos_can_train(gym_id) or (user_id=(select auth.uid()) and public.fitos_is_member(gym_id)));
-- Membership writes are restricted to trusted onboarding RPC (not direct client SQL).
create policy plans_read on public.fitos_plans for select to authenticated using(public.fitos_can_view_athlete(gym_id,athlete_id));
create policy plans_write on public.fitos_plans for insert to authenticated with check(public.fitos_can_train(gym_id) and public.fitos_valid_athlete(gym_id,athlete_id) and created_by=(select auth.uid()));
create policy plans_update on public.fitos_plans for update to authenticated using(public.fitos_can_train(gym_id)) with check(public.fitos_can_train(gym_id) and public.fitos_valid_athlete(gym_id,athlete_id));
create policy plan_days_read on public.fitos_plan_days for select to authenticated using(exists(select 1 from public.fitos_plans p where p.id=plan_id and p.gym_id=gym_id and public.fitos_can_view_athlete(gym_id,p.athlete_id)));
create policy plan_days_insert on public.fitos_plan_days for insert to authenticated with check(exists(select 1 from public.fitos_plans p where p.id=plan_id and p.gym_id=gym_id and public.fitos_can_train(gym_id)));
create policy plan_days_update on public.fitos_plan_days for update to authenticated using(public.fitos_can_train(gym_id)) with check(public.fitos_can_train(gym_id));
create policy plan_days_delete on public.fitos_plan_days for delete to authenticated using(public.fitos_can_train(gym_id));
create policy workouts_read on public.fitos_workouts for select to authenticated using(public.fitos_can_view_athlete(gym_id,athlete_id));
create policy workouts_insert on public.fitos_workouts for insert to authenticated with check(public.fitos_can_view_athlete(gym_id,athlete_id) and public.fitos_valid_athlete(gym_id,athlete_id));
create policy workouts_update on public.fitos_workouts for update to authenticated using(public.fitos_can_view_athlete(gym_id,athlete_id)) with check(public.fitos_can_view_athlete(gym_id,athlete_id));
create policy sets_read on public.fitos_sets for select to authenticated using(exists(select 1 from public.fitos_workouts w where w.id=workout_id and w.gym_id=gym_id and public.fitos_can_view_athlete(gym_id,w.athlete_id)));
create policy sets_insert on public.fitos_sets for insert to authenticated with check(exists(select 1 from public.fitos_workouts w where w.id=workout_id and w.gym_id=gym_id and w.status='in_progress' and public.fitos_can_view_athlete(gym_id,w.athlete_id)));
create policy sets_update on public.fitos_sets for update to authenticated using(exists(select 1 from public.fitos_workouts w where w.id=workout_id and w.gym_id=gym_id and w.status='in_progress' and public.fitos_can_view_athlete(gym_id,w.athlete_id))) with check(exists(select 1 from public.fitos_workouts w where w.id=workout_id and w.gym_id=gym_id and w.status='in_progress' and public.fitos_can_view_athlete(gym_id,w.athlete_id)));
create policy measurements_read on public.fitos_measurements for select to authenticated using(public.fitos_can_view_athlete(gym_id,athlete_id));
create policy measurements_insert on public.fitos_measurements for insert to authenticated with check(public.fitos_can_view_athlete(gym_id,athlete_id) and public.fitos_valid_athlete(gym_id,athlete_id));
create policy measurements_update on public.fitos_measurements for update to authenticated using(public.fitos_can_view_athlete(gym_id,athlete_id)) with check(public.fitos_can_view_athlete(gym_id,athlete_id));

-- Restrict security-definer helpers to authenticated sessions.
revoke execute on function public.fitos_is_platform_admin() from public,anon;
revoke execute on function public.fitos_gym_enabled(uuid) from public,anon;
revoke execute on function public.fitos_is_member(uuid) from public,anon;
revoke execute on function public.fitos_can_manage(uuid) from public,anon;
revoke execute on function public.fitos_can_train(uuid) from public,anon;
revoke execute on function public.fitos_can_view_athlete(uuid,uuid) from public,anon;
revoke execute on function public.fitos_valid_athlete(uuid,uuid) from public,anon;
grant execute on function public.fitos_is_platform_admin() to authenticated;
grant execute on function public.fitos_gym_enabled(uuid) to authenticated;
grant execute on function public.fitos_is_member(uuid) to authenticated;
grant execute on function public.fitos_can_manage(uuid) to authenticated;
grant execute on function public.fitos_can_train(uuid) to authenticated;
grant execute on function public.fitos_can_view_athlete(uuid,uuid) to authenticated;
grant execute on function public.fitos_valid_athlete(uuid,uuid) to authenticated;
revoke execute on function public.fitos_validate_plan() from public,anon,authenticated;
revoke execute on function public.fitos_validate_workout() from public,anon,authenticated;

-- Atomic license switch; direct gym update additionally restricted to platform admins.
create table public.fitos_audit_events (
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id),
 gym_id uuid references public.fitos_gyms(id),
 action text not null,
 detail jsonb not null default '{}'::jsonb,
 at timestamptz not null default now()
);
alter table public.fitos_audit_events enable row level security;
create policy audit_admin_read on public.fitos_audit_events for select to authenticated using(public.fitos_is_platform_admin());
create function public.fitos_set_gym_status(g uuid,new_status public.fitos_gym_status)
returns void language plpgsql security definer set search_path=''
as $$ begin
 if not public.fitos_is_platform_admin() then raise exception 'Forbidden'; end if;
 update public.fitos_gyms set status=new_status,updated_at=now() where id=g;
 if not found then raise exception 'Gym not found'; end if;
 insert into public.fitos_audit_events(actor_id,gym_id,action,detail) values(auth.uid(),g,'license_status',jsonb_build_object('status',new_status::text));
end $$;
revoke execute on function public.fitos_set_gym_status(uuid,public.fitos_gym_status) from public,anon;
grant execute on function public.fitos_set_gym_status(uuid,public.fitos_gym_status) to authenticated;

-- Membership changes are managed in trusted server function only, preventing client role escalation.
create function public.fitos_attach_member(g uuid,member uuid,desired_role public.fitos_role,branch uuid default null)
returns uuid language plpgsql security definer set search_path=''
as $$
declare rec uuid; current_count integer; allowed_limit integer;
begin
 if not public.fitos_can_manage(g) then raise exception 'Forbidden'; end if;
 if desired_role='owner' and not public.fitos_is_platform_admin() then raise exception 'Only platform admins can assign owner'; end if;
 perform pg_advisory_xact_lock(hashtext(g::text));
 select member_limit into allowed_limit from public.fitos_gyms where id=g and status in ('trial','active') for update;
 if allowed_limit is null then raise exception 'Gym is not active'; end if;
 select count(*) into current_count from public.fitos_memberships where gym_id=g and enabled;
 if not exists(select 1 from public.fitos_memberships where gym_id=g and user_id=member and enabled) and current_count>=allowed_limit then raise exception 'Member limit reached'; end if;
 if branch is not null and not exists(select 1 from public.fitos_branches where gym_id=g and id=branch) then raise exception 'Invalid branch'; end if;
 insert into public.fitos_memberships(gym_id,user_id,role,branch_id) values(g,member,desired_role,branch)
 on conflict (gym_id,user_id) do update set role=excluded.role,branch_id=excluded.branch_id,enabled=true returning id into rec;
 insert into public.fitos_audit_events(actor_id,gym_id,action,detail) values(auth.uid(),g,'member_attached',jsonb_build_object('user_id',member,'role',desired_role::text));
 return rec;
end $$;
revoke execute on function public.fitos_attach_member(uuid,uuid,public.fitos_role,uuid) from public,anon;
grant execute on function public.fitos_attach_member(uuid,uuid,public.fitos_role,uuid) to authenticated;

-- Bootstrap: after first superadmin signs up in Supabase Auth, execute once as DB owner:
-- insert into public.fitos_platform_admins(user_id) values ('YOUR_AUTH_USER_UUID');
commit;
