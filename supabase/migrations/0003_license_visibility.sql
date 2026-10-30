-- Let suspended users see minimal tenant status without any access to business records.
begin;
drop policy if exists gyms_read on public.fitos_gyms;
create policy gyms_read on public.fitos_gyms for select to authenticated using(
 public.fitos_is_platform_admin()
 or exists(select 1 from public.fitos_memberships m where m.gym_id=id and m.user_id=(select auth.uid()) and m.enabled)
);
drop policy if exists memberships_read on public.fitos_memberships;
create policy memberships_read on public.fitos_memberships for select to authenticated using(
 public.fitos_is_platform_admin()
 or public.fitos_can_manage(gym_id)
 or user_id=(select auth.uid())
 or (role='athlete' and public.fitos_can_train_athlete(gym_id,user_id))
);
-- Log old/new status for audit review.
create or replace function public.fitos_set_gym_status(g uuid,new_status public.fitos_gym_status)
returns void language plpgsql security definer set search_path=''
as $$
declare old_status public.fitos_gym_status;
begin
 if not public.fitos_is_platform_admin() then raise exception 'Forbidden'; end if;
 select status into old_status from public.fitos_gyms where id=g for update;
 if not found then raise exception 'Gym not found'; end if;
 update public.fitos_gyms set status=new_status,updated_at=now() where id=g;
 insert into public.fitos_audit_events(actor_id,gym_id,action,detail)
 values(auth.uid(),g,'license_status',jsonb_build_object('previous',old_status::text,'current',new_status::text));
end $$;
commit;
