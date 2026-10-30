-- FitOS v0.7: prevent duplicate daily sessions and immutable ownership.
begin;
create unique index if not exists fitos_single_plan_session_per_day
 on public.fitos_workouts(gym_id,athlete_id,plan_day_id,workout_date)
 where plan_day_id is not null;

create function public.fitos_guard_plan_integrity()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if tg_op='UPDATE' and (new.gym_id is distinct from old.gym_id
   or new.athlete_id is distinct from old.athlete_id
   or new.created_by is distinct from old.created_by)
 then raise exception 'Plan ownership cannot change'; end if;
 return new;
end $$;
create trigger fitos_plan_immutability before update on public.fitos_plans
 for each row execute function public.fitos_guard_plan_integrity();
revoke execute on function public.fitos_guard_plan_integrity() from public,anon,authenticated;

create function public.fitos_guard_day_history()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if exists(select 1 from public.fitos_workouts w where w.plan_day_id=old.id and w.status='completed')
   then raise exception 'Cannot modify a day with completed workout history'; end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
create trigger fitos_day_immutable_after_training before update of exercises,plan_id,gym_id or delete
 on public.fitos_plan_days for each row execute function public.fitos_guard_day_history();
revoke execute on function public.fitos_guard_day_history() from public,anon,authenticated;

create function public.fitos_guard_measure_tenant()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if new.gym_id is distinct from old.gym_id or new.athlete_id is distinct from old.athlete_id
 then raise exception 'Measurement ownership cannot change'; end if;
 return new;
end $$;
create trigger fitos_measure_owner_before before update on public.fitos_measurements
 for each row execute function public.fitos_guard_measure_tenant();
revoke execute on function public.fitos_guard_measure_tenant() from public,anon,authenticated;
commit;
