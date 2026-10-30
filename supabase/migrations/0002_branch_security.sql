-- FitOS Core hardening v0.2: branch-scoped trainer access + athlete-owned plans.
begin;
create or replace function public.fitos_can_view_athlete(g uuid,a uuid)
returns boolean language sql stable security definer set search_path=''
as $$
 select public.fitos_is_platform_admin()
 or (
  public.fitos_gym_enabled(g)
  and (
   (a=(select auth.uid()) and public.fitos_is_member(g))
   or exists(select 1 from public.fitos_memberships m
     where m.gym_id=g and m.user_id=(select auth.uid()) and m.enabled
       and (m.role in ('owner','admin')
        or (m.role='trainer' and exists(
           select 1 from public.fitos_memberships student
           where student.gym_id=g and student.user_id=a and student.enabled
             and student.role='athlete'
             and student.branch_id is not distinct from m.branch_id
             and student.branch_id is not null
        )))
   )
  )
 )
$$;
create or replace function public.fitos_can_train_athlete(g uuid,a uuid)
returns boolean language sql stable security definer set search_path=''
as $$
 select public.fitos_is_platform_admin()
 or (
  public.fitos_gym_enabled(g)
  and exists(select 1 from public.fitos_memberships m
   where m.gym_id=g and m.user_id=(select auth.uid()) and m.enabled
   and (
      m.role in ('owner','admin')
      or (m.role='trainer' and m.branch_id is not null and exists(
       select 1 from public.fitos_memberships student
       where student.gym_id=g and student.user_id=a and student.enabled
         and student.role='athlete' and student.branch_id=m.branch_id
      ))
   ))
 )
$$;
revoke execute on function public.fitos_can_train_athlete(uuid,uuid) from public,anon;
grant execute on function public.fitos_can_train_athlete(uuid,uuid) to authenticated;
drop policy if exists profiles_read on public.fitos_profiles;
create policy profiles_read on public.fitos_profiles for select to authenticated
using(id=(select auth.uid()) or public.fitos_is_platform_admin()
 or exists(select 1 from public.fitos_memberships m where m.user_id=id and public.fitos_can_view_athlete(m.gym_id,id)));
drop policy if exists memberships_read on public.fitos_memberships;
create policy memberships_read on public.fitos_memberships for select to authenticated
using(public.fitos_is_platform_admin() or public.fitos_can_manage(gym_id)
 or (user_id=(select auth.uid()) and public.fitos_is_member(gym_id))
 or (role='athlete' and public.fitos_can_train_athlete(gym_id,user_id)));

drop policy if exists plans_write on public.fitos_plans;
create policy plans_write on public.fitos_plans for insert to authenticated
with check(public.fitos_valid_athlete(gym_id,athlete_id)
 and created_by=(select auth.uid())
 and (public.fitos_can_train_athlete(gym_id,athlete_id)
 or (athlete_id=(select auth.uid()) and public.fitos_is_member(gym_id))));
drop policy if exists plans_update on public.fitos_plans;
create policy plans_update on public.fitos_plans for update to authenticated
using(public.fitos_can_train_athlete(gym_id,athlete_id)
 or (athlete_id=(select auth.uid()) and public.fitos_is_member(gym_id)))
with check(public.fitos_valid_athlete(gym_id,athlete_id)
 and (public.fitos_can_train_athlete(gym_id,athlete_id)
 or (athlete_id=(select auth.uid()) and public.fitos_is_member(gym_id))));
drop policy if exists plan_days_insert on public.fitos_plan_days;
create policy plan_days_insert on public.fitos_plan_days for insert to authenticated
with check(exists(select 1 from public.fitos_plans p where p.id=plan_id and p.gym_id=gym_id
 and (public.fitos_can_train_athlete(gym_id,p.athlete_id)
 or (p.athlete_id=(select auth.uid()) and public.fitos_is_member(gym_id)))));
drop policy if exists plan_days_update on public.fitos_plan_days;
create policy plan_days_update on public.fitos_plan_days for update to authenticated
using(exists(select 1 from public.fitos_plans p where p.id=plan_id and p.gym_id=gym_id and
 (public.fitos_can_train_athlete(gym_id,p.athlete_id) or (p.athlete_id=(select auth.uid()) and public.fitos_is_member(gym_id)))))
with check(exists(select 1 from public.fitos_plans p where p.id=plan_id and p.gym_id=gym_id and
 (public.fitos_can_train_athlete(gym_id,p.athlete_id) or (p.athlete_id=(select auth.uid()) and public.fitos_is_member(gym_id)))));
drop policy if exists plan_days_delete on public.fitos_plan_days;
create policy plan_days_delete on public.fitos_plan_days for delete to authenticated
using(exists(select 1 from public.fitos_plans p where p.id=plan_id and p.gym_id=gym_id and
 (public.fitos_can_train_athlete(gym_id,p.athlete_id) or (p.athlete_id=(select auth.uid()) and public.fitos_is_member(gym_id)))));
-- Attach membership cannot update existing owners without platform authorization.
create or replace function public.fitos_attach_member(g uuid,member uuid,desired_role public.fitos_role,branch uuid default null)
returns uuid language plpgsql security definer set search_path=''
as $$
declare rec uuid; current_count integer; allowed_limit integer;
begin
 if not public.fitos_can_manage(g) then raise exception 'Forbidden'; end if;
 if desired_role='owner' and not public.fitos_is_platform_admin() then raise exception 'Only platform admins can assign owner'; end if;
 if exists(select 1 from public.fitos_memberships where gym_id=g and user_id=member and role='owner')
 and not public.fitos_is_platform_admin() then raise exception 'Only platform admins can modify owners'; end if;
 perform pg_advisory_xact_lock(hashtext(g::text));
 select member_limit into allowed_limit from public.fitos_gyms where id=g and status in ('trial','active') for update;
 if allowed_limit is null then raise exception 'Gym is not active'; end if;
 select count(*) into current_count from public.fitos_memberships where gym_id=g and enabled;
 if not exists(select 1 from public.fitos_memberships where gym_id=g and user_id=member and enabled)
 and current_count>=allowed_limit then raise exception 'Member limit reached'; end if;
 if branch is not null and not exists(select 1 from public.fitos_branches where gym_id=g and id=branch) then raise exception 'Invalid branch'; end if;
 if desired_role='trainer' and branch is null then raise exception 'Trainer requires branch'; end if;
 insert into public.fitos_memberships(gym_id,user_id,role,branch_id) values(g,member,desired_role,branch)
 on conflict (gym_id,user_id) do update set role=excluded.role,branch_id=excluded.branch_id,enabled=true returning id into rec;
 insert into public.fitos_audit_events(actor_id,gym_id,action,detail)
 values(auth.uid(),g,'member_attached',jsonb_build_object('user_id',member,'role',desired_role::text));
 return rec;
end $$;
commit;
