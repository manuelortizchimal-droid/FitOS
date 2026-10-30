-- FitOS: member administration API. Matches the migrations applied to FitOS-Core.
begin;
create or replace function public.fitos_list_gym_members(g uuid)
returns table(user_id uuid,member_role public.fitos_role,branch_id uuid,enabled boolean)
language sql stable security definer set search_path=''
as $$
 select m.user_id,m.role,m.branch_id,m.enabled
 from public.fitos_memberships m
 where m.gym_id=g and public.fitos_can_manage(g)
$$;
revoke execute on function public.fitos_list_gym_members(uuid) from public,anon;
grant execute on function public.fitos_list_gym_members(uuid) to authenticated;
create or replace function public.fitos_set_member_access(g uuid,member uuid,allow_access boolean)
returns void language plpgsql security definer set search_path=''
as $$
declare target_role public.fitos_role;
begin
 if not public.fitos_can_manage(g) then raise exception 'Forbidden'; end if;
 if member=(select auth.uid()) then raise exception 'Cannot change your own access'; end if;
 select role into target_role from public.fitos_memberships where gym_id=g and user_id=member for update;
 if not found then raise exception 'Member not found'; end if;
 if target_role='owner' and not public.fitos_is_platform_admin() then raise exception 'Only platform administrators can manage owners'; end if;
 update public.fitos_memberships set enabled=allow_access where gym_id=g and user_id=member and enabled is distinct from allow_access;
 if found then
  insert into public.fitos_audit_events(actor_id,gym_id,action,detail)
  values(auth.uid(),g,'membership_access',jsonb_build_object('member',member::text,'enabled',allow_access));
 end if;
end $$;
revoke execute on function public.fitos_set_member_access(uuid,uuid,boolean) from public,anon;
grant execute on function public.fitos_set_member_access(uuid,uuid,boolean) to authenticated;
commit;
