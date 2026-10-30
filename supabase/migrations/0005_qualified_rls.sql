-- FitOS security v0.5: fully qualify outer-row references in correlated RLS policies.
-- This migration is mandatory before tenant acceptance tests.
begin;
drop policy if exists gyms_read on public.fitos_gyms;
create policy gyms_read on public.fitos_gyms for select to authenticated using(
 public.fitos_is_platform_admin()
 or exists(select 1 from public.fitos_memberships member
   where member.gym_id=public.fitos_gyms.id and member.user_id=(select auth.uid()) and member.enabled)
);

drop policy if exists profiles_read on public.fitos_profiles;
create policy profiles_read on public.fitos_profiles for select to authenticated using(
 public.fitos_profiles.id=(select auth.uid())
 or public.fitos_is_platform_admin()
 or exists(select 1 from public.fitos_memberships member
     where member.user_id=public.fitos_profiles.id
       and public.fitos_can_view_athlete(member.gym_id,public.fitos_profiles.id))
);

drop policy if exists branches_read on public.fitos_branches;
create policy branches_read on public.fitos_branches for select to authenticated using(
 public.fitos_can_manage(public.fitos_branches.gym_id)
 or (public.fitos_is_member(public.fitos_branches.gym_id) and exists(
     select 1 from public.fitos_memberships member
     where member.gym_id=public.fitos_branches.gym_id
       and member.user_id=(select auth.uid())
       and member.enabled and member.branch_id=public.fitos_branches.id
 ))
);

drop policy if exists plan_days_read on public.fitos_plan_days;
create policy plan_days_read on public.fitos_plan_days for select to authenticated using(
 exists(select 1 from public.fitos_plans plan
    where plan.id=public.fitos_plan_days.plan_id
      and plan.gym_id=public.fitos_plan_days.gym_id
      and public.fitos_can_view_athlete(public.fitos_plan_days.gym_id,plan.athlete_id))
);
drop policy if exists plan_days_insert on public.fitos_plan_days;
create policy plan_days_insert on public.fitos_plan_days for insert to authenticated with check(
 exists(select 1 from public.fitos_plans plan
    where plan.id=public.fitos_plan_days.plan_id
      and plan.gym_id=public.fitos_plan_days.gym_id
      and (public.fitos_can_train_athlete(public.fitos_plan_days.gym_id,plan.athlete_id)
       or (plan.athlete_id=(select auth.uid()) and public.fitos_is_member(public.fitos_plan_days.gym_id))))
);
drop policy if exists plan_days_update on public.fitos_plan_days;
create policy plan_days_update on public.fitos_plan_days for update to authenticated using(
 exists(select 1 from public.fitos_plans plan
    where plan.id=public.fitos_plan_days.plan_id and plan.gym_id=public.fitos_plan_days.gym_id
      and (public.fitos_can_train_athlete(public.fitos_plan_days.gym_id,plan.athlete_id)
       or (plan.athlete_id=(select auth.uid()) and public.fitos_is_member(public.fitos_plan_days.gym_id))))
) with check(
 exists(select 1 from public.fitos_plans plan
    where plan.id=public.fitos_plan_days.plan_id and plan.gym_id=public.fitos_plan_days.gym_id
      and (public.fitos_can_train_athlete(public.fitos_plan_days.gym_id,plan.athlete_id)
       or (plan.athlete_id=(select auth.uid()) and public.fitos_is_member(public.fitos_plan_days.gym_id))))
);
drop policy if exists plan_days_delete on public.fitos_plan_days;
create policy plan_days_delete on public.fitos_plan_days for delete to authenticated using(
 exists(select 1 from public.fitos_plans plan
    where plan.id=public.fitos_plan_days.plan_id and plan.gym_id=public.fitos_plan_days.gym_id
      and (public.fitos_can_train_athlete(public.fitos_plan_days.gym_id,plan.athlete_id)
       or (plan.athlete_id=(select auth.uid()) and public.fitos_is_member(public.fitos_plan_days.gym_id))))
);

drop policy if exists sets_read on public.fitos_sets;
create policy sets_read on public.fitos_sets for select to authenticated using(
 exists(select 1 from public.fitos_workouts workout
   where workout.id=public.fitos_sets.workout_id
     and workout.gym_id=public.fitos_sets.gym_id
     and public.fitos_can_view_athlete(public.fitos_sets.gym_id,workout.athlete_id))
);
drop policy if exists sets_insert on public.fitos_sets;
create policy sets_insert on public.fitos_sets for insert to authenticated with check(
 exists(select 1 from public.fitos_workouts workout
   where workout.id=public.fitos_sets.workout_id
     and workout.gym_id=public.fitos_sets.gym_id
     and workout.status='in_progress'
     and public.fitos_can_view_athlete(public.fitos_sets.gym_id,workout.athlete_id))
);
drop policy if exists sets_update on public.fitos_sets;
create policy sets_update on public.fitos_sets for update to authenticated using(
 exists(select 1 from public.fitos_workouts workout
   where workout.id=public.fitos_sets.workout_id
     and workout.gym_id=public.fitos_sets.gym_id
     and workout.status='in_progress'
     and public.fitos_can_view_athlete(public.fitos_sets.gym_id,workout.athlete_id))
) with check(
 exists(select 1 from public.fitos_workouts workout
   where workout.id=public.fitos_sets.workout_id
     and workout.gym_id=public.fitos_sets.gym_id
     and workout.status='in_progress'
     and public.fitos_can_view_athlete(public.fitos_sets.gym_id,workout.athlete_id))
);
commit;
